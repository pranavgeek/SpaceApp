import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reportReasons = [
  { id: 'external_contact', label: 'Sharing external contact info' },
  { id: 'spam', label: 'Spam or advertising' },
  { id: 'scam', label: 'Potential scam' },
  { id: 'offensive', label: 'Offensive content' },
  { id: 'transaction', label: 'Off-platform transaction request' },
  { id: 'other', label: 'Other (please specify)' }
];

const ReportMessage = ({ isVisible, onClose, message, user, chatPartner }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create report object
      const report = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        reporter: user.name,
        reportedUser: chatPartner,
        messageId: message.id,
        messageContent: message.text,
        reason: selectedReason,
        additionalInfo: additionalInfo,
        status: 'pending'
      };
      
      // Store report in AsyncStorage
      const storedReports = await AsyncStorage.getItem('messageReports');
      const reports = storedReports ? JSON.parse(storedReports) : [];
      reports.push(report);
      
      await AsyncStorage.setItem('messageReports', JSON.stringify(reports));
      
      // Success feedback
      Alert.alert(
        'Report Submitted',
        'Thank you for reporting this message. Our team will review it shortly.',
        [{ text: 'OK', onPress: onClose }]
      );
      
      // Reset form
      setSelectedReason(null);
      setAdditionalInfo('');
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReasonItem = (reason) => (
    <TouchableOpacity
      key={reason.id}
      style={[
        styles.reasonItem,
        selectedReason === reason.id && styles.selectedReasonItem
      ]}
      onPress={() => setSelectedReason(reason.id)}
    >
      <View style={styles.radioContainer}>
        <View style={[
          styles.radioOuter,
          selectedReason === reason.id && styles.radioOuterSelected
        ]}>
          {selectedReason === reason.id && <View style={styles.radioInner} />}
        </View>
      </View>
      <Text style={styles.reasonText}>{reason.label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Report Message</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollContent}>
            <View style={styles.messagePreview}>
              <Text style={styles.previewLabel}>Reported Message:</Text>
              <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{message?.text}</Text>
                <Text style={styles.messageInfo}>
                  From: {message?.type === 'sent' ? user.name : chatPartner}
                </Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>Select a reason for reporting:</Text>
            <View style={styles.reasonsContainer}>
              {reportReasons.map(renderReasonItem)}
            </View>
            
            {selectedReason === 'other' && (
              <View style={styles.additionalInfoContainer}>
                <Text style={styles.additionalInfoLabel}>Please provide details:</Text>
                <TextInput
                  style={styles.additionalInfoInput}
                  multiline={true}
                  numberOfLines={4}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder="Please explain why you're reporting this message..."
                  placeholderTextColor={colors.subtitle}
                />
              </View>
            )}
            
            <View style={styles.policyNote}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.policyText}>
                Our team will review this report. Sharing contact information outside the app violates our Terms of Use.
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, !selectedReason && styles.disabledButton]} 
              onPress={handleSubmitReport}
              disabled={!selectedReason || submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Report Message Button Component
export const ReportMessageButton = ({ message, user, chatPartner }) => {
  const [reportVisible, setReportVisible] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);
  
  const handleOpenReport = () => {
    setReportVisible(true);
  };
  
  const handleCloseReport = () => {
    setReportVisible(false);
  };
  
  return (
    <>
      <TouchableOpacity 
        style={styles.reportButton}
        onPress={handleOpenReport}
      >
        <Ionicons name="flag" size={16} color={colors.subtitle} />
        <Text style={styles.reportButtonText}>Report</Text>
      </TouchableOpacity>
      
      <ReportMessage 
        isVisible={reportVisible}
        onClose={handleCloseReport}
        message={message}
        user={user}
        chatPartner={chatPartner}
      />
    </>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtitle + '20',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 15,
  },
  messagePreview: {
    marginBottom: 20,
  },
  previewLabel: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: 5,
  },
  messageContainer: {
    backgroundColor: colors.baseContainerBody,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  messageInfo: {
    fontSize: 12,
    color: colors.subtitle,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.subtitle + '10',
  },
  selectedReasonItem: {
    backgroundColor: colors.primary + '10',
  },
  radioContainer: {
    marginRight: 10,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.subtitle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonText: {
    fontSize: 14,
    color: colors.text,
  },
  additionalInfoContainer: {
    marginBottom: 20,
  },
  additionalInfoLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 5,
  },
  additionalInfoInput: {
    backgroundColor: colors.baseContainerBody,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.subtitle + '30',
    textAlignVertical: 'top',
  },
  policyNote: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '10',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  policyText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 5,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.subtitle + '20',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: colors.subtitle + '20',
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.subtitle + '50',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  reportButtonText: {
    fontSize: 12,
    color: colors.subtitle,
    marginLeft: 5,
  },
});

export default ReportMessageButton;