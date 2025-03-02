import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import Message from '../components/Message';
import { useTheme } from '../theme/ThemeContext';

export default function MessagesScreen({navigation}) {

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  return (
    <ScrollView style={styles.container}>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Chats"}</Text>
        <Message 
            chatName={'Sarah Chen'} 
            shortMessage={'Chat with our support team'}
            time={'05:46 PM'}
            chatCategory={'Elite'}
            onPress={() => navigation.navigate('Chat')} />
        <Message 
            chatName={'Alex Rivera'} 
            shortMessage={'Browse our guides and tutorials'}
            time={'11:24 AM'}
            onPress={() => navigation.navigate('Chat')} />
        <Message 
            chatName={'Sarah Chen'} 
            shortMessage={'Find answers to common questions'}
            time={'07:51 PM'}
            onPress={() => navigation.navigate('Chat')} />
      </View>

      
    </ScrollView>
  );
}

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      padding: 20,
      textAlign: 'center',
      color: colors.text,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    profileName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    profileSubtitle: {
      fontSize: 14,
      color: colors.subtitle,
    },
    section: {
      marginTop: 10,
      paddingHorizontal: 10,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
    },
  });
