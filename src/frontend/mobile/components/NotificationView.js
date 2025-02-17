import React from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext.js";

const NotificationView = ({ item, expanded, toggleExpand, deleteNotification }) => {
    const { colors } = useTheme();
    const styles = getDynamicStyles(colors);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleExpand(item.id)}
            style={styles.container}
            >

            {/* Header Section */}
            {(item.title || item.subtitle || item.icon) && (
            <View style={styles.header}>
                {item.icon && (
                <Ionicons
                    name={item.icon}
                    size={24}
                    style={styles.titleIcon}
                    />
                )}
                {(item.title || item.subtitle)  && (
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                </View>
                
                )}
            </View>
            )}

            {/* Delete Icon */}
            {<TouchableOpacity style={styles.deleteIcon} onPress={() => deleteNotification(item.id)}>
                <Ionicons name="close" size={20} color="#aaa" />
            </TouchableOpacity>}

            
            {/* Expand/Minimize Icon */}
            {!expanded[item.id] && 
                <View style={styles.smallContainer}>
                    <View style={styles.expandIcon}>
                        <Ionicons
                        name={expanded[item.id] ? "chevron-up-outline" : "chevron-down-outline"}
                        size={20}
                        color="#777"
                        />
                    </View>
                </View>
            }

            {/* Content Section */}
            {expanded[item.id] && <LinearGradient style={styles.content} colors={colors.gradientColors}>
                {/* Expanded Details */}
                {expanded[item.id] && (
                    <Animated.View style={styles.detailsContainer}>
                        <Text style={styles.details}>{item.details}</Text>
                    </Animated.View>
                )}

                {/* Expand/Minimize Icon */}
                {expanded[item.id] && <View style={styles.expandIcon}>
                    <Ionicons
                    name={expanded[item.id] ? "chevron-up-outline" : "chevron-down-outline"}
                    size={20}
                    color="#777"
                    />
                </View>}
            
            </LinearGradient>}
            {/* Delete Icon */}
            {/*<TouchableOpacity style={styles.deleteIcon} onPress={() => deleteNotification(item.id)}>
                <Ionicons name="close" size={20} color="#aaa" />
            </TouchableOpacity>*/}

            {/* Header with Icon and Title */}
            {/*<View style={styles.cardHeader}>
                <Ionicons name={item.icon} size={24} color="#aaa" style={styles.icon} />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            </View>

            <Text style={styles.subtitle}>{item.subtitle}</Text>*/}

            {/* Expanded Details */}
            {/*expanded[item.id] && (
                <Animated.View style={styles.detailsContainer}>
                <Text style={styles.details}>{item.details}</Text>
                </Animated.View>
            )*/}

            {/* Expand/Minimize Icon */}
            {/*<View style={styles.expandIcon}>
                <Ionicons
                name={expanded[item.id] ? "chevron-up-outline" : "chevron-down-outline"}
                size={20}
                color="#777"
                />
            </View>*/}
        </TouchableOpacity>
    );
}

const getDynamicStyles = (colors) =>
    StyleSheet.create({
        container: {
            paddingTop: 8,
            paddingHorizontal: 4,
            backgroundColor: colors.baseContainerHeader,
            borderRadius: 25,
            margin: 8,
            },
        smallContainer: {
            paddingTop: 8,
            paddingHorizontal: 4,
            backgroundColor: colors.baseContainerHeader,
            borderRadius: 25,
            marginRight: 8,
            marginBottom: 8,
            },
        headerContainer: {
            paddingHorizontal: 4,
            margin: 8,
            },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            margin: 8,
            },
        titleIcon: {
            width: 48,
            height: 48,
            marginRight: 8,
            color: colors.text,
            borderColor: colors.text,
            backgroundColor: colors.background,
            borderRadius: 24,
            padding: 12,
            },
        title: {
            fontSize: 19,
            fontWeight: 'bold',
            color: colors.text,
            },
        subtitle: {
            fontSize: 17,
            color: colors.text,
            },
        content: {
            borderRadius: 25,
            padding: 16,
            marginVertical: 8,
            backgroundColor: colors.baseContainerHeader,
            },
        footer: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.baseContainerFooter,
            color: colors.text,
            borderRadius: 25,
            marginTop: 8,
            },
        deleteIcon: {
            width: 36,
            height: 36,
            color: colors.text,
            backgroundColor: colors.background,
            borderRadius: 24,
            padding: 0,
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            top: 15,
            right: 15,
            zIndex: 1,
            },
        expandIcon: {
            alignItems: "flex-end",
            },
        details: {
            fontSize: 16,
            color: colors.text,
            },
  });

export default NotificationView;