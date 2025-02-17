import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext.js';

const ButtonMain = ({children, onPress}) =>  {
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);
  return (
      <TouchableOpacity style={styles.submitButton} onPress={onPress}>
          <Text style={styles.submitButtonText}>{children}</Text>
      </TouchableOpacity>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    submitButton: {
        backgroundColor: colors.baseContainerHeader,
        borderColor: colors.subtitle,
        borderWidth: 0.5,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
        marginHorizontal: 20
      },
      submitButtonText: { 
        color: colors.Text, 
        fontWeight: 'bold' 
      }
});

export default ButtonMain;