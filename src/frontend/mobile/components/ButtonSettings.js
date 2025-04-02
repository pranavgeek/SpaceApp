import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext.js';

const ButtonSettings = ({ iconName, title, onPress, subtitle, rightIcon, isDanger }) =>  {
    const { isDarkMode, colors } = useTheme();
    const { width } = useWindowDimensions(); // Get screen width
    const styles = getDynamicStyles(colors, width);
    const textColor = isDanger ? '#FF4444' : colors.text;

    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.buttonContent}>
                <Ionicons name={iconName} style={[styles.icon, {color: textColor}]} />
                <View style={styles.container}>
                    <Text style={[styles.buttonText, {color: textColor}]}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>
            {rightIcon && (
                <Ionicons name={rightIcon} size={20} color={textColor} />
            )}
        </TouchableOpacity>
    );
};

const getDynamicStyles = (colors, width) =>
    StyleSheet.create({
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: '#444',
            borderRadius: 10,
            padding: 12,
            marginVertical: 5,
            width: width < 768 ? '100%' : 'auto', // Full width on mobile, auto on web
        },
        container: {
            flexDirection: 'column',
            paddingVertical: 4,
            flex: 1, // Allow text to expand
        },
        buttonContent: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1, // Ensure content aligns properly
        },
        icon: {
            marginRight: 10,
            fontSize: 20,
        },
        buttonText: {
            fontSize: 16,
            paddingVertical: 2,
            textAlign: 'left', // Align text to the left
        },
        subtitle: {
            fontSize: 14,
            color: '#aaa',
        },
    });

export default ButtonSettings;
