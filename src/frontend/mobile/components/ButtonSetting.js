import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext.js';

const ButtonSettings = ({
    iconName, 
    title, 
    onPress, 
    subtitle, 
    rightIcon,
    isDanger}) =>  {

    const { isDarkMode, colors, toggleTheme } = useTheme();
    const styles = getDynamicStyles(colors);
    const textColor = isDanger ? '#FF4444' : colors.text;

    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.buttonContent}>
                <Ionicons name={iconName} style={[styles.icon,{color: textColor}]} />
                <View style={styles.container}>
                    <Text style={[styles.buttonText,{color: textColor}]}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
            color: colors.text,
            fontSize: 24,
        },
        buttonText: {
            fontSize: 18,
            color: colors.text,
            paddingVertical: 2,
        },
        subtitle: {
            fontSize: 16,
            color: colors.text,
        },
});

export default ButtonSettings;