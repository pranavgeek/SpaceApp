import React, { createContext, useState, useContext } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode
      ? {
          background: '#000',
          text: '#FFF',
          subtitle: "#CCC",
          baseContainerHeader: '#222',
          baseContainerBody: '#111',
          baseContainerFooter: '#272727',
          gradientColors: ['#111', '#222'],
        }
      : {
          background: '#FFF',
          text: '#000',
          subtitle: "#333",
          baseContainerHeader: '#EEEEEE',
          baseContainerBody: '#F6F6F6',
          baseContainerFooter: '#E7E7E7',
          gradientColors: ['#F6F6F6', '#EEEEEE'],
        },
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
