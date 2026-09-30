import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n, type Lang } from '../i18n';

function FlagRU({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect y="5.33" width="24" height="5.33" fill="#0039a6" />
      <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
    </svg>
  );
}

function FlagUS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#b22234" />
      {[1, 3, 5, 7, 9, 11, 13].map((i) => (
        <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#fff" />
      ))}
      <rect width="11" height={16 * (7 / 13)} fill="#3c3b6e" />
    </svg>
  );
}

const LANGS: { id: Lang; name: string; short: string; Flag: (p: { className?: string }) => ReactElement }[] = [
  { id: 'en', name: 'English', short: 'EN', Flag: FlagUS },
  { id: 'ru', name: 'Русский', short: 'RU', Flag: FlagRU },
];

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 fill-none stroke-current stroke-2 ${className ?? ''}`} aria-hidden="true">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Burger({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="3" y="5" width="18" height="2.6" rx="1.3" />
      <rect x="3" y="10.7" width="18" height="2.6" rx="1.3" />
      <rect x="3" y="16.4" width="18" height="2.6" rx="1.3" />
    </svg>
  );
}

function Close({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function Header() {
  const { lang, setLang } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setLangOpen(false);
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const pickLang = (id: Lang) => {
    setLang(id);
    setLangOpen(false);
    setMenuOpen(false);
  };

  return (
    <header ref={rootRef} className="sticky top-3 z-50 px-4 md:px-6">
      <div className="mx-auto flex max-w-4xl items-center justify-between rounded-2xl border border-line/80 bg-panel/90 py-2 pl-2.5 pr-2.5 shadow-lg shadow-black/40 backdrop-blur-md">
        <a href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl pr-2">
          <img src="/logo.jpg" alt="" className="h-9 w-9 rounded-xl object-cover" />
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            cat<span className="text-vio">vert</span>
          </span>
        </a>

        {/* desktop nav */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <a
            href="https://github.com/kimisnex"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-mute transition-colors hover:bg-panel2 hover:text-ink"
          >
            <GitHubIcon className="h-4 w-4" />
            GitHub
          </a>

          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              aria-expanded={langOpen}
              className="flex items-center gap-2 rounded-xl border border-line bg-panel2/50 px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-mute/40"
            >
              <current.Flag className="h-4 w-6 rounded-[3px]" />
              <span>{current.name}</span>
              <span className="text-mute">({current.short})</span>
              <Chevron className={langOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {langOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-xl border border-line bg-panel p-1.5 shadow-xl shadow-black/50">
                {LANGS.map(({ id, name, short, Flag }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickLang(id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                      id === lang ? 'bg-panel2 text-ink' : 'text-mute hover:bg-panel2/60 hover:text-ink'
                    }`}
                  >
                    <Flag className="h-4 w-6 shrink-0 rounded-[3px]" />
                    <span>{name}</span>
                    <span className="text-xs font-medium opacity-60">({short})</span>
                    {id === lang && (
                      <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 fill-none stroke-vio stroke-[2.5]" aria-hidden="true">
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* mobile burger */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Menu"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-vio transition-colors hover:bg-panel2 md:hidden"
        >
          {menuOpen ? <Close className="h-5 w-5" /> : <Burger className="h-5 w-5" />}
        </button>
      </div>

      {/* mobile panel */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-4xl rounded-2xl border border-line/80 bg-panel/95 p-2 shadow-xl shadow-black/50 backdrop-blur-md md:hidden">
          <a
            href="https://github.com/kimisnex"
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-ink transition-colors hover:bg-panel2"
          >
            <GitHubIcon className="h-5 w-5" />
            GitHub
          </a>

          <div className="mx-1 my-2 border-t border-line/60" />

          <p className="px-4 pb-1 pt-1 text-xs font-bold uppercase tracking-wider text-mute">Language</p>
          {LANGS.map(({ id, name, short, Flag }) => (
            <button
              key={id}
              type="button"
              onClick={() => pickLang(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                id === lang ? 'bg-panel2 text-ink' : 'text-mute hover:bg-panel2/60 hover:text-ink'
              }`}
            >
              <Flag className="h-4 w-6 shrink-0 rounded-[3px]" />
              <span>{name}</span>
              <span className="text-sm font-medium opacity-60">({short})</span>
              {id === lang && (
                <svg viewBox="0 0 24 24" className="ml-auto h-4 w-4 fill-none stroke-vio stroke-[2.5]" aria-hidden="true">
                  <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
