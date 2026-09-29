export interface TgsMeta {
  /** parsed Lottie JSON (bodymovin) */
  lottie: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  inPoint: number;
  outPoint: number;
  durationSec: number;
  /** original file name without extension */
  name: string;
}

export type TgsErrorCode = 'not-gzip' | 'bad-json' | 'no-layers' | 'bad-file';

export class TgsError extends Error {
  constructor(public code: TgsErrorCode) {
    super(code);
  }
}

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

function isGzip(bytes: Uint8Array): boolean {
  return bytes.length > 2 && bytes[0] === GZIP_MAGIC_0 && bytes[1] === GZIP_MAGIC_1;
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'function') {
    const stream = new Blob([bytes as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  const pako = await import('pako');
  return pako.ungzip(bytes);
}

function asText(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/** Accepts a .tgs (gzipped Lottie) or a raw Lottie .json and returns normalized metadata. */
export async function parseTgs(file: File): Promise<TgsMeta> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    throw new TgsError('bad-file');
  }

  if (bytes.length === 0) throw new TgsError('bad-file');

  let json: Record<string, unknown>;
  if (isGzip(bytes)) {
    let unpacked: Uint8Array;
    try {
      unpacked = await gunzip(bytes);
    } catch {
      throw new TgsError('bad-file');
    }
    try {
      json = JSON.parse(asText(unpacked)) as Record<string, unknown>;
    } catch {
      throw new TgsError('bad-json');
    }
  } else {
    // raw Lottie .json — accept as a courtesy
    try {
      json = JSON.parse(asText(bytes)) as Record<string, unknown>;
    } catch {
      throw new TgsError('not-gzip');
    }
  }

  const layers = json.layers;
  if (!Array.isArray(layers) || layers.length === 0) throw new TgsError('no-layers');

  const fps = Number(json.fr) || 60;
  const inPoint = Number(json.ip) || 0;
  const outPoint = Number(json.op) || inPoint + fps;

  return {
    lottie: json,
    width: Number(json.w) || 512,
    height: Number(json.h) || 512,
    fps,
    inPoint,
    outPoint: Math.max(outPoint, inPoint + 1),
    durationSec: (outPoint - inPoint) / fps,
    name: file.name.replace(/\.(tgs|json)$/i, '') || 'sticker',
  };
}
