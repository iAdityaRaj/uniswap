import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { NotificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [smartNotificationsEnabled, setSmartNotificationsEnabled] = useState(true);
  const [isExpoGo, setIsExpoGo] = useState(true); // Assume Expo Go by default

  useEffect(() => {
    // Check if we're in Expo Go
    checkEnvironment();
    registerForPushNotifications();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && smartNotificationsEnabled) {
        // Send welcome notification to new users
        NotificationService.sendWelcomeNotification(user.displayName || 'there');
      }
    });

    return unsubscribeAuth;
  }, [smartNotificationsEnabled]);

  const checkEnvironment = () => {
    // In Expo Go, push notifications won't work
    console.log('🔔 Running in Expo Go - Push notifications disabled');
    setIsExpoGo(true);
  };

  const registerForPushNotifications = async () => {
    try {
      const token = await NotificationService.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
      }
    } catch (error) {
      console.log('Error registering for push notifications:', error);
    }
  };

  const toggleSmartNotifications = () => {
    setSmartNotificationsEnabled(!smartNotificationsEnabled);
  };

  const sendTestNotification = async () => {
    if (isExpoGo) {
      // Use local notification in Expo Go
      await NotificationService.sendLocalNotification(
        '🔔 Test Notification',
        'Local notifications are working! Push notifications require development build.'
      );
    } else {
      await NotificationService.scheduleNotification(
        '🔔 Test Notification',
        'Smart notifications are working perfectly! 🎉'
      );
    }
  };

  const sendItemSuggestion = async () => {
    await NotificationService.suggestItemsBasedOnInterests();
  };

  const value = {
    expoPushToken,
    smartNotificationsEnabled,
    toggleSmartNotifications,
    sendTestNotification,
    sendItemSuggestion,
    isExpoGo, // Export this to show warnings in UI
    setupReturnReminder: NotificationService.setupReturnReminder,
    sendMessageNotification: NotificationService.sendMessageNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};