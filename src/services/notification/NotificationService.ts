import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigationRef } from '../navigation/NavigationService';
import { PermissionsAndroid, Platform } from 'react-native';


// --------------------
// Create notification channels
// --------------------
export async function createChannels() {
  await notifee.createChannel({
    id: 'new-order',
    name: 'New Orders',
    sound: 'new_order', 
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: 'cancellation',
    name: 'Order Cancellation',
    sound: 'cancellation', 
    importance: AndroidImportance.HIGH,
  });
}

// --------------------
// Request permission & get FCM token
// --------------------
export async function requestPermissionAndToken() {
  try {
    //TODO
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied on Android');
        return null;
      }
    }

    // Request Firebase Cloud Messaging permission (mainly for iOS)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM permission not granted');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error requesting permission or getting token:', error);
    return null;
  }
}
// --------------------
// Display notification
// --------------------
export async function displayNotification(data) {
  const { type, orderId, title, body } = data;
  if (!orderId) return;

  await notifee.displayNotification({
    id: orderId,
    title: title || 'Notification',
    body: body || '',
    android: {
      channelId: type === 'new_order' ? 'new-order' : 'cancellation',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
    data,
  });
}

// --------------------
// Cancel notification by orderId
// --------------------
export async function cancelOrderNotification(orderId) {
  try {
    await notifee.cancelNotification(orderId);
    console.log(`Notification ${orderId} cancelled`);
  } catch (error) {
    console.warn('Error cancelling notification:', error);
  }
}

// --------------------
// Handle notification click
// --------------------
function handleNotificationNavigation(data) {
  if (data?.type === 'new_order' && data?.orderId) {
    navigationRef.current?.navigate('OrderScreen', { orderId: data.orderId });
  }
}

// --------------------
// Foreground notifications
// --------------------
export function registerForegroundNotificationHandler() {
  messaging().onMessage(async remoteMessage => {
    const { type, orderId } = remoteMessage.data;
    if (!type) return;

    if (type === 'delete_notification' && orderId) {
      await cancelOrderNotification(orderId);
    } else {
      await displayNotification(remoteMessage.data);
    }
  });
}

// --------------------
// Background / killed notifications
// --------------------
messaging().setBackgroundMessageHandler(async remoteMessage => {
  const { type, orderId } = remoteMessage.data;
  if (!type) return;

  if (type === 'delete_notification' && orderId) {
    await cancelOrderNotification(orderId);
  } else {
    await displayNotification(remoteMessage.data);
  }

  if(remoteMessage.data.type === 'delete_notification'){
    await notifee.cancelNotification(remoteMessage.data.orderId);
  }
  console.log('Background message handled', remoteMessage);
});

// --------------------
// Notification click handlers
// --------------------
export function registerNotificationClickHandler() {
  // Foreground click
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationNavigation(detail.notification?.data);
    }
  });

  // Background click
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationNavigation(remoteMessage.data);
  });

  // Killed app
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      //handle Killed app notification
      handleNotificationNavigation(remoteMessage.data);
    }
  });
}

// --------------------
// Clear leftover notifications on app launch
// --------------------
export async function clearLeftoverNotifications() {
  await notifee.cancelAllNotifications();
}