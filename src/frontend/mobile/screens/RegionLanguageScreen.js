import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import BaseContainer from '../components/BaseContainer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext.js';
import { mockCities, mockLanguages } from '../data/MockData';

const LocationAndLanguagesScreen = () => {
  const [location, setLocation] = useState('');
  
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState('');
  const [autocompleteLocation, setAutocompleteLocation] = useState([]);
  const [autocompleteLanguages, setAutocompleteLanguages] = useState([]);

  const {colors } = useTheme();
  const styles = getDynamicStyles(colors);

  // Function to save location and languages to AsyncStorage asynchronously
  const saveData = async (location, languages) => {
    try {
      await AsyncStorage.setItem('location', location);  // Save location
      await AsyncStorage.setItem('languages', JSON.stringify(languages));  // Save languages
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data', error);
    }
  };

  // Function to load saved location and languages from AsyncStorage
  const loadData = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('location');
      const savedLanguages = await AsyncStorage.getItem('languages');
      
      if (savedLocation) {
        setLocation(savedLocation);
      }
      
      if (savedLanguages) {
        setLanguages(JSON.parse(savedLanguages));
      }
    } catch (error) {
      console.error('Error loading data', error);
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
      setLanguageInput('');
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
    saveData(selectedLocation, languages);  
  };

  const handleLanguageSelect = (selectedLanguage) => {
    setLanguageInput(selectedLanguage);
    setAutocompleteLanguages([]);
  };

  return (
    <View style={styles.container}>
      {/* Change Location Section */}

      <BaseContainer title={"Location"} subtitle={"Select your current location"}>
        <TextInput
          style={styles.input}
          placeholder="Type your location"
          value={location}
          onChangeText={handleLocationChange}
          placeholderTextColor={colors.subtitle}
        />
        {autocompleteLocation.length > 0 && (
          <FlatList
            data={autocompleteLocation}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.autocompleteItem}
                onPress={() => handleLocationSelect(item)}
              >
                <Text style={styles.languageText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </BaseContainer>

      {/* Add Spoken Languages Section */}
        <BaseContainer title={"Spoken Languages"} subtitle={"Select all the languages you are able to comunicate"}>
        <View style={styles.languageInputContainer}>
          <TextInput
            style={styles.inputLanguage}
            placeholder="Add a language"
            value={languageInput}
            onChangeText={handleLanguageChange}
            placeholderTextColor={colors.subtitle}
          />
          <TouchableOpacity style={styles.addButton} onPress={addLanguage}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          
        </View>
        {autocompleteLanguages.length > 0 && (
          <FlatList
            data={autocompleteLanguages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.autocompleteItem}
                onPress={() => handleLanguageSelect(item)}
              >
                <Text style={styles.languageText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}
        <View style={styles.languageTags}>
          {languages.map((language, index) => (
            <View key={index} style={styles.languageTag}>
              <Text style={styles.languageText}>{language}</Text>
              <TouchableOpacity onPress={() => removeLanguage(language)}>
                <Text style={styles.removeButton}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </BaseContainer>
      
      
    </View>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.subtitle,
    color: colors.text,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  inputLanguage: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.subtitle,
    color: colors.text,
    borderRadius: 8,
    padding: 10,
  },
  autocompleteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtitle,
    color: colors.text,
  },
  languageInputContainer: {
    flexDirection: 'row',
    color: colors.text,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  languageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 10,
    margin: 5,
  },
  languageText: {
    marginRight: 5,
    color: colors.text,
  },
  removeButton: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default LocationAndLanguagesScreen;
