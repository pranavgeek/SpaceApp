import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Keyboard,
  Animated,
  Platform,
} from "react-native";
import BaseContainer from "../components/BaseContainer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../theme/ThemeContext.js";
import { mockCities, mockLanguages } from "../data/MockData";
import { Ionicons } from "@expo/vector-icons";

const LocationAndLanguagesScreen = () => {
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");
  const [autocompleteLocation, setAutocompleteLocation] = useState([]);
  const [autocompleteLanguages, setAutocompleteLanguages] = useState([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const autocompleteOpacity = useState(new Animated.Value(0))[0];

  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Animate autocomplete appearance
  useEffect(() => {
    if (autocompleteLocation.length > 0 || autocompleteLanguages.length > 0) {
      Animated.timing(autocompleteOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(autocompleteOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [autocompleteLocation, autocompleteLanguages]);

  // Function to save location and languages to AsyncStorage asynchronously
  const saveData = async (location, languages) => {
    try {
      await AsyncStorage.setItem("location", location); // Save location
      await AsyncStorage.setItem("languages", JSON.stringify(languages)); // Save languages
      console.log("Data saved successfully");
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  // Function to load saved location and languages from AsyncStorage
  const loadData = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("location");
      const savedLanguages = await AsyncStorage.getItem("languages");

      if (savedLocation) {
        setLocation(savedLocation);
      }

      if (savedLanguages) {
        setLanguages(JSON.parse(savedLanguages));
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  // Use useEffect to load saved data when the component mounts
  useEffect(() => {
    loadData();
  }, []);

  // Mock API call for location autocomplete
  const fetchLanguageAutocomplete = async (query) => {
    const mockResults = mockLanguages.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setAutocompleteLanguages(mockResults);
  };

  const fetchLocationAutocomplete = async (query) => {
    const mockResults = mockCities.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setAutocompleteLocation(mockResults);
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    if (text.length > 2) {
      fetchLocationAutocomplete(text);
    } else {
      setAutocompleteLocation([]);
    }
  };

  const handleLanguageChange = (text) => {
    setLanguageInput(text);
    if (text.length > 2) {
      fetchLanguageAutocomplete(text);
    } else {
      setAutocompleteLanguages([]);
    }
  };

  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      const newLanguages = [...languages, languageInput.trim()];
      setLanguages(newLanguages);
      setLanguageInput("");
      setAutocompleteLanguages([]);
      saveData(location, newLanguages);
    }
  };

  const removeLanguage = (language) => {
    const newLanguages = languages.filter((lang) => lang !== language);
    setLanguages(newLanguages);
    saveData(location, newLanguages);
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setAutocompleteLocation([]);
    Keyboard.dismiss();

    const parts = selectedLocation.split(",");
    const country = parts[1]?.trim() || "";
    saveData(selectedLocation, languages);
    // Save the country for later use in filtering
    AsyncStorage.setItem("userCountry", country);
  };

  const handleLanguageSelect = (selectedLanguage) => {
    if (!languages.includes(selectedLanguage)) {
      const newLanguages = [...languages, selectedLanguage];
      setLanguages(newLanguages);
      saveData(location, newLanguages);
    }
    setLanguageInput("");
    setAutocompleteLanguages([]);
    Keyboard.dismiss();
  };

  const renderAutocompleteItem = (item, isLocation = false) => (
    <TouchableOpacity
      style={styles.autocompleteItem}
      onPress={() => isLocation ? handleLocationSelect(item) : handleLanguageSelect(item)}
    >
      <Ionicons
        name={isLocation ? "location-outline" : "language-outline"}
        size={18}
        color={colors.text}
        style={styles.autocompleteIcon}
      />
      <Text style={styles.autocompleteText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Change Location Section */}
      <BaseContainer
        title={"Location"}
        subtitle={"Select your current location"}
      >
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color={colors.text} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Type your location"
            value={location}
            onChangeText={handleLocationChange}
            placeholderTextColor={colors.placeholder}
          />
          {location.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setLocation("");
                setAutocompleteLocation([]);
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        <Animated.View 
          style={[
            styles.autocompleteContainer,
            { opacity: autocompleteOpacity }
          ]}
        >
          {autocompleteLocation.length > 0 && (
            <FlatList
              data={autocompleteLocation}
              keyExtractor={(item, index) => `location-${index}`}
              renderItem={({ item }) => renderAutocompleteItem(item, true)}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.autocompleteList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>
      </BaseContainer>

      {/* Add Spoken Languages Section */}
      <BaseContainer
        title={"Spoken Languages"}
        subtitle={"Select all the languages you are able to communicate in"}
      >
        <View style={styles.languageInputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="language-outline" size={20} color={colors.text} style={styles.inputIcon} />
            <TextInput
              style={styles.inputLanguage}
              placeholder="Add a language"
              value={languageInput}
              onChangeText={handleLanguageChange}
              placeholderTextColor={colors.placeholder}
            />
            {languageInput.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setLanguageInput("");
                  setAutocompleteLanguages([]);
                }}
              >
                <Ionicons name="close-circle" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[
              styles.addButton,
              !languageInput.trim() && styles.addButtonDisabled
            ]} 
            onPress={addLanguage}
            disabled={!languageInput.trim()}
          >
            <Ionicons name="add" size={22} color={colors.buttonText} />
          </TouchableOpacity>
        </View>
        
        <Animated.View 
          style={[
            styles.autocompleteContainer,
            { opacity: autocompleteOpacity }
          ]}
        >
          {autocompleteLanguages.length > 0 && (
            <FlatList
              data={autocompleteLanguages}
              keyExtractor={(item, index) => `language-${index}`}
              renderItem={({ item }) => renderAutocompleteItem(item, false)}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.autocompleteList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>
        
        <View style={styles.languageTags}>
          {languages.length === 0 ? (
            <Text style={styles.noLanguagesText}>No languages added yet</Text>
          ) : (
            languages.map((language, index) => (
              <View key={index} style={styles.languageTag}>
                <Text style={styles.languageTagText}>{language}</Text>
                <TouchableOpacity 
                  style={styles.removeButtonContainer} 
                  onPress={() => removeLanguage(language)}
                >
                  <Ionicons name="close" size={16} color={colors.buttonText} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </BaseContainer>
      
      {/* Padding at bottom for better scrolling experience */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      backgroundColor: colors.baseContainerFooter || 'rgba(255, 255, 255, 0.08)',
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      color: colors.text,
      padding: Platform.OS === 'ios' ? 14 : 10,
      fontSize: 16,
    },
    clearButton: {
      padding: 4,
    },
    autocompleteContainer: {
      maxHeight: 200,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 8,
      backgroundColor: colors.baseContainerFooter || 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    autocompleteList: {
      width: '100%',
    },
    autocompleteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    autocompleteIcon: {
      marginRight: 10,
    },
    autocompleteText: {
      color: colors.text,
      fontSize: 16,
    },
    languageInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.baseContainerFooter || 'rgba(255, 255, 255, 0.08)',
    },
    inputLanguage: {
      flex: 1,
      color: colors.text,
      padding: Platform.OS === 'ios' ? 14 : 10,
      fontSize: 16,
    },
    addButton: {
      marginLeft: 10,
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    addButtonDisabled: {
      backgroundColor: colors.disabled || 'rgba(255, 255, 255, 0.3)',
    },
    addButtonText: {
      color: colors.buttonText,
      fontWeight: "bold",
      fontSize: 16,
    },
    languageTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 16,
    },
    noLanguagesText: {
      color: colors.placeholder,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    languageTag: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accent || colors.primary,
      borderRadius: 20,
      paddingVertical: 8,
      paddingLeft: 12,
      paddingRight: 8,
      margin: 4,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    languageTagText: {
      color: colors.buttonText,
      fontWeight: "600",
      marginRight: 6,
    },
    removeButtonContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholder: {
      color: colors.placeholder || 'rgba(255, 255, 255, 0.5)',
    },
    bottomPadding: {
      height: 60,
    },
  });

export default LocationAndLanguagesScreen;