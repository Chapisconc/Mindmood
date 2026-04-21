import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
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
        .order('created_at', { ascending: true }); // Orden cronológico real
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyText}>No hay datos todavía</Text>
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
    { name: 'Excelente', population: excelente, color: '#34D399', legendFontColor: '#CBD5E1', legendFontSize: 13 },
    { name: 'Feliz', population: feliz, color: '#10B981', legendFontColor: '#CBD5E1', legendFontSize: 13 },
    { name: 'Neutral', population: neutral, color: '#FCD34D', legendFontColor: '#CBD5E1', legendFontSize: 13 },
    { name: 'Triste', population: triste, color: '#F87171', legendFontColor: '#CBD5E1', legendFontSize: 13 },
    { name: 'Riesgo Crítico', population: crisis, color: '#EF4444', legendFontColor: '#CBD5E1', legendFontSize: 13 }
  ].filter(item => item.population > 0);

  // Evolución semanal (Línea de Vida Emocional)
  const lineValues = entries.map(e => e.score);
  // Limitar a las últimas 10 entradas para que no se sature
  const recentValues = lineValues.slice(-10);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Balance de Energía Semanal</Text>
      
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distribución Psicológica Real</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={200}
          chartConfig={{ color: (op = 1) => `rgba(255,255,255,${op})` }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Evolución de Energía Vital (Últimas Entradas)</Text>
        <Text style={styles.chartSub}>Valores Arriba = Energía Positiva | Abajo = Agotamiento/Tristeza</Text>
        <LineChart
          data={{
            labels: recentValues.map((_, i) => `${i+1}`),
            datasets: [{ data: recentValues }]
          }}
          width={screenWidth - 70}
          height={220}
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#1E293B',
            backgroundGradientFrom: '#1E293B',
            backgroundGradientTo: '#1E293B',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#818CF8" }
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#0F172A' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 20, marginTop: 10 },
  chartCard: { backgroundColor: '#1E293B', padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#E2E8F0', marginBottom: 10, textAlign: 'center' },
  chartSub: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  emptyEmoji: { fontSize: 50, marginBottom: 10 },
  emptyText: { color: '#94A3B8', fontSize: 18 }
});
