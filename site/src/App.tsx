import { useCallback, useEffect, useRef, useState } from 'react';
import Dropzone from './components/Dropzone';
import Header from './components/Header';
import PreviewPlayer from './components/PreviewPlayer';
import SettingsPanel from './components/SettingsPanel';
import ResultCard, { type ConvertResult } from './components/ResultCard';
import { useI18n, type DictKey } from './i18n';
import { convertTgs, FORMAT_EXT, type ConvertProgress, type ConvertSettings } from './lib/convert';
import { frameCount } from './lib/frames';
import { parseTgs, TgsError, type TgsErrorCode, type TgsMeta } from './lib/tgs';

const DEFAULT_SETTINGS: ConvertSettings = { format: 'gif', size: 256, fps: 30, frameIndex: 0 };

const settingsKey = (name: string | undefined, s: ConvertSettings): string =>
  JSON.stringify([name, s.format, s.size, s.fps, s.frameIndex]);

export default function App() {
  const { t } = useI18n();
  const [meta, setMeta] = useState<TgsMeta | null>(null);
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [busy, setBusy] = useState<ConvertProgress | null>(null);
  const [errorKey, setErrorKey] = useState<DictKey | null>(null);
  const busyRef = useRef(false);
  const convertedKeyRef = useRef<string | null>(null);

  // keep a stale object URL from leaking
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  // dropping anywhere outside the zone must not navigate the tab away
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => {
      window.removeEventListener('dragover', prevent);
      window.removeEventListener('drop', prevent);
    };
  }, []);

  // keep the PNG frame index inside the timeline when fps changes
  useEffect(() => {
    if (!meta) return;
    const total = frameCount(meta, settings.fps);
    if (settings.frameIndex >= total) {
      setSettings((s) => ({ ...s, frameIndex: 0 }));
    }
  }, [meta, settings.fps, settings.frameIndex]);

  const runConvert = useCallback(async (m: TgsMeta, s: ConvertSettings) => {
    if (busyRef.current) return;
    busyRef.current = true;
    convertedKeyRef.current = settingsKey(m.name, s);
    setErrorKey(null);
    setBusy({ stage: 'render', value: 0 });
    try {
      const blob = await convertTgs(m, s, setBusy);
      setResult({
        url: URL.createObjectURL(blob),
        filename: `${m.name}.${FORMAT_EXT[s.format]}`,
        format: s.format,
        sizePx: s.size,
        bytes: blob.size,
        frames: s.format === 'png' ? null : frameCount(m, s.fps),
      });
    } catch {
      setErrorKey('err.encode');
    } finally {
      setBusy(null);
      busyRef.current = false;
    }
  }, []);

  // a result already exists and settings changed — silently rebuild it,
  // so the download card always matches what the chips say
  useEffect(() => {
    if (!meta || !result) return;
    const key = settingsKey(meta.name, settings);
    if (key === convertedKeyRef.current) return;
    const timer = setTimeout(() => void runConvert(meta, settings), 350);
    return () => clearTimeout(timer);
  }, [meta, settings, result, busy, runConvert]);

  const handleFile = useCallback(
    async (file: File) => {
      setErrorKey(null);
      try {
        const m = await parseTgs(file);
        setSettings((s) => ({ ...s, frameIndex: 0 }));
        setMeta(m);
        void runConvert(m, { ...settings, frameIndex: 0 });
      } catch (e) {
        const code: TgsErrorCode = e instanceof TgsError ? e.code : 'bad-file';
        setErrorKey(`err.${code}`);
      }
    },
    [runConvert, settings],
  );

  const reset = () => {
    setMeta(null);
    setResult(null);
    setErrorKey(null);
    setSettings(DEFAULT_SETTINGS);
    convertedKeyRef.current = null;
  };

  const patchSettings = (patch: Partial<ConvertSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  };

  const busyLabel = busy
    ? busy.stage === 'render' && meta
      ? t('convert.render', {
          a: Math.round(busy.value * frameCount(meta, settings.fps)),
          b: frameCount(meta, settings.fps),
        })
      : t('convert.encode', { format: settings.format.toUpperCase() })
    : '';

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 md:px-6">

      <main className="flex flex-1 flex-col pb-8">
        {errorKey && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl border border-warn/40 bg-warn/10 p-3"
          >
            <p className="flex-1 text-xs leading-relaxed text-ink md:text-sm">
              <span className="font-bold">{t('err.head')}. </span>
              {t(errorKey)}
            </p>
            <button
              type="button"
              onClick={() => setErrorKey(null)}
              aria-label="Close"
              className="shrink-0 rounded-lg px-1 text-mute transition-colors hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {!meta && (
          <section className="flex flex-1 flex-col items-center justify-center gap-12 py-16 text-center">
            <h1 className="flex items-center gap-3 font-display text-6xl font-bold tracking-tight text-ink md:text-7xl">
              <img src="/logo.png" alt="" className="h-28 w-28 object-contain md:h-36 md:w-36" />
              <span>
                cat<span className="text-vio">vert</span>
              </span>
            </h1>
            <Dropzone onFile={(f) => void handleFile(f)} onError={(c) => setErrorKey(`err.${c}`)} />
          </section>
        )}

        {meta && (
          <div className="grid grid-cols-1 items-start gap-5 pt-8 md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] md:pt-10">
            <div className="min-w-0 md:sticky md:top-5">
              <PreviewPlayer
                meta={meta}
                format={settings.format}
                fps={settings.fps}
                frameIndex={settings.frameIndex}
              />
              <p className="mt-2 font-mono text-[11px] text-mute/70">
                {t('meta.src')}: {meta.width}×{meta.height} · {meta.fps} fps ·{' '}
                {meta.durationSec.toFixed(2)} {t('meta.sec')}
              </p>
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-xl border border-line bg-panel/50 p-3.5 md:p-4">
                <SettingsPanel
                  meta={meta}
                  settings={settings}
                  onChange={patchSettings}
                  disabled={busy !== null}
                />

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => void runConvert(meta, settings)}
                    disabled={busy !== null}
                    className="btn-primary w-full rounded-xl px-4 py-2.5 font-display text-xs font-bold md:text-sm"
                  >
                    {busy ? busyLabel : t('convert')}
                  </button>
                  {busy && (
                    <div
                      className="mt-2.5 h-1 overflow-hidden rounded-full bg-line"
                      role="progressbar"
                      aria-valuenow={Math.round(busy.value * 100)}
                    >
                      <div
                        className="h-full rounded-full bg-vio transition-[width] duration-150"
                        style={{ width: `${Math.max(4, Math.round(busy.value * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {result && <ResultCard result={result} onReset={reset} />}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-line/60 py-4">
        <p className="font-mono text-[11px] text-mute/70">{t('footer')}</p>
      </footer>
      </div>
    </div>
  );
}
