import React from "react";
import { TouchableOpacity, Image, StyleSheet, View, Text } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ProjectScreen from "../screens/ProjectScreen";
import FormScreen from "../screens/FormScreen"; // Import FormScreen
import CartScreen from "../screens/CartScreen";
import { useCart } from "../context/CartContext"; // Import useCart
import { useNavigation } from "@react-navigation/native";

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
          headerRight: () => {
            const navigation = useNavigation();
            const { totalItems } = useCart(); // Access totalItems from CartContext
            return (
              <TouchableOpacity
                style={styles.cartIconContainer}
                onPress={() => navigation.navigate("CartScreen")}
              >
                <Icon name="shoppingcart" size={24} color="#fff" />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          },
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
      <HomeStack.Screen
        name="CartScreen"
        component={CartScreen} // Register CartScreen here
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </HomeStack.Navigator>
  );
};

const styles = StyleSheet.create({
  cartIconContainer: {
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
});

export default HomeStackNavigation;
