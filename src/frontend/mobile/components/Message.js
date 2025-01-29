import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';

const Message = ({chatName, chatCategory, onPress, shortMessage, time}) =>  {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <View style={styles.buttonContent}>
                
                <Image
                    source={{
                    uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
                    }}
                    style={styles.profilePicture}
                />
                
                <View style={styles.container}>
                    <Text style={styles.buttonText}>{chatName} {chatCategory && (
                        <Text style={styles.subtitle}>{chatCategory}</Text>
                    )} </Text>
                    {shortMessage && 
                        <Text style={styles.subtitle} numberOfLines={1}>{shortMessage}</Text>}
                </View>
                
                <Text style={styles.subtitle}>{time}</Text>
            </View>
            
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 14,
        padding: 12,
        marginVertical: 5,
    },
    profilePicture: {
        width: 40,
        height: 40,
        borderRadius: 60,
        backgroundColor: '#ddd',
        margin: 5,
      },
    container: {
        flexDirection: 'column',
        flex: 1,
        paddingLeft: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
        color: '#fff',
        fontSize: 20,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        paddingVertical: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#aaa',
    },
});

export default Message;