import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ButtonSettings = ({iconName, title, onPress, subtitle, rightIcon}) =>  {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.buttonContent}>
                <Ionicons name={iconName} color="#555" style={styles.icon} />
                <View style={styles.container}>
                    <Text style={styles.buttonText}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                
            </View>
            
            {rightIcon && (
                <Ionicons name={rightIcon} size={20} color="#888" />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#141414',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 10,
        padding: 12,
        marginVertical: 5,
    },
    container: {
        flexDirection: 'column',
        paddingVertical: 4,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
        color: '#fff',
        fontSize: 20,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        paddingVertical: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
    },
});

export default ButtonSettings;