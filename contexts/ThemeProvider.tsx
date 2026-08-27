'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;
    
    if (savedTheme) setThemeState(savedTheme);
    if (savedFontSize) setFontSizeState(savedFontSize);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    let resolvedTheme: 'light' | 'dark';
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedTheme = theme;
    }
    
    setEffectiveTheme(resolvedTheme);
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
    }
  }, [theme]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    
    root.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setFontSize = (newFontSize: FontSize) => {
    setFontSizeState(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, fontSize, setTheme, setFontSize, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
