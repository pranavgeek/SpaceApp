import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext.js';

const InputSetting = ({
    placeholder = 'Enter text',
    isPassword = false,
    numberOfLines = 1,
    value,
    label,
    onChangeText}) => {
        const [isPasswordVisible, setIsPasswordVisible] = useState(isPassword);
        const { colors } = useTheme();
        const styles = getDynamicStyles(colors);

        return (
            <>
                {label && (
                    <Text style={styles.label}>{label}</Text>
                )}
                <View style={styles.container}>
                    <TextInput
                        style={numberOfLines > 1 ? styles.textArea : styles.textInput}
                        placeholder={placeholder}
                        secureTextEntry={isPassword && isPasswordVisible}
                        value={value}
                        onChangeText={onChangeText}
                        multiline={numberOfLines > 1 ? true : false}
                        numberOfLines={numberOfLines}
                        placeholderTextColor="#999"
                    />
                    {isPassword && (
                    <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        <Icon
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                    )}
                </View>
            </>
        );
};

const getDynamicStyles = (colors) =>
    StyleSheet.create({
    container: {
        margin: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderColor: colors.subtitle,
        borderWidth: 0.5,
        backgroundColor: colors.background,
    },
    iconContainer: {
        marginLeft: 10,
        padding: 20,
    },
    textInput: {
        flex: 1,
        color: colors.text,
        padding: 20,
        fontSize: 18,
    },
    textArea: {
        flex: 1,
        color: colors.text,
        padding: 20,
        height: 100,
        fontSize: 18,
    },
    label: {
        paddingLeft: 20,
        paddingTop: 10,
        color: colors.text,
        fontSize: 16,
    }
});

export default InputSetting