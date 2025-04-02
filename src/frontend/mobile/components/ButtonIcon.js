import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ButtonIcon = ({iconName})  => {
    return (
        <TouchableOpacity style={styles.iconButton}>
            <Ionicons name={iconName} size={30} color="#888"/>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    iconButton: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 15,
        marginTop: 10,
        marginHorizontal: 5,
        padding: 10,
    },  
});

export default ButtonIcon;