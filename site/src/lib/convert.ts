import { frameCount, renderAnimation, renderStill } from './frames';
import type { TgsMeta } from './tgs';
import type { EncodeFormat } from './worker-protocol';

export type ConvertFormat = EncodeFormat | 'png';

export interface ConvertSettings {
  format: ConvertFormat;
  size: number;
  fps: number;
  /** which frame to grab for PNG */
  frameIndex: number;
}

export interface ConvertProgress {
  stage: 'render' | 'encode';
  value: number;
}

export const FORMAT_MIME: Record<ConvertFormat, string> = {
  gif: 'image/gif',
  apng: 'image/apng',
  png: 'image/png',
};

export const FORMAT_EXT: Record<ConvertFormat, string> = {
  gif: 'gif',
  apng: 'png',
  png: 'png',
};

export async function convertTgs(
  meta: TgsMeta,
  settings: ConvertSettings,
  onProgress: (p: ConvertProgress) => void,
): Promise<Blob> {
  if (settings.format === 'png') {
    return renderStill(meta, settings.size, settings.frameIndex, settings.fps);
  }
  return encodeAnimation(meta, settings.format, settings.size, settings.fps, onProgress);
}

async function encodeAnimation(
  meta: TgsMeta,
  format: EncodeFormat,
  size: number,
  fps: number,
  onProgress: (p: ConvertProgress) => void,
): Promise<Blob> {
  const count = frameCount(meta, fps);
  const delays = Array.from({ length: count }, () => Math.round(1000 / fps));

  const worker = new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });

  const done = new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress({ stage: 'encode', value: 0.85 + 0.15 * msg.value });
      } else if (msg.type === 'done') {
        resolve(new Blob([msg.buffer], { type: FORMAT_MIME[format] }));
      } else {
        reject(new Error('encode'));
      }
    };
    worker.onerror = () => reject(new Error('encode'));
  });

  try {
    worker.postMessage({ cmd: 'init', format, width: size, height: size, delays });

    // GIF: sample a few spread-out frames first to build one stable global palette
    const sampleWeight = format === 'gif' ? 0.08 : 0;
    if (format === 'gif') {
      const samples = pickSamples(count, 12);
      await renderAnimation(
        meta,
        { size, fps, only: samples },
        (_index, rgba) =>
          worker.postMessage({ cmd: 'sample', buffer: rgba.buffer }, [rgba.buffer]),
        (v) => onProgress({ stage: 'render', value: sampleWeight * v }),
      );
      worker.postMessage({ cmd: 'palette' });
    }

    await renderAnimation(
      meta,
      { size, fps },
      (index, rgba) =>
        worker.postMessage({ cmd: 'frame', index, buffer: rgba.buffer }, [rgba.buffer]),
      (v) => onProgress({ stage: 'render', value: sampleWeight + (0.85 - sampleWeight) * v }),
    );

    worker.postMessage({ cmd: 'finish' });
    return await done;
  } finally {
    worker.terminate();
  }
}

/** n indices evenly spread across [0, count) for palette sampling */
function pickSamples(count: number, n: number): number[] {
  if (count <= n) return Array.from({ length: count }, (_, i) => i);
  const set = new Set<number>();
  for (let k = 0; k < n; k++) set.add(Math.round((k * (count - 1)) / (n - 1)));
  return [...set];
}
