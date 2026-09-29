export type EncodeFormat = 'gif' | 'apng';

/** main → worker */
export type ToWorker =
  | { cmd: 'init'; format: EncodeFormat; width: number; height: number; delays: number[] }
  | { cmd: 'sample'; buffer: ArrayBuffer }
  | { cmd: 'palette' }
  | { cmd: 'frame'; index: number; buffer: ArrayBuffer }
  | { cmd: 'finish' };

/** worker → main */
export type FromWorker =
  | { type: 'progress'; value: number }
  | { type: 'done'; buffer: ArrayBuffer }
  | { type: 'error'; code: 'encode' };
