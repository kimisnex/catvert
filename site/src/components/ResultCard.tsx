import { useI18n } from '../i18n';
import type { ConvertFormat } from '../lib/convert';

export interface ConvertResult {
  url: string;
  filename: string;
  format: ConvertFormat;
  sizePx: number;
  bytes: number;
  frames: number | null;
}

interface Props {
  result: ConvertResult;
  onReset: () => void;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResultCard({ result, onReset }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-panel/70 p-3">
      <div className="checker shrink-0 rounded-lg p-0.5">
        <img
          src={result.url}
          alt={result.filename}
          className="h-11 w-11 object-contain md:h-12 md:w-12"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs font-semibold text-ink">{result.filename}</p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-mute">
          {result.sizePx}×{result.sizePx} · {humanSize(result.bytes)}
          {result.frames !== null && ` · ${t('result.frames', { n: result.frames })}`}
        </p>
      </div>

      <a
        href={result.url}
        download={result.filename}
        className="btn-primary shrink-0 rounded-lg px-3 py-2 text-xs font-bold"
      >
        {t('result.download', { ext: result.format.toUpperCase() })}
      </a>

      <button
        type="button"
        onClick={onReset}
        aria-label={t('result.again')}
        title={t('result.again')}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-mute transition-colors hover:bg-panel2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
          <path d="M4 4v6h6M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 10a8 8 0 0 0-14.9-3M4 14a8 8 0 0 0 14.9 3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
