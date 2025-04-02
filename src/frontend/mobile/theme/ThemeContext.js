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
          background: '#080A1A',
          text: '#FFFFFF',
          subtitle: '#B3B3B3',
          baseContainerHeader: '#1E1E2E',
          baseContainerBody: '#121212',
          baseContainerFooter: '#272727',
          gradientColors: ['#0F2027', '#203A43', '#2C5364'],
          primary: '#1E90FF',
          secondary: '#FF9500',
          buttonBackground: '#7B68EE',
          error: '#FF3B30',
          success: '#32CD32',
        }
      : {
          background: '#FFFFFF',
          text: '#1A1A2E',
          subtitle: '#5C677D',
          baseContainerHeader: '#EEEEEE',
          baseContainerBody: '#F6F6F6',
          baseContainerFooter: '#E7E7E7',
          gradientColors: ['#00A9FF', '#80D0FF'],
          primary: '#006AFF',
          secondary: '#FF6B00',
          buttonBackground: '#000',
          error: '#D72638',
          success: '#19A974',
        },
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
