import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const LocationAndLanguagesScreen = () => {
  const [location, setLocation] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState('');

  // Mock API call for location autocomplete
  const fetchAutocomplete = async (query) => {
    // Replace this mock function with an actual API call to Google Places API or other services.
    const mockResults = ['New York', 'New Delhi', 'New Orleans'].filter((item) =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    setAutocompleteResults(mockResults);
  };

  const handleLocationChange = (text) => {
    setLocation(text);
    if (text.length > 2) {
      fetchAutocomplete(text);
    } else {
      setAutocompleteResults([]);
    }
  };

  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages((prev) => [...prev, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const removeLanguage = (language) => {
    setLanguages((prev) => prev.filter((lang) => lang !== language));
  };

  return (
    <View style={styles.container}>
      {/* Change Location Section */}
      <Text style={styles.sectionTitle}>Change Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Type your location"
        value={location}
        onChangeText={handleLocationChange}
      />
      {autocompleteResults.length > 0 && (
        <FlatList
          data={autocompleteResults}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.autocompleteItem}
              onPress={() => {
                setLocation(item);
                setAutocompleteResults([]);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Spoken Languages Section */}
      <Text style={styles.sectionTitle}>Spoken Languages</Text>
      <View style={styles.languageInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a language"
          value={languageInput}
          onChangeText={setLanguageInput}
        />
        <TouchableOpacity style={styles.addButton} onPress={addLanguage}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  autocompleteItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  languageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 10,
    margin: 5,
  },
  languageText: {
    marginRight: 5,
  },
  removeButton: {
    color: 'red',
    fontWeight: 'bold',
  },
});

export default LocationAndLanguagesScreen;
