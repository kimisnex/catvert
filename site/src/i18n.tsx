import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'ru' | 'en';

const ru = {
  'logo.tail': 'конвертер стикеров',

  'h1.pre': 'Стикер Telegram →',
  'h1.grad': 'живой эмодзи',
  'sub': 'Кинь файл .tgs — получи GIF с прозрачностью или аккуратный PNG. Всё считается прямо в браузере: файл никуда не загружается.',

  'drop.title': 'Перетащи .tgs сюда',
  'drop.or': 'или нажми и выбери файл',
  'drop.upload': 'Загрузить .tgs',
  'drop.hint': 'анимированный стикер Telegram · или Lottie .json',
  'drop.demo': 'Нет файла под рукой? Попробуй демо-стикер',
  'drop.overlay': 'Отпускай!',

  'meta.src': 'источник',
  'meta.sec': 'сек',

  'settings.format': 'Формат',
  'format.gif': 'GIF',
  'format.apng': 'APNG',
  'format.png': 'PNG',
  'format.hint.gif': 'Играет везде. Прозрачность резкая, по пикселям.',
  'format.hint.apng': 'Гладкие полупрозрачные края. Свежие плееры.',
  'format.hint.png': 'Статичная картинка — кадр выбирается ниже.',
  'settings.size': 'Размер',
  'settings.sizeHint': '{n}×{n} px',
  'settings.fps': 'Частота кадров',
  'settings.fps.src': 'в стикере: {fps} fps',
  'settings.frame': 'Кадр',
  'convert': 'Сконвертировать',
  'convert.again': 'Сконвертировать заново',
  'convert.render': 'Рендерю кадр {a} из {b}…',
  'convert.encode': 'Собираю {format}…',
  'convert.done': 'Готово',

  'result.download': 'Скачать {ext}',
  'result.frames': 'кадров: {n}',
  'result.again': 'Конвертировать другой файл',

  'err.head': 'Не получилось',
  'err.not-gzip': 'Это не TGS-файл: внутри нет gzip. Нужен файл .tgs из Telegram.',
  'err.bad-json': 'Файл распаковался, но внутри не Lottie-анимация. Это точно .tgs?',
  'err.no-layers': 'В анимации нет слоёв — конвертировать нечего.',
  'err.bad-file': 'Файл не читается. Попробуй другой.',
  'err.encode': 'Сборка не удалась. Попробуй другой формат или размер.',

  'footer': 'Работает без сервера — ничего никуда не отправляется. Внутри lottie-web + gifenc.',
} as const;

export type DictKey = keyof typeof ru;

const en: Record<DictKey, string> = {
  'logo.tail': 'sticker converter',

  'h1.pre': 'Telegram sticker →',
  'h1.grad': 'living emoji',
  'sub': 'Drop a .tgs file — get a transparent GIF or a crisp PNG. Everything renders in your browser: the file never leaves your device.',

  'drop.title': 'Drop your .tgs here',
  'drop.or': 'or tap to choose a file',
  'drop.upload': 'Upload .tgs',
  'drop.hint': 'Telegram animated sticker · or Lottie .json',
  'drop.demo': 'No file at hand? Try the demo sticker',
  'drop.overlay': 'Drop it!',

  'meta.src': 'source',
  'meta.sec': 'sec',

  'settings.format': 'Format',
  'format.gif': 'GIF',
  'format.apng': 'APNG',
  'format.png': 'PNG',
  'format.hint.gif': 'Plays everywhere. Pixel-sharp 1-bit transparency.',
  'format.hint.apng': 'Smooth semi-transparent edges. Modern players.',
  'format.hint.png': 'Still image — pick the frame below.',
  'settings.size': 'Size',
  'settings.sizeHint': '{n}×{n} px',
  'settings.fps': 'Frame rate',
  'settings.fps.src': 'sticker: {fps} fps',
  'settings.frame': 'Frame',
  'convert': 'Convert',
  'convert.again': 'Convert again',
  'convert.render': 'Rendering frame {a} of {b}…',
  'convert.encode': 'Building {format}…',
  'convert.done': 'Done',

  'result.download': 'Download {ext}',
  'result.frames': 'frames: {n}',
  'result.again': 'Convert another file',

  'err.head': 'Something went wrong',
  'err.not-gzip': 'Not a TGS file: no gzip inside. You need a .tgs exported from Telegram.',
  'err.bad-json': 'The file unpacked, but there is no Lottie animation inside. Is it really a .tgs?',
  'err.no-layers': 'This animation has no layers — nothing to convert.',
  'err.bad-file': 'The file cannot be read. Try another one.',
  'err.encode': 'Encoding failed. Try a different format or size.',

  'footer': 'Runs fully client-side — nothing is ever uploaded. Powered by lottie-web + gifenc.',
};

const dicts: Record<Lang, Record<DictKey, string>> = { ru, en };

export function detectLang(): Lang {
  const saved = localStorage.getItem('lang');
  if (saved === 'ru' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: DictKey, vars?: Record<string, string | number>) => {
    let s: string = dicts[lang][key];
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    }
    return s;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n outside provider');
  return ctx;
}
