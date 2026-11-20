import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'gymflow-theme';

const ThemeContext = createContext<ThemeContextValue | null>(
  null,
);

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // localStorage puede no estar disponible.
  }

  return window.matchMedia('(prefers-color-scheme: dark)')
    .matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Sin persistencia: el tema sigue funcionando en memoria.
    }

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        theme === 'dark' ? '#0f172a' : '#f8fafc',
      );
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) =>
      current === 'dark' ? 'light' : 'dark',
    );
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme debe usarse dentro de ThemeProvider.',
    );
  }

  return context;
}
