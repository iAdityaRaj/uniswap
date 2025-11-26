import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {

  const markAsSeen = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
    } catch (error) {
      console.log('Error saving welcome status:', error);
    }
  };

  const handleGetStarted = () => {
    markAsSeen();
    navigation.navigate('Login');
  };

  const handleSkip = () => {
    markAsSeen();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skipButton}
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>UniSwap</Text>
        <Text style={styles.tagline}>Swap & Share</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>🔄</Text>
        </View>
        <Text style={styles.heroTitle}>
          Borrow, Swap & Connect
        </Text>
        <Text style={styles.heroSubtitle}>
          Join the IIT Ropar community to rent items, share resources, and connect with fellow students.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>💰</Text>
          <Text style={styles.featureText}>Save Money</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🌱</Text>
          <Text style={styles.featureText}>Eco-Friendly</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>👥</Text>
          <Text style={styles.featureText}>Campus Network</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  redirectMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redirectText: {
    fontSize: 18,
    color: '#0A66C2',
    fontWeight: 'bold',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0A66C2',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 50,
  },
  illustration: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  illustrationEmoji: {
    fontSize: 50,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  buttons: {
    marginTop: 'auto',
  },
  primaryButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0A66C2',
  },
  secondaryButtonText: {
    color: '#0A66C2',
    fontSize: 16,
    fontWeight: '500',
  },
});