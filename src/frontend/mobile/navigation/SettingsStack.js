import React from 'react';
import { Appearance, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SupportScreen from '../screens/SupportScreen';
import PaymentMethodsScreen from '../screens/PaymentsMethodsScreen';
import NotificationScreen from '../screens/NotificationScren';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import RegionLanguageScreen from '../screens/RegionLanguageScreen';
import AppearanceScreen from '../screens/AppearanceScreen';
import SecurityPrivacyScreen from '../screens/SecurityPrivacyScreen';

const SettingsStack = createNativeStackNavigator();

const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator>
        <SettingsStack.Screen 
            name="Settings" 
            component={SettingsScreen} 
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
        <SettingsStack.Screen 
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
        <SettingsStack.Screen 
            name="Support" 
            component={SupportScreen} 
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
         <SettingsStack.Screen 
            name="Payment Methods" 
            component={PaymentMethodsScreen} 
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
        <SettingsStack.Screen 
            name="Notifications" 
            component={NotificationScreen} 
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
        <SettingsStack.Screen 
            name="Language" 
            component={RegionLanguageScreen} 
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
        <SettingsStack.Screen 
            name="Appearance" 
            component={AppearanceScreen} 
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
        <SettingsStack.Screen 
            name="Security & Privacy" 
            component={SecurityPrivacyScreen} 
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
        
    </SettingsStack.Navigator>
  );
};

export default SettingsStackNavigator;
