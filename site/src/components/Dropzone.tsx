import { useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { TgsErrorCode } from '../lib/tgs';

interface Props {
  onFile: (file: File) => void;
  onError: (code: TgsErrorCode) => void;
}

export default function Dropzone({ onFile, onError }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
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
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        accept(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-2xl border-2 border-dashed p-4 transition-colors sm:p-5 ${
        dragOver ? 'border-vio bg-vio/5' : 'border-transparent sm:border-line/60'
      }`}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-primary w-full rounded-xl px-7 py-3 text-base font-bold sm:w-auto"
        >
          {t('drop.upload')}
        </button>

        <button
          type="button"
          onClick={() => void loadDemo()}
          disabled={loadingDemo}
          className="w-full rounded-xl border border-line bg-panel px-7 py-3 text-base font-semibold text-ink transition-colors hover:bg-panel2 disabled:opacity-50 sm:w-auto"
        >
          {t('drop.demoShort')}
        </button>

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
    </div>
  );
}
