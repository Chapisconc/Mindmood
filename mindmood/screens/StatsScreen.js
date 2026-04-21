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
        <Text style={styles.emptyEmoji}>📈</Text>
        <Text style={[styles.emptyText, { color: themeStyles.text }]}>Sin datos todavía</Text>
        <Text style={[styles.emptySub, { color: themeStyles.secondaryText }]}>Empieza a escribir para ver tu progreso.</Text>
      </View>
    );
  }

  // Calculate mood distribution
  let excelente = 0, feliz = 0, triste = 0, neutral = 0, crisis = 0;
  entries.forEach(e => {
    if (e.mood === 'Excelente') excelente++;
    else if (e.mood === 'Feliz') feliz++;
    else if (e.mood === 'Triste') triste++;
    else if (e.mood === 'Crisis') crisis++;
    else neutral++;
  });

  const pieData = [
    { name: 'Excelente', population: excelente, color: themeStyles.success, legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Feliz', population: feliz, color: '#6366F1', legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Neutral', population: neutral, color: themeStyles.neutral, legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Triste', population: triste, color: '#F87171', legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Crisis', population: crisis, color: themeStyles.error, legendFontColor: themeStyles.text, legendFontSize: 12 }
  ].filter(item => item.population > 0);

  const lineValues = entries.map(e => e.score);
  const recentValues = lineValues.slice(-10);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { padding: 20 },
    title: { fontSize: 26, fontWeight: '900', color: themeStyles.text, marginBottom: 20, marginTop: 10 },
    chartCard: { backgroundColor: themeStyles.card, padding: 20, borderRadius: 28, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 4, width: 0}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    chartTitle: { fontSize: 16, fontWeight: '800', color: themeStyles.text, marginBottom: 4, textAlign: 'center' },
    chartSub: { fontSize: 12, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyEmoji: { fontSize: 60, marginBottom: 15 },
    emptyText: { fontSize: 20, fontWeight: 'bold' },
    emptySub: { fontSize: 14, marginTop: 5 },
    legendContainer: { marginTop: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 }
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Tu Energía Vital</Text>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribución Emocional</Text>
          <Text style={styles.chartSub}>Resumen de todos tus estados registrados</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 80}
            height={180}
            chartConfig={{ color: (op = 1) => themeStyles.text }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[10, 0]}
            absolute
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trayectoria Reciente</Text>
          <Text style={styles.chartSub}>Tus últimas 10 entradas</Text>
          <LineChart
            data={{
              labels: recentValues.map((_, i) => `${i + 1}`),
              datasets: [{ data: recentValues }]
            }}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: themeStyles.card,
              backgroundGradientFrom: themeStyles.card,
              backgroundGradientTo: themeStyles.card,
              decimalPlaces: 1,
              color: (opacity = 1) => themeStyles.accent,
              labelColor: (opacity = 1) => themeStyles.secondaryText,
              style: { borderRadius: 16 },
              propsForDots: { r: "5", strokeWidth: "2", stroke: themeStyles.accent }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
