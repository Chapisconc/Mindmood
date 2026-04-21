import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { theme, themeStyles } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { padding: 20 },
    title: { fontSize: 32, fontWeight: '900', color: themeStyles.text, marginBottom: 5, marginTop: 10, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, marginBottom: 25, fontWeight: '600' },
    
    chartCard: { backgroundColor: themeStyles.card, padding: 20, borderRadius: 32, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 4, width: 0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    chartTitle: { fontSize: 18, fontWeight: '800', color: themeStyles.text, marginBottom: 4, textAlign: 'center' },
    chartSub: { fontSize: 13, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
    
    // Glossary section
    glossaryTitle: { fontSize: 22, fontWeight: '900', color: themeStyles.text, marginTop: 20, marginBottom: 15, paddingHorizontal: 10 },
    glossaryContainer: { backgroundColor: themeStyles.card, borderRadius: 28, padding: 20, marginBottom: 40, borderWidth: 1, borderColor: themeStyles.border },
    emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    emotionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    emotionInfo: { flex: 1 },
    emotionName: { fontSize: 16, fontWeight: '800', color: themeStyles.text },
    emotionDesc: { fontSize: 13, color: themeStyles.secondaryText, marginTop: 2, lineHeight: 18 },
    
    loadingContainer: { flex: 1, justifyContent: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 80, marginBottom: 20 },
    emptyText: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
    emptySub: { fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const emotionsMap = [
    { name: 'Excelente', desc: 'Momentos de máxima felicidad, euforia o logros importantes.', color: '#10B981', icon: 'star' },
    { name: 'Feliz', desc: 'Paz, bienestar general y satisfacción con tu día.', color: '#6366F1', icon: 'happy' },
    { name: 'Agradecido', desc: 'Sentimiento profundo de gratitud y aprecio por la vida.', color: '#FACC15', icon: 'heart' },
    { name: 'Sorpresa', desc: 'Asombro ante eventos inesperados o revelaciones.', color: '#06B6D4', icon: 'flash' },
    { name: 'Neutral', desc: 'Equilibrio, calma emocional y estabilidad sin extremos.', color: '#94A3B8', icon: 'remove-circle' },
    { name: 'Enojo', desc: 'Frustración, irritación o ira contenida o expresada.', color: '#F97316', icon: 'flame' },
    { name: 'Ansiedad', desc: 'Estrés, preocupación por el futuro o inquietud mental.', color: '#8B5CF6', icon: 'pulse' },
    { name: 'Miedo', desc: 'Temor, inseguridad o sensación de vulnerabilidad.', color: '#4B5563', icon: 'eye-off' },
    { name: 'Triste', desc: 'Melancolía, nostalgia o tristeza por alguna pérdida.', color: '#F87171', icon: 'rainy' },
    { name: 'Crisis', desc: 'Estado de alta angustia que requiere atención y apoyo.', color: '#EF4444', icon: 'alert-circle' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeStyles.background }]}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: themeStyles.background }]}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={[styles.emptyText, { color: themeStyles.text }]}>Tu gráfico está esperando</Text>
        <Text style={[styles.emptySub, { color: themeStyles.secondaryText }]}>Cuando guardes tu primer diario, aquí verás el mapa de tu mente.</Text>
      </View>
    );
  }

  // Calculate totals and percentages
  const total = entries.length;
  const moodCounts = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  const pieData = emotionsMap.map(emo => {
    const count = moodCounts[emo.name] || 0;
    const percentage = ((count / total) * 100).toFixed(0);
    return {
      name: `${emo.name} (${percentage}%)`,
      population: count,
      color: emo.color,
      legendFontColor: themeStyles.text,
      legendFontSize: 12
    };
  }).filter(item => item.population > 0);

  const lineValues = entries.map(e => e.score);
  const recentValues = lineValues.slice(-10);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu evolución emocional en datos</Text>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Panorama Mental</Text>
          <Text style={styles.chartSub}>Frecuencia de tus estados de ánimo</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={180}
            chartConfig={{ color: (op = 1) => themeStyles.text }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[12, 0]}
            absolute={false}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Pulso Reciente</Text>
          <Text style={styles.chartSub}>Trayectoria de ánimo (últimas 10 entradas)</Text>
          <LineChart
            data={{
              labels: recentValues.map((_, i) => `${i + 1}`),
              datasets: [{ data: recentValues }]
            }}
            width={screenWidth - 80}
            height={200}
            chartConfig={{
              backgroundColor: themeStyles.card,
              backgroundGradientFrom: themeStyles.card,
              backgroundGradientTo: themeStyles.card,
              decimalPlaces: 1,
              color: (opacity = 1) => themeStyles.accent,
              labelColor: (opacity = 1) => themeStyles.secondaryText,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "3", stroke: themeStyles.accent }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <Text style={styles.glossaryTitle}>Emociones que detecto</Text>
        <View style={styles.glossaryContainer}>
          {emotionsMap.map((emo, idx) => (
            <View key={idx} style={styles.emotionRow}>
              <View style={[styles.emotionIcon, { backgroundColor: emo.color + '20' }]}>
                <Ionicons name={emo.icon} size={24} color={emo.color} />
              </View>
              <View style={styles.emotionInfo}>
                <Text style={styles.emotionName}>{emo.name}</Text>
                <Text style={styles.emotionDesc}>{emo.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
