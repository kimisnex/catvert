import { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';
import { useI18n } from '../i18n';
import { parseTgs, type TgsErrorCode } from '../lib/tgs';

interface Props {
  onFile: (file: File) => void;
  onError: (code: TgsErrorCode) => void;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Idle looping animation shown inside the dropzone — the tool demonstrating
 * itself. It loads the very same public/demo.tgs the "try demo" button
 * converts, through the same parsing path users' files take.
 */
function DemoEmoji() {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('demo.tgs')
      .then((res) => {
        if (!res.ok) throw new Error('demo fetch failed');
        return res.blob();
      })
      .then((blob) => parseTgs(new File([blob], 'demo.tgs')))
      .then((meta) => {
        if (alive) setData(meta.lottie);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !data) return;
    const anim = lottie.loadAnimation({
      container: box,
      renderer: 'canvas',
      loop: true,
      autoplay: !prefersReducedMotion(),
      animationData: JSON.parse(JSON.stringify(data)),
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    return () => anim.destroy();
  }, [data]);

  return (
    <div className="checker rounded-xl p-1 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)]">
      <div
        ref={boxRef}
        aria-label={data ? undefined : t('drop.title')}
        className="h-20 w-20 md:h-24 md:w-24 [&_canvas]:h-full [&_canvas]:w-full"
      />
    </div>
  );
}

export default function Dropzone({ onFile, onError }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const accept = (file: File | undefined | null) => {
    if (file) onFile(file);
  };

  const loadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('demo.tgs');
      if (!res.ok) throw new Error();
      onFile(new File([await res.blob()], 'demo.tgs'));
    } catch {
      onError('bad-file');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('drop.title')}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      className={`group relative flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-all md:py-10 ${
        dragging
          ? 'border-vio bg-vio/10 scale-[1.01]'
          : 'border-line bg-panel/70 hover:border-mute/50 hover:bg-panel'
      }`}
    >
      <DemoEmoji />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
        className="btn-primary rounded-xl px-6 py-2.5 text-sm font-bold md:text-base"
      >
        {t('drop.upload')}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void loadDemo();
        }}
        disabled={loadingDemo}
        className="mt-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-vio underline decoration-vio/40 underline-offset-4 transition-colors hover:decoration-vio disabled:opacity-50 md:text-sm"
      >
        {t('drop.demo')}
      </button>

      <p className="mt-1.5 font-mono text-[11px] text-mute/80">{t('drop.hint')}</p>

      <input
        ref={inputRef}
        type="file"
        accept=".tgs,.json,application/gzip,application/x-gzip,application/octet-stream"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
