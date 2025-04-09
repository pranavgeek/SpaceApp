import React from "react";
import { TouchableOpacity, Image, StyleSheet, View, Text } from "react-native";
import Icon from "react-native-vector-icons/AntDesign";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ProjectScreen from "../screens/ProjectScreen";
import FormScreen from "../screens/FormScreen";
import CartScreen from "../screens/CartScreen";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";
import CheckoutScreen from "../screens/CheckoutScreen";
import BuyerContactFormScreen from "../screens/BuyerContactFormScreen";
import { useAuth } from "../context/AuthContext";

const HomeStack = createNativeStackNavigator();

const HomeStackNavigation = () => {

    const { user } = useAuth();
  
    let HomeScreenComponent;
    if (user.role === "seller") {
      HomeScreenComponent = HomeScreen;
    } else if (user.role === "buyer") {
      HomeScreenComponent = HomeScreen;
    } else if (user.role === "influencer") {
      HomeScreenComponent = HomeScreen;
    }else {
      HomeScreenComponent = HomeScreen; // fallback
    }
    
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreenComponent}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          headerShown: false,
          // headerRight: () => {
          //   const navigation = useNavigation();
          //   const { cartItems } = useCart();
          //   const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
          //   return (
          //     <TouchableOpacity
          //       style={styles.cartIconContainer}
          //       onPress={() => navigation.navigate("CartScreen")}
          //     >
          //       <Icon name="shoppingcart" size={24} color="#fff" />
          //       {totalItems > 0 && (
          //         <View style={styles.badge}>
          //           <Text style={styles.badgeText}>{totalItems}</Text>
          //         </View>
          //       )}
          //     </TouchableOpacity>
          //   );
          // },
        }}
      />
      {/* <HomeStack.Screen 
        name="SearchResult" 
        component={SearchResultScreen} 
        options={{ title: "Search Projects" }}
      /> */}
      <HomeStack.Screen
        name="Project"
        component={ProjectScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          headerRight: () => {
            const navigation = useNavigation();
            const { cartItems } = useCart();
            const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
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
        name="Form"
        component={FormScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <HomeStack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <HomeStack.Screen
        name="ContactForm"
        component={BuyerContactFormScreen}
        options={{
          headerStyle: { backgroundColor: "#141414" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <HomeStack.Screen
        name="Checkout"
        component={CheckoutScreen}
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
  },
});

export default HomeStackNavigation;
