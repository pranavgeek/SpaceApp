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

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function HomeScreen({ navigation }) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");
  // Fetched projects state
  const [fetchedProjects, setFetchedProjects] = useState([]);

  // Filtering states
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [showBestSellersOnly, setShowBestSellersOnly] = useState(false);

  // Modal visibility state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalShowBestSellers, setModalShowBestSellers] = useState(false);

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
  ]);

  const isFocused = useIsFocused();

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

  // Bottom sheet animation (mobile) with improved animation
  const BOTTOM_SHEET_HEIGHT = windowHeight * 0.8;
  const slideUpAnim = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const HEADER_MAX_HEIGHT = 130; // Full header height (logo + search)
  const HEADER_MIN_HEIGHT = 60; // Just search bar height
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  const STATUSBAR_HEIGHT =
    Platform.OS === "ios" ? 20 : StatusBar.currentHeight || 0;

  // Create animation value for scroll position
  const scrollY = useRef(new Animated.Value(0)).current;

  // Create interpolation for header movement
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -60],
    extrapolate: "clamp",
  });

  // Use separate state for the modal country dropdown to avoid naming conflicts
  const [modalCountryOpen, setModalCountryOpen] = useState(false);

  // State to control the modal dismissal flow
  const [modalDismissing, setModalDismissing] = useState(false);

  // Sync modal values with selected values when opening
  useEffect(() => {
    if (filterModalVisible) {
      setModalCountry(selectedCountry);
      setModalCity(selectedCity);
      setModalPriceRanges([...selectedPriceRanges]);
      setCategoryValue(selectedFilter);
      setModalShowBestSellers(showBestSellersOnly); // Add this line
    }
  }, [
    filterModalVisible,
    selectedCountry,
    selectedCity,
    selectedPriceRanges,
    selectedFilter,
    showBestSellersOnly,
  ]);

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
      // Clear the selected city when country is cleared
      setSelectedCity("");
    }
  }, [selectedCountry]);

  // Effect for opening modal
  useEffect(() => {
    if (filterModalVisible && !modalDismissing) {
      setShowModal(true);
      // Reset animation values for opening
      slideUpAnim.setValue(BOTTOM_SHEET_HEIGHT);
      modalOpacity.setValue(0);

      // Opening animation sequence
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideUpAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [filterModalVisible, modalDismissing, modalOpacity, slideUpAnim]);

  // Animations for desktop panel and mobile bottom sheet
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

    // Closing animation sequence for modal
    if (modalDismissing) {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: BOTTOM_SHEET_HEIGHT,
          duration: 280,
          easing: (t) => 1 - Math.pow(1 - t, 3), // cubic ease-out
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    showPanel,
    modalDismissing,
    isDesktopWeb,
    panelAnim,
    contentAnim,
    modalOpacity,
    slideUpAnim,
  ]);

  // Mapping fetched products to add country and city properties
  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, users] = await Promise.all([
          fetchProducts(),
          fetchUsers(),
        ]);
        const verifiedProducts = products.filter((p) => p.verified === true);
        // Map seller ID to their actual name
        const sellerMap = {};
        users.forEach((user) => {
          sellerMap[user.user_id] = user.name;
        });

        const mappedProjects = verifiedProducts.map((product, index) => {
          // Extract country from user data if available or use a default
          let productCountry = "";
          let productCity = "";

          // Try to determine country/city from seller location if available
          const seller = users.find(
            (user) => user.user_id === product.user_seller
          );
          if (seller && seller.location) {
            const locationParts = seller.location.split(",");
            if (locationParts.length > 1) {
              productCity = locationParts[0].trim();
              productCountry = locationParts[1].trim();
            } else if (locationParts.length === 1) {
              productCountry = locationParts[0].trim();
            }
          }

          // If product has location data, use that instead
          if (product.country) productCountry = product.country;
          if (product.city) productCity = product.city;

          // Generate random country/city for demo purposes if none exists
          if (!productCountry) {
            const randomCountryIndex = Math.floor(
              Math.random() * countryItems.length
            );
            // Skip the first "All Countries" item
            productCountry =
              countryItems[randomCountryIndex > 0 ? randomCountryIndex : 1]
                .value;
          }

          return {
            id: `${product.product_id}_${index}`,
            category: product.category,
            project: {
              name: product.product_name,
              description: product.description,
              image: product.product_image
                ? product.product_image.startsWith("http")
                  ? product.product_image
                  : product.product_image.startsWith("/")
                    ? `http://10.0.0.25:5001${product.product_image}` // Absolute path with leading slash
                    : `http://10.0.0.25:5001/uploads/products/${product.product_image}` // Relative path
                : "https://via.placeholder.com/300x180?text=No+Image",
              price: product.cost,
              likes: 0,
              summary: product.summary,
              user_seller: product.user_seller,
              country: productCountry,
              city: productCity,
              best_seller:
                product.is_best_seller || product.product_id % 3 === 0,
              product_id: product.product_id, // Keep the original product_id
              product_image: product.product_image, // Keep the original product_image
            },
            creator: {
              name:
                sellerMap[product.user_seller] ||
                `Seller ${product.user_seller}`,
              image: "https://via.placeholder.com/150",
            },
          };
        });

        setFetchedProjects(mappedProjects);

        // Debug log
        console.log(
          "Products loaded with country/city:",
          mappedProjects.map((p) => ({
            id: p.id,
            name: p.project.name,
            country: p.project.country,
            city: p.project.city,
          }))
        );
      } catch (error) {
        console.error("Error loading products or users:", error);
      }
    };

    loadData();
  }, []);

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

  // Filter products based on selected criteria
  const filteredProjects = React.useMemo(() => {
    if (!fetchedProjects || fetchedProjects.length === 0) {
      return [];
    }

    return fetchedProjects.filter((project) => {
      // Make sure we have project and its properties before filtering
      if (!project || !project.project) return false;

      const categoryMatch =
        !selectedFilter || project.category === selectedFilter;

      const bestSellerMatch =
        !showBestSellersOnly || project.project.best_seller === true;

      const priceMatch =
        selectedPriceRanges.length === 0 ||
        selectedPriceRanges.some((range) =>
          checkPriceRange(range, project.project.price)
        );

      // Country matching - use the country property from project
      const countryMatch =
        !selectedCountry ||
        selectedCountry === "" ||
        (project.project.country &&
          project.project.country === selectedCountry);

      // City matching - use the city property from project
      const cityMatch =
        !selectedCity ||
        selectedCity === "" ||
        (project.project.city && project.project.city === selectedCity);

      const searchMatch =
        !searchQuery ||
        searchQuery === "" ||
        project.project.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (project.project.description &&
          project.project.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      return (
        categoryMatch &&
        priceMatch &&
        countryMatch &&
        cityMatch &&
        searchMatch &&
        bestSellerMatch
      );
    });
  }, [
    fetchedProjects,
    selectedFilter,
    selectedPriceRanges,
    selectedCountry,
    selectedCity,
    searchQuery,
  ]);

  // Filtering logic checks category, price, country, and city
  function checkPriceRange(range, price) {
    return price >= range.min && price <= range.max;
  }

  // Handle filter button press
  const handleFilterPress = () => {
    if (isDesktopWeb) {
      setShowPanel(!showPanel);
    } else {
      setModalPriceRanges([...selectedPriceRanges]);
      setModalCountry(selectedCountry);
      setModalCity(selectedCity);
      setCategoryValue(selectedFilter);
      setModalShowBestSellers(showBestSellersOnly);
      setFilterModalVisible(true);
    }
  };

  // Handle modal close with animation
  const handleCloseModal = () => {
    // Start dismissing animation
    setModalDismissing(true);

    // This delay matches the animation duration before actually removing the modal
    setTimeout(() => {
      setFilterModalVisible(false);
      setShowModal(false);
      // Reset dismissing state after modal is fully closed
      setModalDismissing(false);
    }, 300);
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
              style={styles.checkbox}
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
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>{option.display}</Text>
          </View>
        );
      })}
    </View>
  );

  // Update modal city items when modal country changes
  useEffect(() => {
    if (modalCountry) {
      const filteredCities = mockCities.filter((cityStr) => {
        const parts = cityStr.split(",");
        const cityCountry = parts[1]?.trim() || "";
        return cityCountry === modalCountry;
      });
      const dropdownItems = filteredCities.map((cityStr) => {
        const cityName = cityStr.split(",")[0].trim();
        return { label: cityName, value: cityName };
      });
      setCityItems([{ label: "All Cities", value: "" }, ...dropdownItems]);
    } else {
      setCityItems([{ label: "All Cities", value: "" }]);
      setModalCity("");
    }
  }, [modalCountry]);

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
        <Animated.View
          style={[
            styles.headerContainer,
            {
              height: isDesktopWeb
                ? HEADER_MAX_HEIGHT
                : headerHeight + STATUSBAR_HEIGHT,
              paddingTop: isDesktopWeb ? 0 : STATUSBAR_HEIGHT,
              zIndex: 999,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.customHeader,
              {
                opacity: isDesktopWeb ? 1 : headerOpacity,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cartIconContainer}>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => navigation.navigate("CartScreen")}
              >
                <Icon name="shoppingcart" size={22} color={colors.background} />
                {totalItems > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.searchBarContainer,
              {
                transform: [
                  { translateY: isDesktopWeb ? 0 : searchBarTranslateY },
                ],
              },
            ]}
          >
            <View style={styles.searchInputWrap}>
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.subtitle}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="What are you looking for?"
                placeholderTextColor={colors.placeholderText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleFilterPress}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.background}
              />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ACTIVE FILTERS DISPLAY */}
        {(selectedFilter ||
          selectedCountry ||
          selectedCity ||
          selectedPriceRanges.length > 0 ||
          showBestSellersOnly) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {showBestSellersOnly && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>Best Sellers Only</Text>
                  <TouchableOpacity
                    onPress={() => setShowBestSellersOnly(false)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.background}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFilter && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Category: {selectedFilter}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedFilter("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.background}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedCountry && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Country: {selectedCountry}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCountry("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.background}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedCity && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    City: {selectedCity}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCity("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.background}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedPriceRanges.map((range, index) => (
                <View key={index} style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>
                    Price: {range.display}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedPriceRanges(
                        selectedPriceRanges.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.background}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MOBILE CATEGORY PILLS */}
        {/* {!isDesktopWeb && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPills}>
            <TouchableOpacity 
              style={[styles.pill, selectedFilter === "" && styles.pillActive]} 
              onPress={() => setSelectedFilter("")}
            >
              <Text style={[styles.pillText, selectedFilter === "" && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>
            {categoryItems.slice(1).map(item => (
              <TouchableOpacity 
                key={item.value} 
                style={[styles.pill, selectedFilter === item.value && styles.pillActive]} 
                onPress={() => setSelectedFilter(item.value)}
              >
                <Text style={[styles.pillText, selectedFilter === item.value && styles.pillTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )} */}

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
                <Text style={styles.filterLabel}>Category</Text>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  style={styles.webDropdown}
                >
                  <option value="">All Categories</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                {renderWebCheckboxes(
                  priceRanges,
                  selectedPriceRanges,
                  setSelectedPriceRanges
                )}
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Country</Text>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  style={styles.webDropdown}
                >
                  {countryItems.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </View>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>City</Text>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  style={styles.webDropdown}
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
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="search-outline"
                        size={50}
                        color={colors.subtitle}
                      />
                      <Text style={styles.emptyStateText}>
                        No items found. Try adjusting your filters.
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        ) : (
          // MOBILE LAYOUT
          <View
            style={[
              styles.content,
              {
                marginTop: isDesktopWeb
                  ? 0
                  : HEADER_MAX_HEIGHT + STATUSBAR_HEIGHT,
              },
            ]}
          >
            {filteredProjects.length > 0 ? (
              <FlatList
                data={filteredProjects}
                keyExtractor={(item, index) => `${item.id}_${index}`}
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.mobileListContent}
                // Add these props to capture scroll events
                scrollEventThrottle={16}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: false }
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={50}
                  color={colors.subtitle}
                />
                <Text style={styles.emptyStateText}>
                  No items found. Try adjusting your filters.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* MODAL for mobile filter options */}
        {(showModal || modalDismissing) && (
          <Modal transparent={true} visible={true} animationType="none">
            <TouchableWithoutFeedback onPress={handleCloseModal}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(0,0,0,0.5)",
                    opacity: modalOpacity,
                  },
                ]}
              />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  transform: [{ translateY: slideUpAnim }],
                },
              ]}
            >
              {/* Handle for dragging */}
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Options</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={22} color={colors.background} />
                </TouchableOpacity>
              </View>

              {/* <ScrollView
                style={styles.modalScrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              > */}
              {/* Category filter section */}
              <View style={[styles.filterSection, { zIndex: 3000 }]}>
                <Text style={styles.filterLabel}>Category</Text>
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
                  style={styles.dropdownStyle}
                  dropDownContainerStyle={styles.dropdownContainer}
                  textStyle={styles.dropdownText}
                  containerStyle={styles.dropdownWrap}
                  zIndex={3000}
                  zIndexInverse={1000}
                  onOpen={() => {
                    setCityOpen(false);
                    setModalCountryOpen(false);
                  }}
                />
              </View>

              {/* Best Seller filter for mobile */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Product Type</Text>
                <View style={styles.checkboxRow}>
                  <CheckBox
                    value={modalShowBestSellers}
                    onValueChange={setModalShowBestSellers}
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkboxLabel}>Best Sellers Only</Text>
                </View>
              </View>

              {/* Price Range section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Price Range</Text>
                {renderMobilePriceCheckboxes(
                  priceRanges,
                  modalPriceRanges,
                  setModalPriceRanges
                )}
              </View>

              {/* Country and City dropdowns - moved below price range to fix overlap */}
              <View style={styles.doubleDropdownContainer}>
                <View style={[styles.halfDropdown, { zIndex: 2000 }]}>
                  <Text style={styles.filterLabel}>Country</Text>
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
                    style={styles.dropdownStyle}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    containerStyle={styles.dropdownWrap}
                    zIndex={2000}
                    zIndexInverse={2000}
                    onOpen={() => {
                      setCategoryOpen(false);
                      setCityOpen(false);
                    }}
                  />
                </View>
                <View style={[styles.halfDropdown, { zIndex: 1000 }]}>
                  <Text style={styles.filterLabel}>City</Text>
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
                    style={styles.dropdownStyle}
                    dropDownContainerStyle={styles.dropdownContainer}
                    textStyle={styles.dropdownText}
                    containerStyle={styles.dropdownWrap}
                    zIndex={1000}
                    zIndexInverse={1000}
                    onOpen={() => {
                      setCategoryOpen(false);
                      setModalCountryOpen(false);
                    }}
                  />
                </View>
              </View>
              {/* </ScrollView> */}

              <TouchableOpacity
                style={styles.applyButton}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedPriceRanges([...modalPriceRanges]);
                  setSelectedCountry(modalCountry);
                  setSelectedCity(modalCity);
                  setSelectedFilter(categoryValue);
                  setShowBestSellersOnly(modalShowBestSellers); // Add this line
                  handleCloseModal();
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

// Redesigned dynamic styles
const getDynamicStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      backgroundColor: colors.background,
      overflow: "hidden",
      position: "absolute",
      top: Platform.OS === "ios" ? 50 : 0,
      left: 0,
      right: 0,
      zIndex: 999,
      borderBottomWidth: 5,
      borderBottomColor: colors.baseContainerBody,
    },
    customHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      height: 60,
      backgroundColor: colors.background,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: 110,
      height: 100,
    },
    cartIconContainer: {
      position: "relative",
    },
    cartButton: {
      backgroundColor: colors.primary,
      borderRadius: 50,
      width: 46,
      height: 46,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    badge: {
      position: "absolute",
      top: -5,
      right: -5,
      backgroundColor: colors.error || "red",
      borderRadius: 12,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.background,
    },
    badgeText: {
      color: "white",
      fontSize: 10,
      fontWeight: "bold",
      paddingHorizontal: 4,
    },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.background,
      justifyContent: "space-between",
      height: 70,
    },
    searchInputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.baseContainerBody,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginRight: 10,
      height: 46,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      height: "100%",
    },
    placeholderText: {
      color: colors.subtitle,
      opacity: 0.7,
    },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 46,
      height: 46,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    categoryPills: {
      paddingHorizontal: 16,
      marginBottom: 8,
      flexGrow: 0,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.baseContainerBody,
      marginRight: 8,
      marginBottom: 8,
    },
    pillActive: {
      backgroundColor: colors.primary,
    },
    pillText: {
      color: colors.text,
      fontSize: 14,
    },
    pillTextActive: {
      color: colors.background,
      fontWeight: "600",
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
    },
    mobileListContent: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      paddingTop: 8, // Reduced from the original to account for the header padding
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
      borderRightColor: "rgba(0,0,0,0.05)",
      padding: 24,
      paddingTop: 30,
      zIndex: 5,
      shadowColor: "#000",
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    webContentContainer: {
      flex: 1,
      paddingLeft: 0,
      backgroundColor: colors.background,
    },
    webFilterTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 30,
    },
    horizontalCardContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      padding: 16,
    },
    webCardWrapper: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 300,
      minWidth: 280,
      maxWidth: 400,
      margin: 12,
      borderRadius: 16,
      overflow: "hidden",
    },
    webCheckboxContainer: {
      marginTop: 10,
    },
    mobileCheckboxContainer: {
      marginTop: 8,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    checkbox: {
      borderRadius: 4,
      margin: 0,
    },
    checkboxLabel: {
      marginLeft: 12,
      color: colors.text,
      fontSize: 15,
    },
    filterSection: {
      marginBottom: 24,
    },
    filterLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
      color: colors.text,
    },
    bottomSheetContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "80%",
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    sheetHandle: {
      width: 40,
      height: 5,
      backgroundColor: "rgba(0,0,0,0.2)",
      borderRadius: 3,
      alignSelf: "center",
      marginBottom: 16,
    },
    modalScrollView: {
      flex: 1,
      marginBottom: 8,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    closeButton: {
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    applyButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    applyButtonText: {
      color: colors.background,
      fontWeight: "700",
      fontSize: 16,
    },
    doubleDropdownContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 24,
      position: "relative",
      zIndex: 2000,
    },
    halfDropdown: {
      width: "48%",
      position: "relative",
    },
    dropdownStyle: {
      borderColor: "rgba(0,0,0,0.1)",
      borderWidth: 1,
      borderRadius: 12,
      minHeight: 46,
      paddingHorizontal: 12,
      backgroundColor: colors.baseContainerBody,
    },
    dropdownContainer: {
      borderColor: "rgba(0,0,0,0.1)",
      borderWidth: 1,
      borderTopWidth: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    dropdownText: {
      color: colors.text,
      fontSize: 14,
    },
    dropdownWrap: {
      overflow: "visible",
    },
    webDropdown: {
      width: "100%",
      padding: 12,
      fontSize: 15,
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: "transparent",
      color: colors.text,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      minHeight: 300,
    },
    emptyStateText: {
      color: colors.subtitle,
      fontSize: 16,
      marginTop: 16,
      textAlign: "center",
      maxWidth: 250,
    },
    activeFiltersContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.baseContainerBody,
    },
    activeFiltersTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    activeFilterTag: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 4,
    },
    activeFilterText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: "500",
      marginRight: 6,
    },
  });
