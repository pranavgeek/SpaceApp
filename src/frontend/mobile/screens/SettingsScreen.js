import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';

import ButtonSettings from '../components/ButtonSettings';

export default function SettingsScreen({navigation}) {

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

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <ButtonSettings iconName={'person-outline'} title={'Profile Information'} onPress={() => navigation.navigate('Edit Profile')} rightIcon={"chevron-forward"}/>
        <ButtonSettings iconName={'lock-closed-outline'} title={'Security & Privacy'} onPress={() => navigation.navigate('Security & Privacy')} rightIcon={"chevron-forward"}/>
        <ButtonSettings iconName={'card-outline'} title={'Payment Options'} onPress={() => navigation.navigate('Payment Methods')} rightIcon={"chevron-forward"}/>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <ButtonSettings iconName={'notifications-outline'} title={'Notifications'} onPress={() => navigation.navigate('Notifications')} rightIcon={"chevron-forward"}/>
        <ButtonSettings iconName={'globe-outline'} title={'Language & Region'} onPress={() => navigation.navigate('Language')} rightIcon={"chevron-forward"}/>
        <ButtonSettings iconName={'moon'} title={'Appearance'} onPress={() => navigation.navigate('Appearance')} rightIcon={"chevron-forward"}/>
      </View>

      {/* Help & Support Section */}
      <View style={styles.section}>
        <ButtonSettings iconName={'help-circle-outline'} title={'Help & Support'} onPress={() => navigation.navigate('Support')} rightIcon={"chevron-forward"}/>
        <ButtonSettings 
          iconName={'log-out-outline'} 
          title={'Logout'} 
          onPress={() => {}} 
          rightIcon={"chevron-forward"}
          style={{color: '#ff666'}}/>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 10,
    color: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
    color: '#fff',
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
    color: '#fff',
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#aaa',
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
