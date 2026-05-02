import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { theme, themeStyles, toggleTheme } = useTheme();
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
        // Ejecutar reparación de datos en segundo plano
        repairDataIntegrity(user.id);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const repairDataIntegrity = async (userId) => {
    try {
      const { data: damagedEntries } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userId)
        .eq('mood', 'Neutral')
        .eq('score', 0)
        .limit(15);

      if (damagedEntries && damagedEntries.length > 0) {
        console.log(`[Integridad] Reparando ${damagedEntries.length} entradas en HomeScreen...`);
        for (const entry of damagedEntries) {
          try {
            const response = await fetch("https://mindmood-ai.onrender.com/analyze", {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
              body: JSON.stringify({ text: entry.text })
            });

            if (response.ok) {
              const aiData = await response.json();
              if (aiData.mood !== 'Neutral' || aiData.score !== 0) {
                await supabase
                  .from('entries')
                  .update({ 
                    mood: aiData.mood, 
                    score: aiData.score,
                    distribution: aiData.emotions_distribution
                  })
                  .eq('id', entry.id);
              }
            }
          } catch (e) {
            console.log("Fallo en re-análisis silencioso.");
          }
        }
      }
    } catch (err) {
      console.log("Error en reparación de HomeScreen:", err);
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
    welcomeContainer: { flex: 1, marginLeft: 15 },
    welcomeText: { fontSize: 14, color: themeStyles.secondaryText, fontWeight: '600' },
    nameText: { fontSize: 24, fontWeight: '900', color: themeStyles.text },
    profileBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: themeStyles.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: themeStyles.border },
    toggleContainer: { flexDirection: 'row', alignItems: 'center' },
    streakCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: themeStyles.accent, marginHorizontal: 20, padding: 22, borderRadius: 28, marginBottom: 25, shadowColor: themeStyles.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 15, elevation: 8 },
    streakInfo: { flexDirection: 'row', alignItems: 'center' },
    streakText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
    streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
    quoteBox: { marginHorizontal: 20, backgroundColor: themeStyles.card, padding: 24, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: themeStyles.border },
    quoteLabel: { fontSize: 11, fontWeight: '900', color: themeStyles.secondaryText, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    quoteText: { fontSize: 17, color: themeStyles.text, lineHeight: 28, fontWeight: '500', fontStyle: 'italic' },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: themeStyles.text, marginHorizontal: 20, marginBottom: 16 },
    cardsContainer: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, padding: 20, borderRadius: 24, marginBottom: 14, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    cardIconContainer: { width: 52, height: 52, borderRadius: 18, backgroundColor: themeStyles.itemBg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.toggleContainer}>
             <Ionicons name={theme === 'dark' ? "moon" : "sunny"} size={20} color={themeStyles.secondaryText} style={{marginRight: 8}} />
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
