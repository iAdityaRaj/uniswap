import { useEffect } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // ALWAYS go to Welcome screen first, no auth check
    const timer = setTimeout(() => {
      console.log("🟡 Always navigating to Welcome screen first");
      navigation.replace('Welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.colorStrip1} />
        <View style={styles.colorStrip2} />
        <View style={styles.colorStrip3} />
        
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🔄</Text>
          </View>
          <Text style={styles.title}>UniSwap</Text>
          <Text style={styles.subtitle}>Campus Marketplace</Text>
        </Animated.View>

        <Text style={styles.footer}>IIT Ropar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  colorStrip1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#0A66C2',
  },
  colorStrip2: {
    position: 'absolute',
    top: height * 0.2,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#10B981',
    opacity: 0.8,
  },
  colorStrip3: {
    position: 'absolute',
    top: height * 0.4,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#F59E0B',
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});