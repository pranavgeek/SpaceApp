import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

const CampaignListComponent = ({
  campaigns,
  onAccept,
  onDecline,
  onViewDetails,
  onComplete,
  isLoading,
  emptyText,
  listType, // "pending", "active", or "closed"
}) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getDynamicStyles(colors, isDarkMode);

  // Determine what actions to show based on list type
  const showActions = (item) => {
    switch (listType) {
      case "pending":
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => onAccept(item.requestId)}
            >
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => onDecline(item.requestId)}
            >
              <Text style={styles.buttonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        );
      case "active":
        return (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.detailsButton]}
              onPress={() => onViewDetails(item.requestId)}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.completeButton]}
              onPress={() => onComplete(item.requestId)}
            >
              <Text style={styles.buttonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        );
      case "closed":
        return (
          <TouchableOpacity
            style={[styles.button, styles.detailsButton, styles.fullWidthButton]}
            onPress={() => onViewDetails(item.requestId)}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.campaignItem}>
      <View style={styles.campaignHeader}>
        <View style={styles.campaignHeaderLeft}>
          <Image
            source={{
              uri: item.productImage
                ? item.productImage
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    item.productName
                  )}&background=random&color=fff&size=128`,
            }}
            style={styles.productImage}
          />
          <View style={styles.campaignInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName}
            </Text>
            <Text style={styles.campaignPartner} numberOfLines={1}>
              {listType === "pending" || listType === "closed"
                ? `By ${item.sellerName}`
                : `With ${item.influencerName}`}
            </Text>
          </View>
        </View>
        <View style={styles.campaignHeaderRight}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                item.status === "Pending"
                  ? styles.pendingStatus
                  : item.status === "Accepted"
                  ? styles.activeStatus
                  : item.status === "Completed"
                  ? styles.completedStatus
                  : styles.declinedStatus,
              ]}
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <Text style={styles.commissionText}>
            {item.commission}% Commission
          </Text>
        </View>
      </View>

      <Text style={styles.campaignDescription} numberOfLines={2}>
        {item.campaignDetails || "No additional details provided"}
      </Text>

      <View style={styles.campaignMeta}>
        <Text style={styles.campaignMetaText}>
          <Ionicons name="calendar-outline" size={14} color={colors.subtitle} />{" "}
          {item.campaignDuration} Days
        </Text>
        <Text style={styles.campaignMetaText}>
          <Ionicons name="time-outline" size={14} color={colors.subtitle} />{" "}
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>

      {showActions(item)}
    </View>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/6134/6134065.png" }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>{emptyText}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={campaigns}
      keyExtractor={(item) => item.requestId.toString()}
      renderItem={renderItem}
      ListEmptyComponent={EmptyComponent}
      contentContainerStyle={
        campaigns.length === 0 ? styles.emptyList : styles.listContainer
      }
    />
  );
};

const getDynamicStyles = (colors, isDarkMode) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.subtitle,
  },
  listContainer: {
    padding: 16,
  },
  campaignItem: {
    backgroundColor: isDarkMode ? colors.card : "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  campaignHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
  },
  campaignHeaderRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  campaignPartner: {
    fontSize: 14,
    color: colors.subtitle,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  pendingStatus: {
    backgroundColor: "#FFC107", // Amber
  },
  activeStatus: {
    backgroundColor: "#4CAF50", // Green
  },
  completedStatus: {
    backgroundColor: "#2196F3", // Blue
  },
  declinedStatus: {
    backgroundColor: "#F44336", // Red
  },
  statusText: {
    fontSize: 12,
    color: colors.subtitle,
  },
  commissionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  campaignDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  campaignMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  campaignMetaText: {
    fontSize: 12,
    color: colors.subtitle,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthButton: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: "#4CAF50", // Green
  },
  declineButton: {
    backgroundColor: "#F44336", // Red
  },
  detailsButton: {
    backgroundColor: colors.primary,
  },
  completeButton: {
    backgroundColor: "#2196F3", // Blue
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
  },
  emptyImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    color: colors.subtitle,
    textAlign: "center",
    lineHeight: 24,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CampaignListComponent;