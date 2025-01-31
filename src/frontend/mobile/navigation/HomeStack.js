import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProjectScreen from '../screens/ProjectScreen';

const HomeStack = createNativeStackNavigator();

const HomeStackNavigation = () => {
  return (
    <HomeStack.Navigator>
        <HomeStack.Screen name="Home" component={HomeScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff', 
                headerTitleStyle: { fontWeight: 'bold' },
                headerRight: () => (
                  <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                ),
            }}/>
        <HomeStack.Screen name="Project" component={ProjectScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff', 
                headerTitleStyle: { fontWeight: 'bold' },
                headerRight: () => (
                  <TouchableOpacity style={{marginRight: 15}}>
                    <Icon name="notifications-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                ),
            }}/>
        
    </HomeStack.Navigator>
  );
};

export default HomeStackNavigation;