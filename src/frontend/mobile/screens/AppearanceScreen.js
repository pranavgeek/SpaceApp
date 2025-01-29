import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext.js';

const AppearanceModeScreen = () => {
  //const systemColorScheme = useColorScheme(); 
  //const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const { theme, toggleTheme } = useTheme();
  const styles = createDynamicStyles(theme);

  /*useEffect(() => {
    const loadThemePreference = async () => {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      }
    };
    loadThemePreference();
  }, []);*/

  /*const toggleTheme = async (value) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('theme', value ? 'dark' : 'light');
  };*/

  //const themeStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.container]}>
      <Text style={[styles.title]}>
        {theme.isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <Switch
        value={theme.isDarkMode}
        onValueChange={toggleTheme}
        thumbColor={theme.isDarkMode ? '#f4f3f4' : '#f4f3f4'}
        trackColor={{ false: '#ccc', true: '#444' }}
      />
    </View>
  );
};

const createDynamicStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

// Light theme styles
/*const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  text: {
    color: '#000',
  },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
  },
});*/

export default AppearanceModeScreen;
