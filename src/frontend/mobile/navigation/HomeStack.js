import React from "react";
import { TouchableOpacity, Image } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ProjectScreen from "../screens/ProjectScreen";
import FormScreen from '../screens/FormScreen'; // Import FormScreen

const HomeStack = createNativeStackNavigator();

const HomeStackNavigation = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }}>
              <Image
                source={require("../assets/adaptive-icon.png")}
                style={{ width: 45, height: 45 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Icon name="shoppingcart" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <HomeStack.Screen
        name="Project"
        component={ProjectScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => (
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Icon name="shoppingcart" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <HomeStack.Screen
        name="FormScreen"
        component={FormScreen} // Register FormScreen here
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </HomeStack.Navigator>
  );
};

export default HomeStackNavigation;
