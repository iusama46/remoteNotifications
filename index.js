/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';
import { cancelOrderNotification, displayNotification, handleNotificationNavigation } from './src/services/notification/NotificationService';
import { getMessaging } from '@react-native-firebase/messaging';
import { NotificationType } from './src/services/notification/types';

//Background / killed notifications
getMessaging().setBackgroundMessageHandler(async remoteMessage => {
    const { type, orderId } = remoteMessage.data;
    if (!type) return;

    if (type === NotificationType.DeleteNotification && orderId) {
        await cancelOrderNotification(orderId);
    } else {
        await displayNotification(remoteMessage.data);
    }

    if (remoteMessage.data.type === NotificationType.DeleteNotification) {
        await notifee.cancelNotification(remoteMessage.data.orderId);
    }
    console.log('Background message handled', remoteMessage);
});


notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    //const { type: orderType, orderId } = notification?.data;
    if (type === EventType.PRESS) {
        handleNotificationNavigation(notification?.data);
        return;
    }
});

AppRegistry.registerComponent(appName, () => App);
