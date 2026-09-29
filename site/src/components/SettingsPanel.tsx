import { useI18n, type DictKey } from '../i18n';
import { frameCount } from '../lib/frames';
import type { ConvertFormat, ConvertSettings } from '../lib/convert';
import type { TgsMeta } from '../lib/tgs';

interface Props {
  meta: TgsMeta;
  settings: ConvertSettings;
  onChange: (patch: Partial<ConvertSettings>) => void;
  disabled?: boolean;
}

const FORMATS: ConvertFormat[] = ['gif', 'apng', 'png'];
const SIZES = [64, 128, 256, 512];
const FPS_OPTIONS = [60, 30, 24, 15];

function Chip({
  selected,
  disabled,
  onClick,
  children,
  label,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      className={`min-w-12 rounded-lg border px-2 py-1.5 font-mono text-xs font-semibold transition-colors disabled:opacity-40 ${
        selected
          ? 'border-vio/70 bg-vio/15 text-ink'
          : 'border-line bg-panel text-mute hover:border-mute/40 hover:bg-panel2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPanel({ meta, settings, onChange, disabled }: Props) {
  const { t } = useI18n();

  const fpsOptions = FPS_OPTIONS.filter((f) => f <= meta.fps);
  if (fpsOptions.length === 0) fpsOptions.push(meta.fps);

  const total = frameCount(meta, settings.fps);

  return (
    <div className={`flex flex-col gap-4 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      <section className="flex flex-col gap-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">{t('settings.format')}</h2>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t('settings.format')}>
          {FORMATS.map((f) => (
            <Chip
              key={f}
              label={t(`format.${f}` as DictKey)}
              selected={settings.format === f}
              onClick={() => onChange({ format: f })}
            >
              {t(`format.${f}` as DictKey)}
            </Chip>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-mute">
          {t(`format.hint.${settings.format}` as DictKey)}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">{t('settings.size')}</h2>
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t('settings.size')}>
          {SIZES.map((s) => (
            <Chip
              key={s}
              label={t('settings.sizeHint', { n: s })}
              selected={settings.size === s}
              onClick={() => onChange({ size: s })}
            >
              {s}
            </Chip>
          ))}
        </div>
      </section>

      {settings.format !== 'png' && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">
              {t('settings.fps')}
            </h2>
            <span className="font-mono text-[11px] text-mute/70">
              {t('settings.fps.src', { fps: meta.fps })}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={t('settings.fps')}>
            {fpsOptions.map((f) => (
              <Chip
                key={f}
                label={`${f} fps`}
                selected={settings.fps === f}
                onClick={() => onChange({ fps: f })}
              >
                {f}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {settings.format === 'png' && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-mute">
              {t('settings.frame')}
            </h2>
            <span className="font-mono text-[11px] text-mute">{settings.frameIndex}</span>
          </div>
          <input
            type="range"
            min={0}
            max={total - 1}
            value={Math.min(settings.frameIndex, total - 1)}
            onChange={(e) => onChange({ frameIndex: Number(e.target.value) })}
            aria-label={t('settings.frame')}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-vio"
          />
        </section>
      )}
    </div>
  );
}
