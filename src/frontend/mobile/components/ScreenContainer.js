import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const ScreenContainer = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.screenContainer,
        { paddingBottom: 10 }, // tab bar height (60) + spacing (30)
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
