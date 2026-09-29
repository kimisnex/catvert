/// <reference lib="webworker" />
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import UPNG from 'upng-js';
import type { FromWorker, ToWorker } from './worker-protocol';

/**
 * Encoding runs here so the UI thread stays smooth on phones.
 *
 * GIF transparency model: GIF has 1-bit alpha, so every frame is pre-processed
 * by binarizing alpha (a < 128 -> fully transparent black, else opaque).
 * Palette index 0 is reserved as the canonical transparent entry, which every
 * fully-transparent pixel hits exactly (distance 0 in RGBA space).
 */

const ALPHA_THRESHOLD = 128;

let format: Extract<ToWorker, { cmd: 'init' }>['format'] = 'gif';
let width = 0;
let height = 0;
let delays: number[] = [];

let gif: ReturnType<typeof GIFEncoder> | null = null;
let palette: number[][] | null = null;
let hasAlpha = false;
let sampleRgba: Uint8Array[] = [];

// APNG keeps raw RGBA frames until finish()
const apngFrames: ArrayBuffer[] = [];
let apngDone = 0;

function post(msg: FromWorker, transfer?: Transferable[]): void {
  (self as unknown as Worker).postMessage(msg, transfer ?? []);
}

/** 1-bit alpha: dim pixels become pure [0,0,0,0] so they hit palette index 0 exactly. */
function binarizeAlpha(rgba: Uint8Array): boolean {
  let transparentFound = false;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < ALPHA_THRESHOLD) {
      rgba[i] = 0;
      rgba[i + 1] = 0;
      rgba[i + 2] = 0;
      rgba[i + 3] = 0;
      transparentFound = true;
    } else {
      rgba[i + 3] = 255;
    }
  }
  return transparentFound;
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function buildPalette(): void {
  const merged = concat(sampleRgba);
  hasAlpha = binarizeAlpha(merged);

  // leave one slot for the reserved transparent entry
  const raw = quantize(merged, hasAlpha ? 255 : 256, {
    format: 'rgba4444',
    oneBitAlpha: true,
    clearAlpha: true,
    clearAlphaThreshold: ALPHA_THRESHOLD - 1,
    clearAlphaColor: 0x00,
  });

  const opaque = raw.filter((c) => (c[3] ?? 255) >= ALPHA_THRESHOLD);
  palette = hasAlpha ? [[0, 0, 0, 0], ...opaque] : opaque;
  sampleRgba = [];
}

function handleGifFrame(index: number, rgba: Uint8Array): void {
  if (!gif || !palette) return;
  binarizeAlpha(rgba);
  const indexed = applyPalette(rgba, palette, 'rgba4444');
  gif.writeFrame(indexed, width, height, {
    palette,
    transparent: hasAlpha,
    transparentIndex: 0,
    delay: delays[index] ?? 100,
    dispose: 2,
  });
  post({ type: 'progress', value: (index + 1) / delays.length });
}

function finish(): void {
  try {
    if (format === 'gif' && gif) {
      gif.finish();
      const bytes = gif.bytes();
      post({ type: 'done', buffer: bytes.buffer as ArrayBuffer }, [bytes.buffer]);
      return;
    }
    if (format === 'apng') {
      const png = UPNG.encode(apngFrames, width, height, 256, delays);
      post({ type: 'done', buffer: png }, [png]);
      return;
    }
    post({ type: 'error', code: 'encode' });
  } catch {
    post({ type: 'error', code: 'encode' });
  }
}

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const msg = event.data;
  switch (msg.cmd) {
    case 'init': {
      format = msg.format;
      width = msg.width;
      height = msg.height;
      delays = msg.delays;
      if (msg.format === 'gif') gif = GIFEncoder();
      break;
    }
    case 'sample':
      sampleRgba.push(new Uint8Array(msg.buffer));
      break;
    case 'palette':
      buildPalette();
      break;
    case 'frame': {
      const rgba = new Uint8Array(msg.buffer);
      if (format === 'gif') {
        handleGifFrame(msg.index, rgba);
      } else {
        apngFrames.push(rgba.buffer as ArrayBuffer);
        apngDone++;
        post({ type: 'progress', value: apngDone / delays.length });
      }
      break;
    }
    case 'finish':
      finish();
      break;
  }
};
