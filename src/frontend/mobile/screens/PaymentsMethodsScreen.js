import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  Button,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import ButtonSettings from "../components/ButtonSettings";
import ButtonMain from "../components/ButtonMain";
import { useTheme } from '../theme/ThemeContext.js';

const PaymentMethodsScreen = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    ccv: "",
    cardName: "",
  });
  const [defaultCardId, setDefaultCardId] = useState(null);
  const [errors, setErrors] = useState({}); 
  const { colors } = useTheme();
  const styles = getDynamicStyles(colors);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const savedMethods = await AsyncStorage.getItem("paymentMethods");
        const savedDefaultId = await AsyncStorage.getItem("defaultCardId");

        if (savedMethods) setPaymentMethods(JSON.parse(savedMethods));
        if (savedDefaultId) setDefaultCardId(savedDefaultId);
      } catch (error) {
        console.error("Failed to load payment data:", error);
      }
    };

    loadPaymentData();
  }, []);

  const savePaymentData = async (methods, defaultId) => {
    try {
      await AsyncStorage.setItem("paymentMethods", JSON.stringify(methods));
      if (defaultId !== null) await AsyncStorage.setItem("defaultCardId", defaultId);
    } catch (error) {
      console.error("Failed to save payment data:", error);
    }
  };

  const handleSave = () => {
    if (validateInputs()) {
      if (selectedCard) {
        const updatedMethods = paymentMethods.map((card) =>
          card.id === selectedCard.id
            ? { ...card, ...formData }
            : card
        );
        setPaymentMethods(updatedMethods);
        savePaymentData(updatedMethods, defaultCardId);
      } else {
        const newCard = {
          id: Date.now().toString(),
          ...formData,
        };
        const updatedMethods = [...paymentMethods, newCard];
        setPaymentMethods(updatedMethods);
        savePaymentData(updatedMethods, defaultCardId);
      }
      resetForm();
      setModalVisible(false);
    }
  };

  const resetForm = () => {
    setSelectedCard(null);
    setFormData({ cardNumber: "", expiryDate: "", ccv: "", cardName: "" });
    setErrors({});
  };

  const openEditModal = (card) => {
    setSelectedCard(card);
    setFormData({
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      ccv: card.ccv,
      cardName: card.cardName,
    });
    setModalVisible(true);
  };

  const deleteCard = (id) => {
    const updatedMethods = paymentMethods.filter((card) => card.id !== id);
    setPaymentMethods(updatedMethods);

    // Remove default card if deleted
    if (id === defaultCardId) {
      setDefaultCardId(null);
    }

    savePaymentData(updatedMethods, id === defaultCardId ? null : defaultCardId);
  };

  const deleteCardFromModal = () => {
    if (selectedCard) {
      deleteCard(selectedCard.id);
      setModalVisible(false);
    }
  };

  const validateInputs = () => {
    const errors = {};

    if (!/^\d{16}$/.test(formData.cardNumber)) {
      errors.cardNumber = "Card number must be 16 digits.";
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      errors.expiryDate = "Expiry date must be in MM/YY format.";
    }
    if (!/^\d{3}$/.test(formData.ccv)) {
      errors.ccv = "CCV must be 3 digits.";
    }
    if (formData.cardName.trim() === "") {
      errors.cardName = "Card name is required.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderRightActions = (id) => (
    <TouchableOpacity
      style={styles.deleteSwipe}
      onPress={() => deleteCard(id)}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderPaymentMethod = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <View style={styles.cardContainer}>
        <Ionicons
          name={item.id === defaultCardId ? "star" : "star-outline"}
          size={24}
          color={item.id === defaultCardId ? "#FFD700" : "#ccc"}
          style={styles.starIcon}
        />

        <Text style={styles.cardNumber}>{`**** **** **** ${item.cardNumber.slice(-4)}`}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );

  return (
    <View style={styles.container}>

      <ButtonMain onPress={() => {
          resetForm();
          setModalVisible(true);
        }}>
          Add Payment Method
      </ButtonMain>

      <FlatList
        style={{marginTop: 10,}}
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentMethod}
      />

      {/* Modal for Adding/Editing Payment Methods */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedCard ? "Edit Payment Method" : "Add Payment Method"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Card Number"
              value={formData.cardNumber}
              onChangeText={(text) => setFormData({ ...formData, cardNumber: text })}
              keyboardType="number-pad"
            />
            {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Expiry Date (MM/YY)"
              value={formData.expiryDate}
              onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
              keyboardType="number-pad"
            />
            {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}

            <TextInput
              style={styles.input}
              placeholder="CCV"
              value={formData.ccv}
              onChangeText={(text) => setFormData({ ...formData, ccv: text })}
              keyboardType="number-pad"
            />
            {errors.ccv && <Text style={styles.errorText}>{errors.ccv}</Text>}

            <TextInput
              style={styles.input}
              placeholder="Card Name"
              value={formData.cardName}
              onChangeText={(text) => setFormData({ ...formData, cardName: text })}
            />
            {errors.cardName && <Text style={styles.errorText}>{errors.cardName}</Text>}

            <View style={styles.modalActions}>
              {selectedCard && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={deleteCardFromModal}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <Button title="Cancel" style={styles.deleteButtonText} onPress={() => setModalVisible(false)} />
              <Button title="Save" style={styles.deleteButtonText} onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getDynamicStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.text,
    shadowColor: colors.subtitle,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  starIcon: {
    marginRight: 15,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    color: colors.text,
  },
  editButton: {
    backgroundColor: colors.subtitle,
    padding: 10,
    borderRadius: 5,
  },
  editButtonText: {
    color: colors.background,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  defaultButton: {
    backgroundColor: colors.text,
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  defaultButtonText: {
    color: colors.background,
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteSwipe: {
    
    paddingVertical: 10,
    paddingRight: 10,
    marginLeft: -30,
    marginVertical: 10,
    borderTopEndRadius: 10,
    borderBottomEndRadius: 10,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
    width: 110,
  },
  deleteText: {
    color: colors.text,
    fontWeight: "bold",
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    paddingEnd: 10,
  },
  deleteButton: {
    backgroundColor: colors.subtitle,
    color: colors.background,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: colors.background,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default PaymentMethodsScreen;
