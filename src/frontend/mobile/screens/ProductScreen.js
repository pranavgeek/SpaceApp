import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const projects = [
  {
    id: '1',
    name: 'Project Alpha',
    image: 'https://via.placeholder.com/150',
    unitPrice: 25,
    totalSales: 120,
    likes: 35,
    messages: 15,
  },
  {
    id: '2',
    name: 'Project Beta',
    image: 'https://via.placeholder.com/150',
    unitPrice: 30,
    totalSales: 90,
    likes: 50,
    messages: 20,
  },
  {
    id: '3',
    name: 'Project Gamma',
    image: 'https://via.placeholder.com/150',
    unitPrice: 40,
    totalSales: 70,
    likes: 42,
    messages: 10,
  },
];

const ProjectCard = ({ project, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.projectName}>{project.name}</Text>
    </View>

    {/* Image */}
    <Image source={{ uri: project.image }} style={styles.image} />

    {/* Footer */}
    <View style={styles.footer}>
      <View>
        <Text style={styles.unitPrice}>Unit Price: ${project.unitPrice}</Text>
        <Text style={styles.totalSales}>Total Sales: {project.totalSales}</Text>
      </View>

      <View style={styles.footerIcons}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={16} color="red" />
          <Text style={styles.iconText}>{project.likes}</Text>
        </View>

        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble" size={16} color="gray" />
          <Text style={styles.iconText}>{project.messages}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const DetailsScreen = ({ route }) => {
    const { project } = route.params;

    return (
        <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>{project.name}</Text>
        <Image source={{ uri: project.image }} style={styles.detailsImage} />
        <Text style={styles.detailsText}>Unit Price: ${project.unitPrice}</Text>
        <Text style={styles.detailsText}>Total Sales: {project.totalSales}</Text>
        <Text style={styles.detailsText}>Likes: {project.likes}</Text>
        <Text style={styles.detailsText}>Messages: {project.messages}</Text>
        </View>
    );
};

const ProductScreen = ({ navigation }) => {
    const handlePress = (project) => {
        navigation.navigate('Details', { project });
    };

    return (
        <FlatList
        data={projects}
        renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => handlePress(item)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        />
    );
};

export default ProductScreen;

const styles = StyleSheet.create({
    list: {
      padding: 10,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 8,
      marginBottom: 10,
      overflow: 'hidden',
      elevation: 3,
    },
    header: {
      padding: 10,
      backgroundColor: '#f8f8f8',
    },
    projectName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    image: {
      width: '100%',
      height: 150,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
      backgroundColor: '#f8f8f8',
    },
    unitPrice: {
      fontSize: 14,
      color: '#333',
    },
    totalSales: {
      fontSize: 14,
      color: '#666',
    },
    footerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
    },
    iconText: {
      marginLeft: 4,
      fontSize: 14,
    },
    detailsContainer: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
    },
    detailsTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    detailsImage: {
      width: '100%',
      height: 200,
      marginBottom: 20,
    },
    detailsText: {
      fontSize: 16,
      marginBottom: 5,
    },
  });
  