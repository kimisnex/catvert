import { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { useI18n } from '../i18n';
import { frameCount } from '../lib/frames';
import type { ConvertFormat } from '../lib/convert';
import type { TgsMeta } from '../lib/tgs';

interface Props {
  meta: TgsMeta;
  format: ConvertFormat;
  fps: number;
  /** still frame index (used when format === 'png') */
  frameIndex: number;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function PreviewPlayer({ meta, format, fps, frameIndex }: Props) {
  const { t } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);

  const total = frameCount(meta, fps);

  // lottie creates and hi-dpi-sizes its own canvas inside the wrapper box;
  // the animation is re-created on container resize (lottie has no auto-resize)
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const create = () => {
      animRef.current?.destroy();
      animRef.current = lottie.loadAnimation({
        container: box,
        renderer: 'canvas',
        loop: true,
        autoplay: !reducedMotion(),
        animationData: JSON.parse(JSON.stringify(meta.lottie)),
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid meet',
        },
      });
      animRef.current.addEventListener('enterFrame', (e) => {
        const f = Math.floor((e as { currentTime: number }).currentTime);
        setFrame((prev) => (prev === f ? prev : f));
      });
    };
    create();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastW = box.offsetWidth;
    const onResize = () => {
      if (box.offsetWidth === lastW) return;
      lastW = box.offsetWidth;
      clearTimeout(timer);
      timer = setTimeout(create, 200);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [meta]);

  // format / fps / frameIndex changes drive the playback mode
  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;
    if (format === 'png') {
      setPlaying(false);
      const still = Math.min(frameIndex, total - 1);
      setFrame(still);
      anim.goToAndStop(meta.inPoint + (frameIndex * meta.fps) / fps, true);
    } else {
      anim.goToAndStop(Math.min(frame, total - 1), true);
      if (playing && !reducedMotion()) anim.play();
    }
    // `frame` intentionally omitted: scrubbing drives goToAndStop itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, fps, frameIndex, playing, total, meta]);

  const scrub = (value: number) => {
    setPlaying(false);
    setFrame(value);
    animRef.current?.goToAndStop(value, true);
  };

  const icon = playing ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={boxRef}
        className="checker mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl p-1.5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.04)] [&_canvas]:h-full [&_canvas]:w-full"
      />

      <div className={`flex items-center gap-3 ${format === 'png' ? 'opacity-40' : ''}`}>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={format === 'png'}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-ink transition-colors hover:bg-panel2 disabled:pointer-events-none"
        >
          {icon}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={Math.min(frame, total - 1)}
          onChange={(e) => scrub(Number(e.target.value))}
          disabled={format === 'png'}
          aria-label={t('settings.frame')}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-vio disabled:cursor-default"
        />
        <span className="shrink-0 font-mono text-[11px] text-mute" aria-live="off">
          {Math.min(frame, total - 1)}/{total}
        </span>
      </div>
    </div>
  );
}
