export enum NotificationType {
    NewOrder = 'new_order',
    Cancellation = 'cancellation',
    DeleteNotification = 'delete_notification',
    Pending = 'pending',
    OutDelivery = 'out_delivery'
}

export type NotificationData = {
    type: NotificationType;
    orderId: string;
    title?: string;
    body?: string;
    [key: string]: any; 
};