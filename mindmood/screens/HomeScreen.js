import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Switch, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const EMOTION_COLORS = {
  'Excelente': '#10B981', 'Feliz': '#6366F1', 'Agradecido': '#FACC15',
  'Sorpresa': '#06B6D4', 'Neutral': '#94A3B8', 'Enojo': '#F97316',
  'Ansiedad': '#8B5CF6', 'Miedo': '#4B5563', 'Triste': '#F87171', 'Crisis': '#EF4444',
};

export default function HomeScreen({ navigation }) {
  const { theme, themeStyles, toggleTheme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [lastMood, setLastMood] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const streakSlide = useRef(new Animated.Value(40)).current;
  const streakFade = useRef(new Animated.Value(0)).current;
  const quoteSlide = useRef(new Animated.Value(40)).current;
  const quoteFade = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([
    { fade: new Animated.Value(0), slide: new Animated.Value(30) },
    { fade: new Animated.Value(0), slide: new Animated.Value(30) },
    { fade: new Animated.Value(0), slide: new Animated.Value(30) },
  ]).current;

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!loading && userData) {
      // Staggered entry animation
      Animated.sequence([
        Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(streakFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(streakSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(quoteFade, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(quoteSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        ...cardAnims.map((anim, i) =>
          Animated.parallel([
            Animated.timing(anim.fade, { toValue: 1, duration: 300, delay: i * 80, useNativeDriver: true }),
            Animated.timing(anim.slide, { toValue: 0, duration: 300, delay: i * 80, useNativeDriver: true }),
          ])
        ),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userData]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserData({
          email: user.email,
          displayName: profile?.display_name || user.email.split('@')[0],
          streak: profile?.streak || 0
        });

        const { data: lastEntry } = await supabase
          .from('entries')
          .select('mood')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastEntry && lastEntry.length > 0) {
          setLastMood(lastEntry[0].mood);
        }
      }
    } catch (error) {
      console.error('Home fetch fail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicQuote = () => {
    switch (lastMood) {
      case 'Excelente': return '¡Qué gran energía llevas! Sigue construyendo memorias geniales hoy. 🌟';
      case 'Feliz': return 'Es un buen día para seguir sonriendo y agradecer. 😊';
      case 'Agradecido': return 'La gratitud es la memoria del corazón. Qué bueno que valoras lo positivo. 🙏';
      case 'Sorpresa': return '¡La vida siempre tiene formas de asombrarnos! Mantén esa curiosidad. 😲';
      case 'Neutral': return 'La calma es el mejor lienzo para empezar a pintar una nueva historia. 🍃';
      case 'Triste': return 'Recuerda que después de la tormenta siempre sale el sol. Un paso a la vez. ❤️';
      case 'Enojo': return 'Respira profundo. Es válido sentir ira, pero no dejes que ella maneje el volante. 🧘‍♂️';
      case 'Ansiedad': return 'Estás a salvo aquí y ahora. Enfócate en tu respiración, todo pasará. 🌊';
      case 'Miedo': return 'El valor no es la ausencia de miedo, sino actuar a pesar de él. Tú puedes. 🛡️';
      case 'Crisis': return 'No tienes que pasar por esto a solas. Hay ayuda disponible para ti justo ahora. 🫂';
      default: return 'Bienvenido a MindMood. Escribe tu primer registro para empezar a medir tu energía.';
    }
  };

  const moodColor = EMOTION_COLORS[lastMood] || themeStyles.accent;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    welcomeContainer: { flex: 1, marginLeft: 15 },
    welcomeText: { fontSize: 14, color: themeStyles.secondaryText, fontWeight: '600' },
    nameText: { fontSize: 26, fontWeight: '900', color: themeStyles.text, letterSpacing: -0.5 },
    profileBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: themeStyles.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    toggleContainer: { flexDirection: 'row', alignItems: 'center' },
    streakCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: moodColor, marginHorizontal: 20, padding: 24, borderRadius: 28, marginBottom: 25, shadowColor: moodColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
    streakInfo: { flexDirection: 'row', alignItems: 'center' },
    streakText: { fontSize: 30, fontWeight: '900', color: '#FFF' },
    streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
    quoteBox: { marginHorizontal: 20, backgroundColor: themeStyles.card, padding: 26, borderRadius: 26, marginBottom: 30, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
    quoteLabel: { fontSize: 11, fontWeight: '900', color: themeStyles.secondaryText, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
    quoteText: { fontSize: 17, color: themeStyles.text, lineHeight: 28, fontWeight: '500', fontStyle: 'italic' },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: themeStyles.text, marginHorizontal: 20, marginBottom: 16, letterSpacing: -0.3 },
    cardsContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, padding: 20, borderRadius: 24, marginBottom: 14, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 4 },
    cardIconContainer: { width: 54, height: 54, borderRadius: 20, backgroundColor: themeStyles.itemBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardIcon: { fontSize: 26 },
    cardTextContent: { flex: 1 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: themeStyles.text, marginBottom: 3 },
    cardDesc: { fontSize: 14, color: themeStyles.secondaryText, fontWeight: '500' }
  });

  if (loading && !userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  const actionCards = [
    { icon: '✍️', title: 'Nueva Memoria', desc: 'Descarga tu mente ahora', screen: 'NewEntry', trailing: <Ionicons name="add-circle" size={32} color={themeStyles.accent} /> },
    { icon: '📖', title: 'Mi Bóveda', desc: 'Explora tus reflexiones', screen: 'History', trailing: <Ionicons name="chevron-forward" size={24} color={themeStyles.secondaryText} /> },
    { icon: '📈', title: 'Mis Métricas', desc: 'Análisis de tu energía vital', screen: 'Stats', trailing: <Ionicons name="chevron-forward" size={24} color={themeStyles.secondaryText} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.toggleContainer}>
            <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={20} color={themeStyles.secondaryText} style={{ marginRight: 8 }} />
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: "#CBD5E1", true: "#818CF8" }}
              thumbColor={theme === 'dark' ? "#6366F1" : "#F4F3F4"}
            />
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.nameText} numberOfLines={1}>{userData?.displayName}</Text>
          </View>

          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={22} color={themeStyles.text} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ opacity: streakFade, transform: [{ translateY: streakSlide }] }}>
          <View style={styles.streakCard}>
            <View style={styles.streakInfo}>
              <Ionicons name="flame" size={34} color="#FFF" />
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.streakText}>{userData?.streak} días</Text>
                <Text style={styles.streakLabel}>Racha actual</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: quoteFade, transform: [{ translateY: quoteSlide }] }}>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteLabel}>Tu luz hoy</Text>
            <Text style={styles.quoteText}>&quot;{getDynamicQuote()}&quot;</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.cardsContainer}>
          {actionCards.map((card, i) => (
            <Animated.View key={i} style={{ opacity: cardAnims[i].fade, transform: [{ translateY: cardAnims[i].slide }] }}>
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(card.screen)}>
                <View style={styles.cardIconContainer}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc}>{card.desc}</Text>
                </View>
                {card.trailing}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
