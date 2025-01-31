import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native-gesture-handler';

const ToggleSettings = ({iconName, title, subtitle, onChange}) =>  {
    return (
        <View style={styles.button}>
            <View style={styles.buttonContent}>
                <Ionicons name={iconName} color="#555" style={styles.icon} />
                <View style={styles.container}>
                    <Text style={styles.buttonText}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                
            </View>
            
            <Switch onChange={onChange}/>
            
        </View>
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

export default ToggleSettings;