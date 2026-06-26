// Centralized theme handling so the chosen theme applies on every page,
// not only while the Settings screen is mounted.

export type ThemeChoice = 'light' | 'dark' | 'system';

const THEME_KEY = 'scorelab-theme';
const CONTRAST_KEY = 'scorelab-contrast';

export function getStoredTheme(): ThemeChoice {
  return (localStorage.getItem(THEME_KEY) as ThemeChoice) || 'light';
}

export function getStoredContrast(): boolean {
  return localStorage.getItem(CONTRAST_KEY) === 'high';
}

/** Resolve + apply the saved theme and contrast to the document root. */
export function applyStoredTheme() {
  const choice = getStoredTheme();
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = choice === 'system' ? (prefersDark ? 'dark' : 'light') : choice;
  document.documentElement.setAttribute('data-theme', resolved);

  if (getStoredContrast()) {
    document.documentElement.setAttribute('data-contrast', 'high');
  } else {
    document.documentElement.removeAttribute('data-contrast');
  }
}

/** Persist + apply a new theme choice. */
export function setTheme(choice: ThemeChoice) {
  localStorage.setItem(THEME_KEY, choice);
  applyStoredTheme();
}

/** Persist + apply the high-contrast preference. */
export function setContrast(enabled: boolean) {
  localStorage.setItem(CONTRAST_KEY, enabled ? 'high' : 'normal');
  applyStoredTheme();
}

// Keep a module-level reference so the MediaQueryList isn't garbage-collected
// (otherwise the "change" listener silently stops firing in some browsers).
let systemMql: MediaQueryList | null = null;

/** Call once at app startup. Applies saved theme and keeps "system" live. */
export function initTheme() {
  applyStoredTheme();

  systemMql = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getStoredTheme() === 'system') applyStoredTheme();
  };
  if (systemMql.addEventListener) {
    systemMql.addEventListener('change', onSystemChange);
  } else {
    // Safari < 14 fallback
    (systemMql as any).addListener(onSystemChange);
  }

  // Belt-and-suspenders: re-resolve when the tab regains focus/visibility,
  // covering cases where the OS theme changed while the media event didn't fire.
  window.addEventListener('focus', () => {
    if (getStoredTheme() === 'system') applyStoredTheme();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && getStoredTheme() === 'system') applyStoredTheme();
  });

  // Sync across tabs when the preference changes elsewhere.
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY || e.key === CONTRAST_KEY) applyStoredTheme();
  });
}
