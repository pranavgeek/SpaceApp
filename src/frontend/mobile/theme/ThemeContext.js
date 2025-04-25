// import React, { createContext, useState, useContext } from 'react';
// import { Appearance } from 'react-native';

// const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === 'dark');

//   const toggleTheme = () => {
//     setIsDarkMode((prevMode) => !prevMode);
//   };

//   const theme = {
//     isDarkMode,
//     colors: isDarkMode
//       ? {
//           background: '#080A1A',
//           text: '#FFFFFF',
//           subtitle: '#B3B3B3',
//           baseContainerHeader: '#1E1E2E',
//           baseContainerBody: '#121212',
//           baseContainerFooter: '#272727',
//           gradientColors: ['#0F2027', '#203A43', '#2C5364'],
//           primary: '#1E90FF',
//           secondary: '#FF9500',
//           buttonBackground: '#7B68EE',
//           error: '#FF3B30',
//           success: '#32CD32',
//         }
//       : {
//           background: '#FFFFFF',
//           text: '#1A1A2E',
//           subtitle: '#5C677D',
//           baseContainerHeader: '#EEEEEE',
//           baseContainerBody: '#F6F6F6',
//           baseContainerFooter: '#E7E7E7',
//           gradientColors: ['#00A9FF', '#80D0FF'],
//           primary: '#006AFF',
//           secondary: '#FF6B00',
//           buttonBackground: '#000',
//           error: '#D72638',
//           success: '#19A974',
//         },
//     toggleTheme,
//   };

//   return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
// };

// export const useTheme = () => useContext(ThemeContext);

import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');
  
  // Listen for device theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Enhanced color palettes with more vibrant and harmonious colors
  const theme = {
    isDarkMode,
    colors: isDarkMode
      ? {
          // Dark mode - rich, deep colors with vibrant accents
          background: '#121212', // Deeper, more neutral dark background
          text: '#FFFFFF',
          subtitle: '#B0B0C0', // Slightly blue-tinted gray for better contrast
          baseContainerHeader: '#1E1E2E', // Deep navy-purple tint
          baseContainerBody: '#1A1A2A', // Matching body color
          baseContainerFooter: '#272736', // Slightly lighter for depth
          gradientColors: ['#0F172A', '#1E293B', '#334155'], // Slate-blue gradient
          primary: '#6366F1', // Indigo
          secondary: '#F59E0B', // Amber
          accent: '#EC4899', // Pink
          highlight: '#10B981', // Emerald for success indicators
          buttonBackground: '#4F46E5', // Indigo
          errorLight: '#FECACA', // Light red background
          error: '#EF4444', // Red
          success: '#22C55E', // Green
          warning: '#F59E0B', // Amber
          info: '#3B82F6', // Blue
          card: '#1E1E2E', // Card background
          border: '#2E2E40', // Subtle border color
          notification: '#F43F5E', // Rose for notifications
          shadowColor: '#000000',
          bestSeller: '#FFD700', // Gold for best seller badges
        }
      : {
          // Light mode - clean, bright with selective vibrant accents
          background: '#FFFFFF',
          text: '#0F172A', // Slate 900
          subtitle: '#64748B', // Slate 500
          baseContainerHeader: '#F8FAFC', // Slate 50
          baseContainerBody: '#F1F5F9', // Slate 100
          baseContainerFooter: '#E2E8F0', // Slate 200
          gradientColors: ['#60A5FA', '#3B82F6', '#2563EB'], // Blue gradient
          primary: '#3B82F6', // Blue 500
          secondary: '#F97316', // Orange 500
          accent: '#D946EF', // Fuchsia 500
          highlight: '#10B981', // Emerald 500
          buttonBackground: '#2563EB', // Blue 600
          errorLight: '#FEE2E2', // Red 100
          error: '#EF4444', // Red 500
          success: '#22C55E', // Green 500
          warning: '#F59E0B', // Amber 500
          info: '#3B82F6', // Blue 500
          card: '#FFFFFF', 
          border: '#E2E8F0', // Slate 200
          notification: '#F43F5E', // Rose 500
          shadowColor: '#64748B',
          bestSeller: '#FFD700', // Gold for best seller badges
        },
    toggleTheme,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
