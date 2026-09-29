import lottie, { type AnimationItem } from 'lottie-web';
import type { TgsMeta } from './tgs';

export interface RenderOpts {
  size: number;
  /** output frames per second */
  fps: number;
  /** render only these frame indices (for palette sampling / stills) */
  only?: number[];
}

function cloneLottie(data: Record<string, unknown>): Record<string, unknown> {
  return typeof structuredClone === 'function'
    ? structuredClone(data)
    : (JSON.parse(JSON.stringify(data)) as Record<string, unknown>);
}

export function frameCount(meta: TgsMeta, fps: number): number {
  const step = meta.fps / fps;
  return Math.max(1, Math.floor((meta.outPoint - meta.inPoint) / step));
}

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
  if (!ctx) throw new Error('no-2d-context');
  return { canvas, ctx };
}

/**
 * Renders the animation frame by frame (transparent background preserved)
 * and hands RGBA buffers to the sink. Rendering is done on the main thread
 * because lottie-web's canvas renderer needs the DOM; heavy encoding runs in a worker.
 */
export async function renderAnimation(
  meta: TgsMeta,
  opts: RenderOpts,
  sink: (index: number, rgba: Uint8ClampedArray, isLast: boolean) => void,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  const { ctx } = makeCanvas(opts.size);
  // no `container`: lottie-web then draws into the provided context directly
  // and sizes itself from canvas.width (dpr defaults to 1)
  const anim = lottie.loadAnimation<'canvas'>({
    // runtime supports headless rendering without a container; types do not
    container: undefined as unknown as HTMLElement,
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: cloneLottie(meta.lottie),
    rendererSettings: {
      context: ctx,
      clearCanvas: true,
      preserveAspectRatio: 'xMidYMid meet',
    },
  });

  const indices: number[] = opts.only ?? range(frameCount(meta, opts.fps));
  const step = meta.fps / opts.fps;
  const total = indices.length;

  try {
    await waitLottieReady(anim, meta);
    for (let n = 0; n < total; n++) {
      const i = indices[n];
      anim.goToAndStop(meta.inPoint + i * step, true);
      const frame = ctx.getImageData(0, 0, opts.size, opts.size);
      sink(i, frame.data, n === total - 1);
      onProgress?.((n + 1) / total);
      // yield to the UI so the phone stays responsive during long renders
      if (n % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    anim.destroy();
  }
}

/** Renders one frame and returns it as a PNG blob (static emoji). */
export async function renderStill(
  meta: TgsMeta,
  size: number,
  frameIndex: number,
  fps: number,
): Promise<Blob> {
  const { ctx } = makeCanvas(size);
  const anim = lottie.loadAnimation<'canvas'>({
    // runtime supports headless rendering without a container; types do not
    container: undefined as unknown as HTMLElement,
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: cloneLottie(meta.lottie),
    rendererSettings: {
      context: ctx,
      clearCanvas: true,
      preserveAspectRatio: 'xMidYMid meet',
    },
  });

  await waitLottieReady(anim, meta);
  anim.goToAndStop(meta.inPoint + (frameIndex * meta.fps) / fps, true);

  const blob = await new Promise<Blob | null>((resolve) =>
    ctx.canvas.toBlob(resolve, 'image/png'),
  );
  anim.destroy();
  if (!blob) throw new Error('png-encode-failed');
  return blob;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function once(anim: AnimationItem, event: 'DOMLoaded'): Promise<void> {
  return new Promise((resolve) => {
    const cb = () => {
      anim.removeEventListener(event, cb);
      resolve();
    };
    anim.addEventListener(event, cb);
  });
}

/** lottie sets up asynchronously; embedded image assets decode after DOMLoaded */
async function waitLottieReady(anim: AnimationItem, meta: TgsMeta): Promise<void> {
  if (!(anim as { isLoaded?: boolean }).isLoaded) await once(anim, 'DOMLoaded');
  const assets = meta.lottie.assets as { p?: unknown }[] | undefined;
  const hasEmbeddedImages = assets?.some(
    (a) => typeof a?.p === 'string' && (a.p as string).startsWith('data:'),
  );
  if (hasEmbeddedImages) await new Promise((r) => setTimeout(r, 100));
}
