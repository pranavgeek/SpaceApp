import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';

import ButtonSettings from '../components/ButtonSettings';
import ButtonSetting from '../components/ButtonSetting';
import BaseContainer from '../components/BaseContainer';
import { useTheme } from '../theme/ThemeContext.js';

export default function SupportScreen() {

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  return (
    <ScrollView style={styles.container}>
        
        <BaseContainer title={"Help & Support"} titleIcon={"help-circle-outline"}>
          <Text style={styles.title}>
            In this section you can find various ways to get help and support for our app. Whether you prefer live chat, browsing documentation, checking FAQs, or sending an email, we are here to assist you.
          </Text>
          <ButtonSetting 
              iconName={'chatbubbles-outline'} 
              title={'Live Chat'} 
              subtitle={'Chat with our support team'}
              onPress={() => {}} />
          <ButtonSetting 
              iconName={'book-outline'} 
              title={'Documentation'} 
              subtitle={'Browse our guides and tutorials'}
              onPress={() => {}} />
          <ButtonSetting 
              iconName={'help-circle-outline'} 
              title={'FAQs'} 
              subtitle={'Find answers to common questions'}
              onPress={() => {}} />
          <ButtonSetting 
              iconName={'mail-outline'} 
              title={'Email support'} 
              subtitle={'Send us a detailed message'}
              onPress={() => {}} />
        </BaseContainer>  
      
    </ScrollView>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    color: colors.text,
  },
  title: {
    fontSize: 17,
    padding: 6,
    textAlign: 'left',
    color: colors.text,
  },
});
