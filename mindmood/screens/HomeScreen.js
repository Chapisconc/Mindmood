import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { themeStyles } = useTheme();
  const [userData, setUserData] = useState(null);
  const [lastMood, setLastMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData(); 
    });
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Profile data (streak, name)
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

        // Fetch Last Mood
        const { data: lastEntry } = await supabase
          .from('entries')
          .select('mood')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (lastEntry) {
          setLastMood(lastEntry.mood);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicQuote = () => {
    switch (lastMood) {
      case 'Excelente': return '¡Qué gran energía llevas! Sigue construyendo memorias geniales hoy. 🌟';
      case 'Feliz': return 'Es un buen día para seguir sonriendo y agradecer. 😊';
      case 'Neutral': return 'La calma es el mejor lienzo para empezar a pintar una nueva historia. 🍃';
      case 'Triste': return 'Recuerda que después de la tormenta siempre sale el sol. Un paso a la vez. ❤️';
      case 'Crisis': return 'No tienes que pasar por esto a solas. Hay ayuda disponible para ti justo ahora. 🫂';
      default: return 'Bienvenido a MindMood. Escribe tu primer registro para empezar a medir tu energía.';
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, marginBottom: 20 },
    welcomeText: { fontSize: 16, color: themeStyles.secondaryText, fontWeight: '600' },
    nameText: { fontSize: 28, fontWeight: '900', color: themeStyles.text },
    profileBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: themeStyles.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: themeStyles.border },
    
    streakCard: { backgroundColor: themeStyles.accent, marginHorizontal: 20, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, shadowColor: themeStyles.accent, shadowOffset: {height: 5, width: 0}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    streakInfo: { flexDirection: 'row', alignItems: 'center' },
    streakText: { color: '#FFF', fontSize: 18, fontWeight: '800', marginLeft: 10 },
    streakLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

    quoteBox: { backgroundColor: themeStyles.card, marginHorizontal: 20, padding: 20, borderRadius: 24, marginBottom: 30, borderLeftWidth: 5, borderColor: themeStyles.accent, shadowColor: '#000', shadowOffset: {height:5, width:0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    quoteLabel: { fontSize: 11, fontWeight: '900', color: themeStyles.accent, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
    quoteText: { fontSize: 16, color: themeStyles.text, fontStyle: 'italic', lineHeight: 24, fontWeight: '500' },
    
    sectionTitle: { fontSize: 20, fontWeight: '800', color: themeStyles.text, marginLeft: 20, marginBottom: 15 },
    cardsContainer: { paddingHorizontal: 20, gap: 16, marginBottom: 30 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 2, width: 0}, shadowOpacity: 0.02, shadowRadius: 5 },
    cardIconContainer: { width: 56, height: 56, borderRadius: 18, backgroundColor: themeStyles.itemBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardIcon: { fontSize: 26 },
    cardTextContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: themeStyles.text, marginBottom: 2 },
    cardDesc: { fontSize: 13, color: themeStyles.secondaryText, fontWeight: '500' }
  });

  if (loading && !userData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>¡Hola de nuevo!</Text>
            <Text style={styles.nameText}>{userData?.displayName}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="settings-outline" size={24} color={themeStyles.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakInfo}>
            <Ionicons name="flame" size={32} color="#FFF" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.streakText}>{userData?.streak} días</Text>
              <Text style={styles.streakLabel}>Racha actual</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
        </View>
        
        <View style={styles.quoteBox}>
          <Text style={styles.quoteLabel}>Tu luz hoy</Text>
          <Text style={styles.quoteText}>"{getDynamicQuote()}"</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.cardsContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NewEntry')}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>✍️</Text>
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Nueva Memoria</Text>
              <Text style={styles.cardDesc}>Descarga tu mente ahora</Text>
            </View>
            <Ionicons name="add-circle" size={32} color={themeStyles.accent} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('History')}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📖</Text>
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Mi Bóveda</Text>
              <Text style={styles.cardDesc}>Explora tus reflexiones</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={themeStyles.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Stats')}>
            <View style={styles.cardIconContainer}>
              <Text style={styles.cardIcon}>📈</Text>
            </View>
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>Mis Métricas</Text>
              <Text style={styles.cardDesc}>Análisis de tu energía vital</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={themeStyles.secondaryText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
