import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const themes = {
  light: {
    colors: {
      background: '#33aa33',
      text: '#000000',
    },
    fonts: {
      small: 14,
      medium: 16,
      large: 20,
    },
  },
  dark: {
    colors: {
      background: '#343434',
      text: '#ffffff',
    },
    fonts: {
      small: 14,
      medium: 16,
      large: 20,
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.light);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === themes.light ? themes.dark : themes.light));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
