import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    Button,
    TouchableOpacity,
  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import ButtonIcon from "../components/ButtonIcon";

export default function ProfileScreen ({navigation}) {
    return (
        <ScrollView style={styles.container}>

            <View style={styles.profileSection}>
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80' }}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>John Doe</Text>
                <Text style={styles.profileSubtitle}>Software Engineer</Text>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.profileRow}>
                    <Ionicons name="globe-outline" size={20} color="#ccc" style={{padding: 5}}/>
                    <Text style={styles.profileText}>Toronto, Canada</Text>
                </View>
                <View style={styles.profileRow}>
                    <Ionicons name="language" size={20} color="#ccc" style={{padding: 5}}/>
                    <Text style={styles.profileText}>English, French</Text>
                </View>
            </View>

            <View style={styles.profileSection}>
                <View style={styles.profileRow}>
                    <View style={styles.profileColumn}>
                        <Text style={styles.profileSubtitle}>24</Text>
                        <Text style={styles.profileText}>Campaigns</Text>
                    </View>
                    <View style={styles.profileColumn}>
                        <Text style={styles.profileSubtitle}>52.0K</Text>
                        <Text style={styles.profileText}>Followers</Text>
                    </View>
                    <View style={styles.profileColumn}>
                        <Text style={styles.profileSubtitle}>125.0K</Text>
                        <Text style={styles.profileText}>Earnings</Text>
                    </View>
                </View>
            </View>

            <View style={styles.profileSection} >
                <View style={styles.profileRow}>
                    <ButtonMain onPress={() => navigation.navigate('Edit Profile')}>Edit Profile</ButtonMain>
                    <ButtonIcon iconName={'share-social'} />
                </View>
            </View>
            
            
            <View style={styles.profileSection}>
                <View style={styles.profileRow}>
                    <ButtonIcon iconName={'logo-twitter'} />
                    <ButtonIcon iconName={'logo-instagram'} />
                    <ButtonIcon iconName={'logo-tiktok'} />
                    <ButtonIcon iconName={'logo-linkedin'} />
                </View>
            </View>

            <ButtonSettings iconName={'grid-outline'} onPress={() => navigation.navigate('My Products')} title={'My Products'} />
            <ButtonSettings iconName={'card-outline'} onPress={() => navigation.navigate('Payment History')} title={'Payment'} />
            <ButtonSettings iconName={'cube-outline'} onPress={() => {}} title={'Orders'} />
            <ButtonSettings iconName={'heart-outline'} onPress={() => {}} title={'Favourites'} />

        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
    padding: 5,
    color: '#ffffff',
    alignContent: 'center',
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
    marginVertical: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  profileColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileText: {
    fontSize: 14,
    color: '#aaa',
  },
  profileSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#aaa',
    padding: 5,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
});
