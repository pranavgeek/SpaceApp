import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';

import ButtonSettings from '../components/ButtonSettings';

export default function SupportScreen() {

  return (
    <ScrollView style={styles.container}>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Help & Support"}</Text>
        <ButtonSettings 
            iconName={'chatbubbles-outline'} 
            title={'Live Chat'} 
            subtitle={'Chat with our support team'}
            onPress={() => {}} />
        <ButtonSettings 
            iconName={'book-outline'} 
            title={'Documentation'} 
            subtitle={'Browse our guides and tutorials'}
            onPress={() => {}} />
        <ButtonSettings 
            iconName={'help-circle-outline'} 
            title={'FAQs'} 
            subtitle={'Find answers to common questions'}
            onPress={() => {}} />
        <ButtonSettings 
            iconName={'mail-outline'} 
            title={'Email support'} 
            subtitle={'Send us a detailed message'}
            onPress={() => {}} />
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
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
});
