import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import { useTheme } from '../theme/ThemeContext.js';


const MessagesStack = createNativeStackNavigator();

const MessagesStackNavigator = () => {

  const { colors } = useTheme();

  return (
    <MessagesStack.Navigator>
        <MessagesStack.Screen name="Messages" component={MessagesScreen} 
             options={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              headerTitleStyle: { }
            }}/>
        <MessagesStack.Screen name="Chat" component={ChatScreen} 
            options={{
                headerStyle: { backgroundColor: '#141414' },
                headerTintColor: '#fff', 
                headerTitleStyle: { fontWeight: 'bold' },
                headerShown: false,
                // headerRight: () => (
                //   <TouchableOpacity style={{marginRight: 15}}>
                //     <Icon name="notifications-outline" size={24} color="#fff" />
                //   </TouchableOpacity>
                // ),
            }}/>
        
    </MessagesStack.Navigator>
  );
};

export default MessagesStackNavigator;
