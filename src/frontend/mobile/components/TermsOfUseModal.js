import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const TermsOfUseModal = ({ isVisible, onAccept, onDecline }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onDecline}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Terms of Use</Text>
            <TouchableOpacity onPress={onDecline} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.termsScroll}>
            <Text style={styles.sectionTitle}>Messaging & Communication Policy</Text>
            
            <Text style={styles.paragraph}>
              To ensure a safe and secure marketplace for all users, please read and agree to the following terms:
            </Text>

            <Text style={styles.bulletPoint}>
              • All communication between users must remain within the app. Sharing contact information like phone numbers, email addresses, or social media accounts is prohibited.
            </Text>

            <Text style={styles.bulletPoint}>
              • Messages containing external contact information will be automatically filtered to protect both parties.
            </Text>

            <Text style={styles.bulletPoint}>
              • Attempting to move conversations to other platforms (WhatsApp, Telegram, etc.) is not allowed and may result in account suspension.
            </Text>

            <Text style={styles.bulletPoint}>
              • All transactions must be conducted through our secure platform. Off-platform transactions are strictly prohibited.
            </Text>

            <Text style={styles.bulletPoint}>
              • We use automated systems to detect prohibited content in messages. Repeated violations may result in temporary or permanent messaging restrictions.
            </Text>

            <Text style={styles.paragraph}>
              These measures are in place to protect all users from fraud and to ensure a safe marketplace experience. By using our messaging system, you agree to abide by these terms.
            </Text>

            <Text style={styles.sectionTitle}>Reporting Violations</Text>
            
            <Text style={styles.paragraph}>
              If someone asks you to communicate off the platform:
            </Text>

            <Text style={styles.bulletPoint}>
              • Use the "Report" option in the chat
            </Text>
            
            <Text style={styles.bulletPoint}>
              • Do not share your personal contact information
            </Text>
            
            <Text style={styles.bulletPoint}>
              • Contact our support team if you need assistance
            </Text>
            
            <View style={styles.spacer} />
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.declineButton]} 
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton]} 
              onPress={onAccept}
            >
              <Text style={styles.acceptButtonText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Terms of Use Manager Component
export const TermsOfUseManager = ({ children }) => {
  const [termsVisible, setTermsVisible] = useState(false);
  
  useEffect(() => {
    checkTermsAcceptance();
  }, []);

  const checkTermsAcceptance = async () => {
    try {
      const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedMessagingTerms');
      const lastPromptDate = await AsyncStorage.getItem('lastMessagingTermsPrompt');
      
      const shouldShowTerms = 
        !hasAcceptedTerms || 
        !lastPromptDate || 
        isTermsPromptDue(lastPromptDate);
      
      if (shouldShowTerms) {
        setTermsVisible(true);
        await AsyncStorage.setItem('lastMessagingTermsPrompt', new Date().toISOString());
      }
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
    }
  };
  
  const isTermsPromptDue = (lastPromptDate) => {
    // Show terms again after 30 days
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const lastPrompt = new Date(lastPromptDate).getTime();
    const currentDate = new Date().getTime();
    
    return currentDate - lastPrompt > thirtyDaysInMs;
  };

  const handleAcceptTerms = async () => {
    try {
      await AsyncStorage.setItem('hasAcceptedMessagingTerms', 'true');
      await AsyncStorage.setItem('lastMessagingTermsPrompt', new Date().toISOString());
      setTermsVisible(false);
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
    }
  };

  const handleDeclineTerms = () => {
    // You might want to limit app functionality if terms are declined
    setTermsVisible(false);
  };

  return (
    <>
      {children}
      <TermsOfUseModal 
        isVisible={termsVisible}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </>
  );
};

const getStyles = (colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtitle + '30',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  termsScroll: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 15,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    marginBottom: 10,
    paddingLeft: 10,
  },
  spacer: {
    height: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.subtitle + '30',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  declineButton: {
    backgroundColor: colors.subtitle + '20',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: colors.text,
  },
});

export default TermsOfUseManager;