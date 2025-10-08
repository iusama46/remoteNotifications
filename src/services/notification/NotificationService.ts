import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { navigate } from '../navigation/NavigationService';
import { NotificationData, NotificationType } from './types';

// --------------------
// Create notification channels
// --------------------
export async function createChannels(): Promise<void> {
  await notifee.createChannel({
    id: NotificationType.NewOrder,
    name: 'New Orders',
    sound: 'new_order',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: NotificationType.Cancellation,
    name: 'Cancellations',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: NotificationType.Pending,
    name: 'Pending',
    importance: AndroidImportance.HIGH,
  });

  await notifee.createChannel({
    id: NotificationType.OutDelivery,
    name: 'Out Delivery',
    importance: AndroidImportance.HIGH,
  });
}

// --------------------
// Request permission & get FCM token
// --------------------
export async function requestPermissionAndToken(): Promise<string | null> {
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

export const areNotificationsEnabled = async (): Promise<boolean> => {
  //
  if (Platform.OS === 'ios') {
    const settings = await messaging().hasPermission();
    return settings === messaging.AuthorizationStatus.AUTHORIZED || settings === messaging.AuthorizationStatus.PROVISIONAL;
  } else if (Platform.OS === 'android') {
    // On Android, notifications are generally enabled by default unless the user disables them manually
    const enabled = await messaging().hasPermission();
    console.log('enabled', enabled);
    return enabled === messaging.AuthorizationStatus.AUTHORIZED;
  }
  return false;
};

// --------------------
// Display notification
// --------------------
export async function displayNotification(data: NotificationData): Promise<void> {
  const { type, orderId, title, body } = data;
  if (!orderId) return;

  await notifee.displayNotification({
    id: orderId,
    title: title || 'Notification',
    body: body || '',
    android: {
      channelId: type === NotificationType.NewOrder ? NotificationType.NewOrder : NotificationType.Cancellation,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
    },
    data,
  });
}

// --------------------
// Cancel notification by orderId
// --------------------
export async function cancelOrderNotification(orderId: string): Promise<void> {
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
export function handleNotificationNavigation(data?: NotificationData) {
  if (data?.type === NotificationType.NewOrder && data?.orderId) {
    navigate('OrderScreen', { orderId: data.orderId }); // ✅ Fully typed
  }
}

// --------------------
// Foreground notifications
// --------------------
export function registerForegroundNotificationHandler(): void {
  messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    const data = remoteMessage?.data as NotificationData;
    const { type, orderId } = data;
    if (!type) return;


    if (type === NotificationType.DeleteNotification && orderId) {
      await cancelOrderNotification(orderId);
    } else {
      await displayNotification(data);
    }
  });
}

// --------------------
// Notification click handlers
// --------------------
export function registerNotificationClickHandler(): void {
  // Foreground click
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationNavigation(detail.notification?.data as NotificationData);
    }
  });
}

// --------------------
// Clear leftover notifications on app launch
// --------------------
export async function clearLeftoverNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}
