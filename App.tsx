/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import {
  createChannels,
  requestPermissionAndToken,
  registerForegroundNotificationHandler,
  registerNotificationClickHandler,
  areNotificationsEnabled,
} from './src/services/notification/NotificationService';
import { navigationRef } from './src/services/navigation/NavigationService';

type RootStackParamList = {
  Home: undefined;
  OrderScreen: { orderId: string };
};

const Stack = createStackNavigator<RootStackParamList>();
//TODO fix eslint and ts bugs

function HomeScreen() {
  return <Text>Welcome Home</Text>;
}


type OrderScreenProps = StackScreenProps<RootStackParamList, 'OrderScreen'>;

function OrderScreen({ route }: OrderScreenProps) {
  return <Text>Order ID: {route.params.orderId}</Text>;
}

function App() {
  //const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const initNotifications = async () => {
      const permissionGranted = await requestPermissionAndToken();

      if (!permissionGranted) {
        return;
      }


      const enabled = await areNotificationsEnabled();

      if (permissionGranted && enabled) {
        await createChannels();
        await registerForegroundNotificationHandler();
        await registerNotificationClickHandler();
      }
    };

    initNotifications();
  }, []);


  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="OrderScreen" component={OrderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}
 */
/* const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); */

export default App;
