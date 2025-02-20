import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext.js';
import BaseContainer from '../components/BaseContainer.js';
import { ScrollView } from 'react-native-gesture-handler';

const AppearanceModeScreen = ({navigation}) => {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  const styles = getDynamicStyles(colors);

  useLayoutEffect(() => {
      // Dynamically set the header styles when the theme changes
      navigation.setOptions({
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      });
    }, [navigation, colors]);

  return (
    <ScrollView style={styles.container}>

      <BaseContainer 
          title="Appearance Mode" 
          titleIcon={isDarkMode ? "moon" : "sunny"}
          footer={
            <View style={styles.footerElement}>
              <Text style={styles.text}>
                Current Theme: {isDarkMode ? 'Dark' : 'Light'}
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                thumbColor={isDarkMode ? '#AAA' : '#555'}
                trackColor={{ false: '#FFF', true: '#000' }}
              />
            </View>
          }>
        <View>
          <Text style={styles.text}>
            Modify the appearance mode of the app by toggling the switch above.
          </Text>
        </View>
        
      </BaseContainer>

      
    </ScrollView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    text: {
      fontSize: 16,
      marginVertical: 10,
      color: colors.text,
    },
    footerElement: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

export default AppearanceModeScreen;
