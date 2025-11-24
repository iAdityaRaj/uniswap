import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ✅ Configure notification handler for Android & iOS
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static expoPushTokens = new Map();
  static notificationListeners = [];

  // ✅ Initialize notification system
  static async initialize() {
    console.log('🔔 Initializing notification system...');
    
    try {
      // Create notification channel for Android
      if (Platform.OS === 'android') {
        await this.createNotificationChannel();
      }

      // Request permissions
      const token = await this.registerForPushNotifications();
      
      // Setup notification listeners
      this.setupNotificationListeners();
      
      console.log('✅ Notification system initialized');
      return token;
    } catch (error) {
      console.log('❌ Error initializing notification system:', error);
      return null;
    }
  }

  // ✅ Create Android notification channel
  static async createNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
      console.log('✅ Android notification channel created');
    }
  }

  // ✅ Register for push notifications
  static async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('📱 Must use physical device for Push Notifications');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permission not granted for notifications');
        return null;
      }

      // Get push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.manifest?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;

      console.log('🔔 Push Token Received:', token);
      
      // Store token
      this.expoPushTokens.set('currentUser', token);
      
      return token;
    } catch (error) {
      console.log('❌ Error getting push token:', error);
      return null;
    }
  }

  // ✅ Setup notification listeners
  static setupNotificationListeners(navigation) {
    // Remove existing listeners
    this.notificationListeners.forEach(listener => {
      Notifications.removeNotificationSubscription(listener);
    });
    this.notificationListeners = [];

    // Listener for when notification is received in foreground
    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received (foreground):', notification.request.content.title);
    });

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Notification tapped:', data);

      // Navigate to appropriate screen based on notification data
      if (navigation && data.screen) {
        navigation.navigate(data.screen, data);
      }
    });

    this.notificationListeners.push(receivedListener, responseListener);
  }

  // ✅ Cleanup listeners
  static cleanup() {
    this.notificationListeners.forEach(listener => {
      Notifications.removeNotificationSubscription(listener);
    });
    this.notificationListeners = [];
    console.log('🧹 Notification listeners cleaned up');
  }

  // ✅ Schedule immediate local notification
  static async scheduleNotification(title, body, data = {}) {
    try {
      console.log('🔔 Scheduling notification:', title);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            ...data, 
            local: true, 
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
          },
          sound: true,
          priority: 'high',
          // Android specific
          android: {
            channelId: 'default',
            priority: 'high',
            vibrationPattern: [0, 250, 250, 250],
            sticky: false,
          },
          // iOS specific
          ios: {
            sound: true,
            badge: 1,
          },
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Notification scheduled successfully. ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling notification:', error);
      return null;
    }
  }

  // ✅ Schedule delayed notification
  static async scheduleDelayedNotification(title, body, delaySeconds = 5, data = {}) {
    try {
      console.log(`⏰ Scheduling delayed notification for ${delaySeconds} seconds:`, title);
      
      const trigger = new Date(Date.now() + delaySeconds * 1000);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            ...data, 
            delayed: true, 
            scheduledTime: trigger.getTime(),
            id: Math.random().toString(36).substr(2, 9)
          },
          sound: true,
          priority: 'high',
        },
        trigger,
      });

      console.log(`✅ Delayed notification scheduled successfully. ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling delayed notification:', error);
      return null;
    }
  }

  // ✅ Schedule daily reminder
  static async scheduleDailyReminder(hour, minute, title, body, data = {}) {
    try {
      const trigger = {
        hour,
        minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, type: 'daily_reminder' },
          sound: true,
        },
        trigger,
      });

      console.log(`✅ Daily reminder scheduled for ${hour}:${minute}. ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling daily reminder:', error);
      return null;
    }
  }

  // ✅ Cancel specific notification
  static async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('❌ Notification cancelled:', notificationId);
      return true;
    } catch (error) {
      console.log('❌ Error cancelling notification:', error);
      return false;
    }
  }

  // ✅ Cancel all scheduled notifications
  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All scheduled notifications cancelled');
      return true;
    } catch (error) {
      console.log('❌ Error cancelling all notifications:', error);
      return false;
    }
  }

  // ✅ Get all scheduled notifications
  static async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 ${notifications.length} scheduled notifications`);
      return notifications;
    } catch (error) {
      console.log('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  // ✅ Send push notification (requires backend in production)
  static async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: { ...data, push: true },
        priority: 'high',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'ok') {
        console.log('✅ Push notification sent successfully');
        return true;
      } else {
        console.log('❌ Push notification failed:', result);
        // Fallback to local notification
        await this.scheduleNotification(title, body, data);
        return false;
      }
    } catch (error) {
      console.log('❌ Error sending push notification:', error);
      // Fallback to local notification
      await this.scheduleNotification(title, body, data);
      return false;
    }
  }

  // ✅ Test all notification types
  static async testAllNotifications() {
    console.log('🧪 STARTING COMPREHENSIVE NOTIFICATION TEST...');
    
    try {
      // Initialize if not done
      await this.initialize();

      // Test 1: Immediate notification
      console.log('📱 Test 1: Sending immediate notification...');
      const immediateId = await this.scheduleNotification(
        '🔔 IMMEDIATE TEST',
        'This should appear RIGHT NOW at the TOP of your screen! Swipe down to see notification panel.',
        { testType: 'immediate', step: 1, screen: 'Home' }
      );

      // Test 2: Delayed notification (3 seconds)
      console.log('⏰ Test 2: Scheduling 3-second delayed notification...');
      const delayedId = await this.scheduleDelayedNotification(
        '⏰ DELAYED TEST',
        'This was scheduled 3 seconds ago! Check your notification panel.',
        3,
        { testType: 'delayed', step: 2, screen: 'Chats' }
      );

      // Test 3: Another immediate with different priority
      console.log('📱 Test 3: Sending high-priority notification...');
      await this.scheduleNotification(
        '🎉 NOTIFICATIONS WORKING!',
        'All notification tests completed successfully! 🚀',
        { testType: 'success', step: 3, screen: 'Profile' }
      );

      console.log('✅ ALL NOTIFICATION TESTS COMPLETED SUCCESSFULLY');
      return {
        success: true,
        immediateId,
        delayedId,
        message: 'Check your phone for 3 notifications!'
      };
    } catch (error) {
      console.log('❌ Notification tests failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ✅ SIMPLE TEST: Basic notification test
  static async simpleTest() {
    console.log('🔔 Running simple notification test...');
    return await this.scheduleNotification(
      '🧪 Simple Test',
      'If you see this, notifications are working! 🎉',
      { testType: 'simple', screen: 'Home' }
    );
  }

  // ==================== SMART NOTIFICATION FEATURES ====================

  // ✅ Welcome notification
  static async sendWelcomeNotification(userName) {
    return await this.scheduleNotification(
      '👋 Welcome to UniSwap!',
      `Hi ${userName}! Your campus sharing journey begins now. 🎓`,
      { type: 'welcome', screen: 'Home', userId: 'current' }
    );
  }

  // ✅ New message notification
  static async sendNewMessageNotification(senderName, messagePreview, chatId) {
    return await this.scheduleNotification(
      `💬 New message from ${senderName}`,
      messagePreview.length > 40 ? messagePreview.substring(0, 40) + '...' : messagePreview,
      { 
        type: 'new_message', 
        screen: 'ChatScreen', 
        chatId,
        senderName 
      }
    );
  }

  // ✅ Item interest notification
  static async sendItemInterestNotification(itemTitle, userName, itemId) {
    return await this.scheduleNotification(
      '❤️ New Interest in Your Item',
      `${userName} is interested in your "${itemTitle}"`,
      { 
        type: 'item_interest', 
        screen: 'MyAds', 
        itemId,
        userName 
      }
    );
  }

  // ✅ Return reminder
  static async sendReturnReminder(itemTitle, rentalId, hoursRemaining = 24) {
    return await this.scheduleDelayedNotification(
      '📅 Return Reminder',
      `"${itemTitle}" is due in ${hoursRemaining} hours! Please arrange return.`,
      2, // 2 seconds for demo, use hoursRemaining * 3600 in production
      { 
        type: 'return_reminder', 
        screen: 'MyRentals', 
        rentalId,
        itemTitle 
      }
    );
  }

  // ✅ Price drop alert
  static async sendPriceDropAlert(itemTitle, oldPrice, newPrice, itemId) {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    return await this.scheduleNotification(
      '💰 Price Drop Alert!',
      `"${itemTitle}" is now ₹${newPrice} (${discount}% off!)`,
      { 
        type: 'price_drop', 
        screen: 'ItemDetails', 
        itemId,
        newPrice 
      }
    );
  }

  // ✅ Item suggestion
  static async sendItemSuggestion(category = null) {
    const categories = ['Books', 'Electronics', 'Sports', 'Furniture', 'Study Materials'];
    const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
    
    return await this.scheduleNotification(
      '🎯 Items You Might Like',
      `Check out new ${selectedCategory} items available for rent nearby!`,
      { 
        type: 'suggestion', 
        screen: 'Home', 
        category: selectedCategory 
      }
    );
  }

  // ✅ Rental confirmed
  static async sendRentalConfirmed(itemTitle, renterName, startDate, endDate) {
    return await this.scheduleNotification(
      '✅ Rental Confirmed!',
      `You rented "${itemTitle}" to ${renterName} from ${startDate} to ${endDate}`,
      { 
        type: 'rental_confirmed', 
        screen: 'MyRentals', 
        itemTitle,
        renterName 
      }
    );
  }

  // ✅ Review reminder
  static async sendReviewReminder(itemTitle, transactionId) {
    return await this.scheduleDelayedNotification(
      '⭐ Please Leave a Review',
      `How was your experience with "${itemTitle}"? Help others by leaving a review.`,
      5, // 5 seconds for demo
      { 
        type: 'review_reminder', 
        screen: 'MyRentals', 
        transactionId,
        itemTitle 
      }
    );
  }

  // ✅ Campus event notification
  static async sendCampusEvent(eventName, location, time) {
    return await this.scheduleNotification(
      '🎊 Campus Event',
      `${eventName} at ${location} - ${time}. Meet other UniSwap users!`,
      { 
        type: 'campus_event', 
        screen: 'Home',
        eventName 
      }
    );
  }

  // ✅ Emergency/Important notification
  static async sendImportantNotification(title, message, isUrgent = false) {
    return await this.scheduleNotification(
      isUrgent ? `🚨 ${title}` : `📢 ${title}`,
      message,
      { 
        type: 'important', 
        screen: 'Home',
        urgent: isUrgent 
      }
    );
  }

  // ==================== NOTIFICATION MANAGEMENT ====================

  // ✅ Get notification permissions status
  static async getPermissionStatus() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return {
        granted: settings.granted,
        status: settings.status,
        canAskAgain: settings.canAskAgain,
        android: settings.android,
        ios: settings.ios,
      };
    } catch (error) {
      console.log('❌ Error getting permission status:', error);
      return null;
    }
  }

  // ✅ Request notification permissions
  static async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('🔔 Permission request result:', status);
      return status;
    } catch (error) {
      console.log('❌ Error requesting permissions:', error);
      return 'undetermined';
    }
  }

  // ✅ Get badge count (iOS)
  static async getBadgeCount() {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  }

  // ✅ Set badge count (iOS)
  static async setBadgeCount(count) {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  }

  // ✅ Get push token
  static getPushToken() {
    return this.expoPushTokens.get('currentUser');
  }

  // ✅ Check if notifications are supported
  static isSupported() {
    return Device.isDevice;
  }

  // ✅ Get platform info
  static getPlatformInfo() {
    return {
      platform: Platform.OS,
      isDevice: Device.isDevice,
      deviceName: Device.deviceName,
      brand: Device.brand,
      model: Device.model,
    };
  }
}

// ✅ Auto-initialize when imported
NotificationService.initialize().then(token => {
  if (token) {
    console.log('🚀 NotificationService auto-initialized successfully');
  } else {
    console.log('⚠️ NotificationService initialized without push token');
  }
});

export default NotificationService;