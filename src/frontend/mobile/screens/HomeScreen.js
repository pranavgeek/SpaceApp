import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/AntDesign";
import CheckBox from "expo-checkbox";
import DropDownPicker from "react-native-dropdown-picker";
import ProjectCard from "../components/ProjectCard";
import { useTheme } from "../theme/ThemeContext.js";
import { useCart } from "../context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { mockCities } from "../data/MockData.js";
import { fetchProducts, fetchUsers } from "../backend/db/API.js";
import AccountSwitchOverlay from "../components/AccountSwitchOverlay.js";

export default function HomeScreen({ navigation }) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");

  // Filtering states
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);

  // Country and City filter states
  const [selectedCountry, setSelectedCountry] = useState("");
  const [modalCountry, setModalCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [modalCity, setModalCity] = useState("");

  // Static country dropdown items (for modal)
  const [countryItems, setCountryItems] = useState([
    { label: "All Countries", value: "" },
    { label: "USA", value: "USA" },
    { label: "Canada", value: "Canada" },
    { label: "UK", value: "UK" },
    { label: "Germany", value: "Germany" },
    { label: "France", value: "France" },
    { label: "Japan", value: "Japan" },
  ]);

  // City dropdown states – will be updated dynamically based on the selected country
  const [cityItems, setCityItems] = useState([
    { label: "All Cities", value: "" },
  ]);
  const [cityOpen, setCityOpen] = useState(false);

  // Mobile Category Dropdown states (using DropDownPicker for category)
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState(selectedFilter);
  const [categoryItems, setCategoryItems] = useState([
    { label: "All Categories", value: "" },
    { label: "Software", value: "Software" },
    { label: "Hardware", value: "Hardware" },
    { label: "AI Tools", value: "AI Tools" },
    { label: "Cloud", value: "Cloud" },
    { label: "Feature", value: "Feature" },
    { label: "Startups", value: "Startups" },
    { label: "Creators", value: "Creators" },
  ]);

  const isFocused = useIsFocused();

  // Modal state for filters (for mobile)
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    if (showModal) {
      setModalCountry(selectedCountry);
      setModalCity(selectedCity);
    }
  }, [showModal, selectedCountry, selectedCity]);

  // Modal state for Price Ranges, etc.
  const [modalPriceRanges, setModalPriceRanges] = useState([]);
  const [showPanel, setShowPanel] = useState(false);

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  const { cartItems } = useCart();
  const totalItems = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );
  const windowWidth = Dimensions.get("window").width;
  const windowHeight = Dimensions.get("window").height;

  // Device detection
  const isMobileWeb = Platform.OS === "web" && windowWidth < 768;
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 768;
  const isNativeMobile = Platform.OS !== "web";

  // Desktop filter panel animation
  const FILTER_PANEL_WIDTH = 280;
  const panelAnim = useRef(new Animated.Value(-FILTER_PANEL_WIDTH)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Bottom sheet animation (mobile)
  const BOTTOM_SHEET_HEIGHT = windowHeight * 0.8;
  const slideUpAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  // Use separate state for the modal country dropdown to avoid naming conflicts.
  const [modalCountryOpen, setModalCountryOpen] = useState(false);

  // Load the user's default country from AsyncStorage and update city dropdown accordingly.
  // useEffect(() => {
  //   const loadUserCountry = async () => {
  //     try {
  //       const country = await AsyncStorage.getItem("userCountry");
  //       console.log("Loaded userCountry:", country);
  //       if (country) {
  //         setSelectedCountry(country);
  //         setModalCountry(country);
  //         // Build city dropdown items by filtering mockCities based on the country.
  //         const filteredCities = mockCities.filter((cityStr) => {
  //           const parts = cityStr.split(",");
  //           const cityCountry = parts[1]?.trim() || "";
  //           return cityCountry === country;
  //         });
  //         const dropdownItems = filteredCities.map((cityStr) => {
  //           const cityName = cityStr.split(",")[0].trim();
  //           return { label: cityName, value: cityName };
  //         });
  //         setCityItems([{ label: "All Cities", value: "" }, ...dropdownItems]);
  //       }
  //     } catch (error) {
  //       console.error("Error loading userCountry:", error);
  //     }
  //   };

  //   if (isFocused) {
  //     loadUserCountry();
  //   }
  // }, [isFocused]);

  // Also update cityItems whenever the applied country changes.
  useEffect(() => {
    if (selectedCountry) {
      const filteredCities = mockCities.filter((cityStr) => {
        const parts = cityStr.split(",");
        const cityCountry = parts[1]?.trim() || "";
        return cityCountry === selectedCountry;
      });
      const dropdownItems = filteredCities.map((cityStr) => {
        const cityName = cityStr.split(",")[0].trim();
        return { label: cityName, value: cityName };
      });
      setCityItems([{ label: "All Cities", value: "" }, ...dropdownItems]);
    } else {
      setCityItems([{ label: "All Cities", value: "" }]);
    }
  }, [selectedCountry]);

  // Animations for desktop panel and mobile bottom sheet.
  useEffect(() => {
    if (isDesktopWeb) {
      Animated.parallel([
        Animated.timing(panelAnim, {
          toValue: showPanel ? 0 : -FILTER_PANEL_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: showPanel ? FILTER_PANEL_WIDTH : 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    if (isMobileWeb || isNativeMobile) {
      Animated.timing(slideUpAnim, {
        toValue: showModal ? 0 : BOTTOM_SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showPanel, showModal]);

  // --------------------------
  // Fetch products using the provided API function and map to expected structure
  // --------------------------
  const [fetchedProjects, setFetchedProjects] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, users] = await Promise.all([
          fetchProducts(),
          fetchUsers(),
        ]);

        // Map seller ID to their actual name
        const sellerMap = {};
        users.forEach((user) => {
          sellerMap[user.user_id] = user.name;
        });

        const mappedProjects = products.map((product) => ({
          id: product.product_id.toString(),
          category: product.category,
          project: {
            name: product.product_name,
            description: product.description,
            image: product.product_image.startsWith("http")
              ? product.product_image
              : `http://10.0.0.25:5001/${product.product_image}`,
            price: product.cost,
            likes: 0,
            summary: product.summary,
            user_seller: product.user_seller, // seller_id passed to cart
          },
          creator: {
            name:
              sellerMap[product.user_seller] || `Seller ${product.user_seller}`,
            image: "https://via.placeholder.com/150",
          },
        }));

        setFetchedProjects(mappedProjects);
      } catch (error) {
        console.error("Error loading products or users:", error);
      }
    };

    loadData();
  }, []);

  // --------------------------

  // Price ranges (example)
  const priceRanges = [
    { min: 0, max: 100, display: "$0-$100" },
    { min: 100, max: 250, display: "$100-$250" },
    { min: 250, max: 500, display: "$250-$500" },
    { min: 500, max: Infinity, display: "$500+" },
  ];

  const [showOverlay, setShowOverlay] = useState(null); // "Seller", "Influencer"
  // Check if the user has switched accounts and set the overlay accordingly.
  useEffect(() => {
    const checkAccountSwitch = async () => {
      const switchedRole = await AsyncStorage.getItem("switchedRole");
      console.log("🔎 Switched role from AsyncStorage:", switchedRole);

      if (switchedRole) {
        setShowOverlay(switchedRole); // This triggers the overlay
        await AsyncStorage.removeItem("switchedRole");
      }
    };
    checkAccountSwitch();
  }, []);

  // Filtering logic now checks category, price, country, and city.
  function checkPriceRange(range, price) {
    return price >= range.min && price <= range.max;
  }
  const filteredProjects = fetchedProjects.filter((project) => {
    const categoryMatch =
      !selectedFilter || project.category === selectedFilter;
    const priceMatch =
      selectedPriceRanges.length === 0 ||
      selectedPriceRanges.some((range) =>
        checkPriceRange(range, project.project.price)
      );
    const countryMatch =
      selectedCountry === "" || project.project.country === selectedCountry;
    const cityMatch =
      selectedCity === "" || project.project.city === selectedCity;
    const searchMatch =
      searchQuery === "" ||
      project.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return (
      categoryMatch && priceMatch && countryMatch && cityMatch && searchMatch
    );
  });

  // Handle filter button press
  const handleFilterPress = () => {
    if (isDesktopWeb) {
      setShowPanel(!showPanel);
    } else {
      setModalPriceRanges([...selectedPriceRanges]);
      setModalCountry(selectedCountry);
      setModalCity(selectedCity);
      setShowModal(true);
    }
  };

  // Web-only checkboxes for price ranges
  const renderWebCheckboxes = (options, selectedValues, setSelectedValues) => (
    <View style={styles.webCheckboxContainer}>
      {options.map((option) => {
        const displayValue =
          typeof option === "object" ? option.display : option;
        const isSelected = selectedValues.some((value) => {
          if (typeof option === "object" && typeof value === "object") {
            return option.min === value.min && option.max === value.max;
          }
          return value === option;
        });
        return (
          <View key={displayValue} style={styles.checkboxRow}>
            <CheckBox
              value={isSelected}
              onValueChange={(isChecked) => {
                if (isChecked) {
                  setSelectedValues([...selectedValues, option]);
                } else {
                  setSelectedValues(
                    selectedValues.filter((v) => {
                      if (typeof option === "object" && typeof v === "object") {
                        return !(v.min === option.min && v.max === option.max);
                      }
                      return v !== option;
                    })
                  );
                }
              }}
            />
            <Text style={styles.checkboxLabel}>{displayValue}</Text>
          </View>
        );
      })}
    </View>
  );

  // Render mobile price range checkboxes
  const renderMobilePriceCheckboxes = (
    priceOptions,
    selectedValues,
    setSelectedValues
  ) => (
    <View style={styles.mobileCheckboxContainer}>
      {priceOptions.map((option) => {
        const isSelected = selectedValues.some(
          (item) => item.min === option.min && item.max === option.max
        );
        return (
          <View key={option.display} style={styles.checkboxRow}>
            <CheckBox
              value={isSelected}
              onValueChange={(isChecked) => {
                if (isChecked) {
                  setSelectedValues([...selectedValues, option]);
                } else {
                  setSelectedValues(
                    selectedValues.filter(
                      (v) => !(v.min === option.min && v.max === option.max)
                    )
                  );
                }
              }}
            />
            <Text style={styles.checkboxLabel}>{option.display}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <>
      {showOverlay && (
        <AccountSwitchOverlay
          role={showOverlay}
          onDone={() => setShowOverlay(null)}
        />
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* CUSTOM HEADER */}
        <View style={styles.customHeader}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={styles.cartIconContainer}
              onPress={() => navigation.navigate("CartScreen")}
            >
              <Icon name="shoppingcart" size={26} color={colors.subtitle} />
              {totalItems > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.subtitle}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterIcon}
            onPress={handleFilterPress}
          >
            <Ionicons name="filter" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* DESKTOP WEB LAYOUT */}
        {isDesktopWeb ? (
          <View style={styles.webContainer}>
            <Animated.View
              style={[
                styles.webFilterPanel,
                { transform: [{ translateX: panelAnim }] },
              ]}
            >
              <Text style={styles.webFilterTitle}>Filter Options</Text>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Category:</Text>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 16,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                >
                  <option value="">All Categories</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="AI Tools">AI Tools</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Feature">Feature</option>
                  <option value="Startups">Startups</option>
                  <option value="Creators">Creators</option>
                </select>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range:</Text>
                {renderWebCheckboxes(
                  priceRanges,
                  selectedPriceRanges,
                  setSelectedPriceRanges
                )}
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Country:</Text>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 16,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                >
                  {countryItems.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>City:</Text>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 16,
                    border: "1px solid #ccc",
                    borderRadius: 4,
                  }}
                >
                  {cityItems.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </View>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowPanel(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View
              style={[
                styles.webContentContainer,
                { transform: [{ translateX: contentAnim }] },
              ]}
            >
              <ScrollView>
                <View style={styles.horizontalCardContainer}>
                  {filteredProjects.map((item) => (
                    <View key={item.id} style={styles.webCardWrapper}>
                      <ProjectCard
                        item={item}
                        onPress={() =>
                          navigation.navigate("Project", {
                            project: item.project,
                            creator: item.creator,
                          })
                        }
                      />
                    </View>
                  ))}
                  {filteredProjects.length === 0 && (
                    <Text style={{ margin: 16 }}>No items found.</Text>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        ) : (
          // MOBILE LAYOUT
          <View style={styles.content}>
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ProjectCard
                  item={item}
                  onPress={() =>
                    navigation.navigate("Project", {
                      project: item.project,
                      creator: item.creator,
                    })
                  }
                />
              )}
              ListEmptyComponent={
                <Text style={{ margin: 16 }}>No items found.</Text>
              }
            />
          </View>
        )}

        {/* MODAL for mobile filter options */}
        {(isMobileWeb || isNativeMobile) && (
          <Modal transparent={true} visible={showModal} animationType="none">
            <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(0,0,0,0.5)" },
                ]}
              />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                { transform: [{ translateY: slideUpAnim }] },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Options</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.filterSection, { zIndex: 3000 }]}>
                  <Text style={styles.filterLabel}>Category:</Text>
                  <DropDownPicker
                    open={categoryOpen}
                    value={categoryValue || ""}
                    items={
                      categoryItems && categoryItems.length > 0
                        ? categoryItems
                        : [{ label: "No Categories", value: "" }]
                    }
                    setOpen={setCategoryOpen}
                    setValue={setCategoryValue}
                    setItems={setCategoryItems}
                    placeholder="Select a category"
                    style={{
                      borderColor: "#ccc",
                      borderWidth: 1,
                      borderRadius: 4,
                    }}
                    dropDownContainerStyle={{
                      borderColor: "#ccc",
                      borderWidth: 1,
                    }}
                    containerStyle={{ overflow: "visible", zIndex: 3000 }}
                    zIndex={3000}
                    zIndexInverse={1000}
                  />
                </View>

                {/* Horizontal container for Country and City dropdowns */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.filterLabel}>Country:</Text>
                    <DropDownPicker
                      open={modalCountryOpen}
                      value={modalCountry || ""}
                      items={
                        countryItems && countryItems.length > 0
                          ? countryItems
                          : [{ label: "No Countries", value: "" }]
                      }
                      setOpen={setModalCountryOpen}
                      setValue={setModalCountry}
                      setItems={setCountryItems}
                      placeholder="Country"
                      style={{
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 4,
                      }}
                      dropDownContainerStyle={{
                        borderColor: "#ccc",
                        borderWidth: 1,
                      }}
                      containerStyle={{ overflow: "visible" }}
                      zIndex={2000}
                      zIndexInverse={900}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.filterLabel}>City:</Text>
                    <DropDownPicker
                      open={cityOpen}
                      value={modalCity || ""}
                      items={
                        cityItems && cityItems.length > 0
                          ? cityItems
                          : [{ label: "No Cities", value: "" }]
                      }
                      setOpen={setCityOpen}
                      setValue={setModalCity}
                      setItems={setCityItems}
                      placeholder="City"
                      style={{
                        borderColor: "#ccc",
                        borderWidth: 1,
                        borderRadius: 4,
                      }}
                      dropDownContainerStyle={{
                        borderColor: "#ccc",
                        borderWidth: 1,
                      }}
                      containerStyle={{ overflow: "visible" }}
                      zIndex={1000}
                      zIndexInverse={800}
                    />
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Price Range:</Text>
                  {renderMobilePriceCheckboxes(
                    priceRanges,
                    modalPriceRanges,
                    setModalPriceRanges
                  )}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setSelectedPriceRanges([...modalPriceRanges]);
                  setSelectedCountry(modalCountry);
                  setSelectedCity(modalCity);
                  setSelectedFilter(categoryValue);
                  setShowModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </Animated.View>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}

// Example dynamic styles (adjust as needed)
const getDynamicStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    customHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      height: 60,
      backgroundColor: 'transparent',
    },
    headerLeft: {
      marginRight: 10,
    },
    logo: {
      width: 100,
      height: 100,
    },
    headerTitle: {
      flex: 1,
      textAlign: "left",
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
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
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.baseContainerBody,
      margin: 10,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      padding: 10,
      color: colors.text,
    },
    filterIcon: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.baseContainerBody,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.subtitle,
      alignSelf: "flex-start",
    },
    content: {
      flex: 1,
      paddingTop: 10,
    },
    webContainer: {
      flex: 1,
      flexDirection: "row",
    },
    webFilterPanel: {
      position: "absolute",
      left: 0,
      top: 0,
      width: 280,
      height: "100%",
      backgroundColor: colors.baseContainerBody,
      borderRightWidth: 1,
      borderRightColor: colors.subtitle,
      padding: 15,
      paddingTop: 20,
      zIndex: 5,
    },
    webContentContainer: {
      flex: 1,
      paddingLeft: 0,
    },
    webFilterTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 20,
    },
    horizontalCardContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      padding: 5,
    },
    webCardWrapper: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 300,
      minWidth: 250,
      maxWidth: 400,
      margin: 10,
    },
    webCheckboxContainer: {
      marginTop: 10,
    },
    mobileCheckboxContainer: {
      marginTop: 10,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    checkboxLabel: {
      marginLeft: 8,
      color: colors.text,
    },
    filterSection: {
      marginBottom: 20,
    },
    filterLabel: {
      fontSize: 16,
      fontWeight: "500",
      marginBottom: 10,
      color: colors.text,
    },
    bottomSheetContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "80%",
      backgroundColor: colors.baseContainerBody,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 5,
      overflow: "visible",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    applyButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    applyButtonText: {
      color: colors.background,
      fontWeight: "bold",
      fontSize: 16,
    },
  });
