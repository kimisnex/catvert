/**
 * Builds demo and test sticker assets:
 *  - public/demo.tgs            — the cat emoji (scripts/test-assets/demo-emoji.png)
 *                                 embedded as a Lottie image layer with a bounce/squash loop.
 *                                 Used by the dropzone idle animation and the "try demo" button.
 *  - scripts/test-assets/colored.tgs — multicolor circles for GIF palette stress-testing.
 *
 * Usage: npm run make:demo
 */
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- demo: bouncing cat emoji (image layer) ----------

const png = readFileSync(join(root, 'scripts/test-assets/demo-emoji.png'));
const dataUri = `data:image/png;base64,${png.toString('base64')}`;

// 565x503 image scaled to ~62% inside the 512x512 stage
const S = 62;
const FRAMES = 90;
const EASE = { i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } };
const key = (t, s) => ({ t, s, to: [0, 0], ti: [0, 0], ...EASE });

const demo = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: FRAMES,
  w: 512,
  h: 512,
  nm: 'demo-emoji',
  ddd: 0,
  assets: [{ id: 'img_0', w: 565, h: 503, u: '', p: dataUri, e: 1 }],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 2,
      refId: 'img_0',
      nm: 'emoji',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            key(0, [256, 318]),
            key(30, [256, 186]),
            { t: 60, s: [256, 318], h: 1 },
            { t: FRAMES, s: [256, 318] },
          ],
        },
        // image layers draw from their top-left corner — anchor at the image
        // center (565x503) so position/scale transform around the middle
        a: { a: 0, k: [282.5, 251.5] },
        s: {
          a: 1,
          k: [
            key(0, [S * 1.16, S * 0.84]),
            key(8, [S, S]),
            key(16, [S * 0.9, S * 1.12]),
            key(30, [S, S]),
            key(44, [S * 0.9, S * 1.12]),
            key(52, [S, S]),
            key(60, [S * 1.16, S * 0.84]),
            key(68, [S, S]),
            { t: FRAMES, s: [S, S] },
          ],
        },
      },
      ao: 0,
      ip: 0,
      op: FRAMES,
      st: 0,
      bm: 0,
    },
  ],
};

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public/demo.tgs'), gzipSync(Buffer.from(JSON.stringify(demo)), { level: 9 }));
console.log(`public/demo.tgs written (${Math.round(png.length / 1024)} KB image inside)`);

// ---------- colored circles: palette stress test ----------

const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const bounce = (t) => 256 + Math.sin(t * Math.PI) * -140;

const keyColor = (t) => {
  // red -> green -> blue -> red
  const seg = (t % 1) * 3;
  const i = Math.floor(seg);
  const f = ease(seg - i);
  const stops = [
    [0.9, 0.2, 0.25],
    [0.15, 0.75, 0.35],
    [0.25, 0.45, 0.95],
  ];
  const a = stops[i % 3];
  const b = stops[(i + 1) % 3];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
};

const CF = 90;
const buildCircle = (ind, r, colorKf, posFn) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: `c${ind}`,
  sr: 1,
  ks: {
    o: { a: 0, k: 85 },
    r: { a: 0, k: 0 },
    p: {
      a: 1,
      k: Array.from({ length: CF + 1 }, (_, f) => ({
        t: f,
        s: posFn(f / CF),
        to: [0, 0],
        ti: [0, 0],
        i: { x: [0.5], y: [0.5] },
        o: { x: [0.5], y: [0.5] },
      })),
    },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: [100, 100] },
  },
  ao: 0,
  shapes: [
    {
      ty: 'gr',
      it: [
        { ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [r * 2, r * 2] } },
        {
          ty: 'fl',
          c: {
            a: 1,
            k: Array.from({ length: CF + 1 }, (_, f) => ({
              t: f,
              s: [...colorKf(f / CF), 1],
              i: { x: [0.5], y: [0.5] },
              o: { x: [0.5], y: [0.5] },
            })),
          },
          o: { a: 0, k: 100 },
        },
        {
          ty: 'tr',
          p: { a: 0, k: [0, 0] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
          sk: { a: 0, k: 0 },
          sa: { a: 0, k: 0 },
        },
      ],
    },
  ],
  ip: 0,
  op: CF,
  st: 0,
  bm: 0,
});

const colored = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: CF,
  w: 512,
  h: 512,
  nm: 'colored',
  ddd: 0,
  assets: [],
  layers: [
    buildCircle(1, 90, keyColor, (t) => [200, bounce(t)]),
    buildCircle(2, 70, (t) => keyColor(t + 1 / 3), (t) => [312 - bounce(t) + 116, 256]),
    buildCircle(3, 110, (t) => keyColor(t + 2 / 3), (t) => [170, 512 - bounce(t) - 140]),
  ],
};

writeFileSync(
  join(root, 'scripts/test-assets/colored.tgs'),
  gzipSync(Buffer.from(JSON.stringify(colored)), { level: 9 }),
);
console.log('scripts/test-assets/colored.tgs written');
