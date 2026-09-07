export type Theme = 'light' | 'dark';

// The theme class lives on <body> (`theme-light` / `theme-dark`). Each entry's
// index.html applies it before first paint with an inline boot script — keep
// this key in sync with that script.
const STORAGE_KEY = 'shader-art:theme';

export function currentTheme(): Theme {
  return document.body.classList.contains('theme-light') ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  document.body.classList.remove('theme-light', 'theme-dark');
  document.body.classList.add(`theme-${theme}`);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable — the class still applies for this session */
  }
}

/**
 * Two buttons; CSS shows the one that switches to the *other* theme (keyed off
 * the body class), so no component state is needed.
 */
export function ThemeToggle() {
  const flip = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  return (
    <div class="theme-toggle">
      <button
        type="button"
        class="theme-toggle__btn theme-toggle__btn--dark"
        onClick={flip}
      >
        ☾ dark
      </button>
      <button
        type="button"
        class="theme-toggle__btn theme-toggle__btn--light"
        onClick={flip}
      >
        ☀ light
      </button>
    </div>
  );
}
