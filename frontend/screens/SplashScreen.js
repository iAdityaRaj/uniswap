import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Use useRef to ensure animations persist correctly
  const scaleAnim = useRef(new Animated.Value(0)).current; // For Logo Pop
  const fadeAnim = useRef(new Animated.Value(0)).current;  // For Text Fade
  const slideAnim = useRef(new Animated.Value(30)).current; // For Text Slide

  useEffect(() => {
    // Animation Sequence: Logo Pops -> Then Text Fades In
    Animated.sequence([
      // 1. Logo "Spring" (Pop) Animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,   // Controls "bounciness"
        tension: 40,
        useNativeDriver: true,
      }),
      // 2. Text Fade & Slide Animation (Parallel)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigation Timer
    const timer = setTimeout(() => {
      console.log("🟡 Always navigating to Welcome screen first");
      navigation.replace('Welcome');
    }, 2500); // Slightly reduced time since animation is snappier

    return () => clearTimeout(timer);
  }, [navigation, scaleAnim, fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        
        {/* Content Container */}
        <View style={styles.content}>
          
          {/* Animated Logo Circle */}
          <Animated.View 
            style={[
              styles.logoCircle, 
              { transform: [{ scale: scaleAnim }] } // Apply Scale Animation
            ]}
          >
            <Text style={styles.logoText}>🔄</Text>
          </Animated.View>

          {/* Animated Text Block */}
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: fadeAnim,              // Apply Fade
              transform: [{ translateY: slideAnim }], // Apply Slide
            }}
          >
            <Text style={styles.title}>UniSwap</Text>
            <Text style={styles.subtitle}>Swap & Share</Text>
          </Animated.View>

        </View>

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
    backgroundColor: '#0A66C2', // ✅ Single Brand Color (Blue)
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoCircle: {
    width: 120, // Slightly larger
    height: 120,
    backgroundColor: 'white',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  logoText: {
    fontSize: 50,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF', // ✅ White Text
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF', // ✅ Off-white/Light Blue for subtitle
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    fontSize: 16,
    color: '#A5F3FC', // ✅ Light Cyan for footer
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});