import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  ToastAndroid,
  Alert,
} from 'react-native';

// Use conditional import for clipboard based on environment
let Clipboard;
try {
  // First try to import Expo's clipboard
  Clipboard = require('expo-clipboard').default;
} catch (error) {
  try {
    // If Expo clipboard fails, try the standalone clipboard package
    Clipboard = require('@react-native-clipboard/clipboard').default;
  } catch (e) {
    // If both fail, fallback to React Native's Clipboard (deprecated but may work in some environments)
    Clipboard = require('react-native').Clipboard;
  }
}
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking } from 'react-native';

const ShareModal = ({ visible, onClose, profileUrl, userName, colors }) => {
  // Animation values
  const [slideAnim] = React.useState(new Animated.Value(Dimensions.get('window').height));
  const [fadeAnim] = React.useState(new Animated.Value(0));

  // List of share platforms
  const sharePlatforms = [
    {
      name: 'Copy Link',
      icon: 'link-outline',
      iconType: 'ionicons',
      backgroundColor: '#6C63FF',
      onPress: handleCopyLink
    },
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      iconType: 'ionicons',
      backgroundColor: '#3b5998',
      onPress: () => handleShareTo('facebook', profileUrl)
    },
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      iconType: 'ionicons',
      backgroundColor: '#E1306C',
      onPress: () => handleShareTo('instagram', profileUrl)
    },
    {
      name: 'Twitter',
      icon: 'logo-twitter',
      iconType: 'ionicons',
      backgroundColor: '#1DA1F2',
      onPress: () => handleShareTo('twitter', profileUrl)
    },
    {
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      iconType: 'ionicons',
      backgroundColor: '#25D366',
      onPress: () => handleShareTo('whatsapp', profileUrl)
    },
    {
      name: 'Email',
      icon: 'mail-outline',
      iconType: 'ionicons',
      backgroundColor: '#D44638',
      onPress: () => handleShareTo('email', profileUrl, userName)
    },
    {
      name: 'Message',
      icon: 'chatbox-outline',
      iconType: 'ionicons',
      backgroundColor: '#34B7F1',
      onPress: () => handleShareTo('sms', profileUrl)
    },
    {
      name: 'More',
      icon: 'share-social-outline',
      iconType: 'ionicons',
      backgroundColor: '#757575',
      onPress: handleShareWithNative
    }
  ];

  // Handle native sharing (uses the device's share sheet)
  function handleShareWithNative() {
    if (Platform.OS === 'web') {
      // Web fallback
      handleCopyLink();
      return;
    }
    
    // For native platforms, use the Share API
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        const ShareAPI = require('react-native').Share;
        ShareAPI.share({
          message: `Check out ${userName}'s profile!`,
          url: profileUrl,
        });
      } catch (error) {
        console.error('Error with native sharing:', error);
        handleCopyLink(); // Fallback
      }
    }
  }

  // Handle copying the link to clipboard
  function handleCopyLink() {
    try {
      if (Clipboard && typeof Clipboard.setString === 'function') {
        Clipboard.setString(profileUrl);
      } else if (Clipboard && typeof Clipboard.setStringAsync === 'function') {
        // For Expo's Clipboard
        Clipboard.setStringAsync(profileUrl);
      } else {
        console.warn('Clipboard functionality is not available');
      }
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Link copied to clipboard!', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Link copied to clipboard!');
      }
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Could not copy link to clipboard');
    }
  }

  // Handle sharing to specific platforms
  function handleShareTo(platform, url, name = userName) {
    let shareUrl = '';
    
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Check out ${name}'s profile!`)}`;
        break;
      case 'whatsapp':
        shareUrl = `whatsapp://send?text=${encodeURIComponent(`Check out ${name}'s profile! ${url}`)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(`Check out ${name}'s profile`)}&body=${encodeURIComponent(`I thought you might be interested in checking out this profile: ${url}`)}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodeURIComponent(`Check out ${name}'s profile! ${url}`)}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we copy to clipboard and instruct the user
        Clipboard.setString(url);
        Alert.alert(
          'Share to Instagram',
          'Link copied to clipboard. Open Instagram and paste in your direct messages to share.',
          [{ text: 'OK', onPress: () => {
            // Try to open Instagram app
            Linking.openURL('instagram://').catch(() => {
              // If Instagram app not available, direct to website
              Alert.alert('Instagram App Not Found', 'Please install Instagram app or share using another method.');
            });
          }}]
        );
        return;
      default:
        break;
    }
    
    if (shareUrl) {
      Linking.canOpenURL(shareUrl).then(supported => {
        if (supported) {
          Linking.openURL(shareUrl);
        } else {
          console.log("Don't know how to open URI: " + shareUrl);
          handleCopyLink(); // Fallback to copying the link
        }
      });
    }
    
    onClose();
  }

  // Animate the modal when it becomes visible
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContainer, 
                { 
                  transform: [{ translateY: slideAnim }],
                  backgroundColor: colors.background || '#fff'
                }
              ]}
            >
              <View style={styles.headerBar} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Share Profile</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.linkContainer}>
                <View style={[styles.linkBox, { backgroundColor: colors.cardBackground || '#f1f5f9' }]}>
                  <Text 
                    style={[styles.linkText, { color: colors.subtitle }]} 
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {profileUrl}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.copyButton, { backgroundColor: colors.primary }]}
                  onPress={handleCopyLink}
                >
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.shareViaText, { color: colors.subtitle }]}>
                Share via
              </Text>
              
              <ScrollView style={styles.platformsContainer}>
                <View style={styles.platformsGrid}>
                  {sharePlatforms.map((platform, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.platformButton}
                      onPress={platform.onPress}
                    >
                      <View style={[styles.platformIconContainer, { backgroundColor: platform.backgroundColor }]}>
                        {platform.iconType === 'ionicons' ? (
                          <Ionicons name={platform.icon} size={24} color="#fff" />
                        ) : (
                          <MaterialCommunityIcons name={platform.icon} size={24} color="#fff" />
                        )}
                      </View>
                      <Text style={[styles.platformText, { color: colors.text }]}>
                        {platform.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 10,
    minHeight: 300,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  headerBar: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  linkContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  linkBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  linkText: {
    fontSize: 14,
  },
  copyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  shareViaText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  platformsContainer: {
    flex: 1,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformButton: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
  },
  platformIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ShareModal;