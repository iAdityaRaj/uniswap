import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NotificationService } from '../services/notificationService';

export default function NotificationSettingsScreen({ navigation }) {
  const [smartNotificationsEnabled, setSmartNotificationsEnabled] = useState(true);

  const toggleSmartNotifications = () => {
    setSmartNotificationsEnabled(!smartNotificationsEnabled);
  };

  const handleTestNotification = async () => {
    const success = await NotificationService.testNotificationTypes();
    if (success) {
      Alert.alert(
        '✅ Test Started',
        'Instant notification sent! Delayed notification will appear in 3 seconds.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleItemSuggestion = async () => {
    const success = await NotificationService.sendItemSuggestion();
    if (success) {
      Alert.alert('✅ Smart Suggestion', 'Item suggestion notification sent!');
    }
  };

  const handleMessageTest = async () => {
    const success = await NotificationService.sendNewMessageNotification(
      'John Doe',
      'Hi, I am interested in your calculator!'
    );
    if (success) {
      Alert.alert('✅ Message Test', 'New message notification sent!');
    }
  };

  const handleReturnReminder = async () => {
    const success = await NotificationService.sendReturnReminder('Scientific Calculator');
    if (success) {
      Alert.alert('✅ Reminder Set', 'Return reminder will appear in 2 seconds!');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Notification Settings</Text>
      
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="notifications" size={20} color="#fff" />
        <Text style={styles.infoText}>
          Local notifications are fully functional! Test all features below.
        </Text>
      </View>

      {/* Quick Test Buttons */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTestNotification}
          >
            <Ionicons name="flash" size={22} color="#0A66C2" />
            <Text style={styles.actionButtonText}>Test All</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.successButton]}
            onPress={handleItemSuggestion}
          >
            <Ionicons name="bulb" size={22} color="#10B981" />
            <Text style={[styles.actionButtonText, styles.successText]}>Suggest Items</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.warningButton]}
            onPress={handleMessageTest}
          >
            <Ionicons name="chatbubble" size={22} color="#F59E0B" />
            <Text style={[styles.actionButtonText, styles.warningText]}>Test Message</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.infoButton]}
            onPress={handleReturnReminder}
          >
            <Ionicons name="calendar" size={22} color="#8B5CF6" />
            <Text style={[styles.actionButtonText, styles.infoText]}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Master Toggle */}
      <View style={styles.masterSwitch}>
        <View style={styles.switchHeader}>
          <Ionicons name="settings" size={24} color="#0A66C2" />
          <View>
            <Text style={styles.masterTitle}>Enable Smart Notifications</Text>
            <Text style={styles.masterSubtitle}>Personalized alerts and reminders</Text>
          </View>
        </View>
        <Switch
          value={smartNotificationsEnabled}
          onValueChange={toggleSmartNotifications}
          trackColor={{ false: '#767577', true: '#0A66C2' }}
          thumbColor={smartNotificationsEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>

      {/* Feature List */}
      <View style={styles.featuresList}>
        <Text style={styles.sectionTitle}>Available Features</Text>
        
        {[
          { icon: 'chatbubble-ellipses', title: 'Instant Messages', color: '#0A66C2' },
          { icon: 'calendar', title: 'Return Reminders', color: '#10B981' },
          { icon: 'trending-down', title: 'Price Drop Alerts', color: '#F59E0B' },
          { icon: 'cube', title: 'Smart Suggestions', color: '#8B5CF6' },
          { icon: 'heart', title: 'Interest Notifications', color: '#EC4899' },
          { icon: 'rocket', title: 'Welcome Messages', color: '#06B6D4' },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
              <Ionicons name={feature.icon} size={20} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        ))}
      </View>

      {/* Status */}
      <View style={styles.statusCard}>
        <Ionicons name="checkmark-done-circle" size={40} color="#10B981" />
        <Text style={styles.statusTitle}>Notifications Active</Text>
        <Text style={styles.statusText}>
          All local notification features are working perfectly in Expo Go!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#0A66C2',
    borderStyle: 'solid',
  },
  successButton: { borderColor: '#10B981' },
  warningButton: { borderColor: '#F59E0B' },
  infoButton: { borderColor: '#8B5CF6' },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A66C2',
    marginLeft: 8,
  },
  successText: { color: '#10B981' },
  warningText: { color: '#F59E0B' },
  infoText: { color: '#8B5CF6' },
  masterSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  switchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  masterSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    marginTop: 2,
  },
  featuresList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});