import { useI18n, type Lang } from '../i18n';

const LANGS: Lang[] = ['ru', 'en'];

export default function LangSwitch() {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center rounded-lg border border-line bg-panel p-0.5"
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
            lang === l ? 'bg-panel2 text-ink' : 'text-mute hover:text-ink'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
