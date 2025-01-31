import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SupportScreen from '../screens/SupportScreen';
import PaymentMethodsScreen from '../screens/PaymentsMethodsScreen';
import NotificationScreen from '../screens/NotificationScren';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import ProductScreen from '../screens/ProductScreen';

const ProfileStack = createNativeStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
        <ProfileStack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
                headerRight: () => (
                    <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }}/>
        <ProfileStack.Screen 
            name="Edit Profile" 
            component={ProfileEditScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
                headerRight: () => (
                    <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }}/>
        <ProfileStack.Screen 
            name="Payment History" 
            component={PaymentHistoryScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
                headerRight: () => (
                    <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }}/>
        <ProfileStack.Screen 
            name="My Products" 
            component={ProductScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
                headerRight: () => (
                    <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                ),
            }}/>
        
    </ProfileStack.Navigator>
  );
};

export default ProfileStackNavigator;
