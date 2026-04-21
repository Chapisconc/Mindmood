import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [lastMood, setLastMood] = useState(null);

  useEffect(() => {
    fetchUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData(); 
    });
    return unsubscribe;
  }, [navigation]);

  const fetchUserData = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      setUserName(userData.user.email.split('@')[0]);
      
      const { data: lastEntry } = await supabase
        .from('entries')
        .select('mood')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (lastEntry) {
        setLastMood(lastEntry.mood);
      }
    }
  };

  const getDynamicQuote = () => {
    switch (lastMood) {
      case 'Excelente': return '¡Qué gran racha llevas! Sigue construyendo memorias geniales. 🌟';
      case 'Feliz': return 'Es un buen día para seguir sonriendo. 😊';
      case 'Neutral': return 'La calma es el mejor lienzo para empezar a pintar. 🍃';
      case 'Triste': return 'Recuerda que después de la tormenta siempre sale el sol. Un paso a la vez. ❤️';
      case 'Crisis': return 'No tienes que pasar por esto a solas. Siempre hay ayuda disponible para ti. 🫂';
      default: return 'Bienvenido a MindMood. Escribe tu primer registro hoy.';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hola, {userName || 'Amigo'}</Text>
      
      <View style={styles.quoteBox}>
        <Text style={styles.quoteLabel}>CONSEJO TERAPÉUTICO DEL DÍA</Text>
        <Text style={styles.quoteText}>{getDynamicQuote()}</Text>
      </View>
      
      <View style={styles.cardsContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NewEntry')}>
          <Text style={styles.cardIcon}>✏️</Text>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Nueva Memoria</Text>
            <Text style={styles.cardDesc}>Escribe cómo te sientes hoy</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('History')}>
          <Text style={styles.cardIcon}>📖</Text>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Mi Bóveda</Text>
            <Text style={styles.cardDesc}>Lee tus pensamientos pasados</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Stats')}>
          <Text style={styles.cardIcon}>📊</Text>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Mis Métricas</Text>
            <Text style={styles.cardDesc}>Mide tu energía semanal</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión Segura</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  header: { fontSize: 34, fontWeight: '800', color: '#F8FAFC', marginTop: 40, marginBottom: 20, letterSpacing: 0.5 },
  quoteBox: { backgroundColor: '#1E293B', padding: 20, borderRadius: 16, marginBottom: 30, borderLeftWidth: 4, borderColor: '#818CF8', shadowColor: '#000', shadowOffset: {height:5, width:0}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  quoteLabel: { fontSize: 12, fontWeight: 'bold', color: '#818CF8', marginBottom: 8, letterSpacing: 1 },
  quoteText: { fontSize: 16, color: '#E2E8F0', fontStyle: 'italic', lineHeight: 22 },
  cardsContainer: { flex: 1, gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  cardIcon: { fontSize: 32, marginRight: 20 },
  cardTextContent: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#94A3B8' },
  logoutButton: { padding: 16, alignItems: 'center', marginBottom: 15, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12 },
  logoutText: { color: '#F87171', fontSize: 16, fontWeight: 'bold' }
});
