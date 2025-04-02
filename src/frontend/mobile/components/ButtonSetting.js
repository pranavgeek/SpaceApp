import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext.js';

const ButtonSettings = ({
  iconName, 
  title, 
  onPress, 
  subtitle, 
  rightIcon,
  isDanger,
  style,       // New prop for custom styles
  disabled,    // New prop for disabled state
}) => {
  const { isDarkMode, colors } = useTheme();
  const stylesDynamic = getDynamicStyles(colors);
  const textColor = isDanger ? '#FF4444' : "#FFFFFF";

  return (
    <TouchableOpacity
      style={[stylesDynamic.button, style, disabled && { opacity: 0.3 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={stylesDynamic.buttonContent}>
        <Ionicons name={iconName} style={[stylesDynamic.icon, { color: textColor }]} />
        <View style={stylesDynamic.container}>
          <Text style={[stylesDynamic.buttonText, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={stylesDynamic.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightIcon && (
        <Ionicons name={rightIcon} size={22} color={textColor} />
      )}
    </TouchableOpacity>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 2,
      borderColor: colors.baseContainerHeader,
      padding: 8,
      marginVertical: 4,
    },
    container: {
      flexDirection: 'column',
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 8,
      fontSize: 24,
    },
    buttonText: {
      fontSize: 18,
      paddingVertical: 2,
    },
    subtitle: {
      fontSize: 16,
    },
});

export default ButtonSettings;