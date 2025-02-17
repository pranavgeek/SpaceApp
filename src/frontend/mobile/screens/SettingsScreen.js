import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';


import ButtonSetting from '../components/ButtonSetting';
import BaseContainer from '../components/BaseContainer';
import { useTheme } from '../theme/ThemeContext.js';

export default function SettingsScreen({navigation}) {

  const { colors } = useTheme();
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
      {/* Header */}

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80' }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileSubtitle}>Software Engineer</Text>
      </View>

      <BaseContainer title={"Account"}>
        <View>
          <ButtonSetting iconName={'person-outline'} title={'Profile Information'} onPress={() => navigation.navigate('Edit Profile')} rightIcon={"chevron-forward"}/>
          <ButtonSetting iconName={'lock-closed-outline'} title={'Security & Privacy'} onPress={() => navigation.navigate('Security & Privacy')} rightIcon={"chevron-forward"}/>
          <ButtonSetting iconName={'card-outline'} title={'Payment Options'} onPress={() => navigation.navigate('Payment Methods')} rightIcon={"chevron-forward"}/>
        </View>
      </BaseContainer>

      {/* Preferences Section */}
      <BaseContainer title={"Preferences"}>
        <View>
        <ButtonSetting iconName={'notifications-outline'} title={'Notifications'} onPress={() => navigation.navigate('Notifications')} rightIcon={"chevron-forward"}/>
        <ButtonSetting iconName={'globe-outline'} title={'Language & Region'} onPress={() => navigation.navigate('Language')} rightIcon={"chevron-forward"}/>
        <ButtonSetting iconName={'moon'} title={'Appearance'} onPress={() => navigation.navigate('Appearance')} rightIcon={"chevron-forward"}/>
        </View>
      </BaseContainer>

      {/* Support and Logout */}
      <BaseContainer title={"Support & Logout"}>
        <View>
        <ButtonSetting iconName={'help-circle-outline'} title={'Help & Support'} onPress={() => navigation.navigate('Support')} rightIcon={"chevron-forward"}/>
        <ButtonSetting 
          iconName={'log-out-outline'} 
          title={'Logout'} 
          onPress={() => {}} 
          rightIcon={"chevron-forward"}
          isDanger={true}/>
        </View>
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
    color: colors.text,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
});
