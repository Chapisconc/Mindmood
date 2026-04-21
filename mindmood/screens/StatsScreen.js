import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { theme, themeStyles } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Semana'); // 'Semana', 'Mes', 'Año'

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { paddingBottom: 60 },
    header: { padding: 25, paddingBottom: 15 },
    title: { fontSize: 34, fontWeight: '900', color: themeStyles.text, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, fontWeight: '600', marginTop: 4 },
    
    // Period Selector
    periodSelector: { flexDirection: 'row', paddingHorizontal: 25, marginBottom: 20, gap: 10 },
    periodBtn: { flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: themeStyles.card, alignItems: 'center', borderWidth: 1, borderColor: themeStyles.border },
    periodBtnActive: { backgroundColor: themeStyles.accent, borderColor: themeStyles.accent },
    periodText: { fontWeight: '800', color: themeStyles.secondaryText, fontSize: 13 },
    periodTextActive: { color: '#FFF' },

    chartCard: { backgroundColor: themeStyles.card, marginHorizontal: 20, borderRadius: 32, marginBottom: 24, paddingVertical: 25, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 10, width: 0}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    chartTitle: { fontSize: 20, fontWeight: '900', color: themeStyles.text, textAlign: 'center', marginBottom: 5 },
    chartSub: { fontSize: 13, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
    
    // Mini Legend
    miniLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20, paddingHorizontal: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendLabel: { fontSize: 10, fontWeight: '800', color: themeStyles.secondaryText, textTransform: 'uppercase' },

    insightCard: { backgroundColor: themeStyles.card, marginHorizontal: 20, padding: 25, borderRadius: 28, marginBottom: 24, borderLeftWidth: 8, borderLeftColor: themeStyles.accent },
    insightTitle: { fontSize: 18, fontWeight: '900', color: themeStyles.text, marginBottom: 10 },
    insightText: { fontSize: 15, color: themeStyles.text, lineHeight: 22, fontWeight: '500' },
    trendBadge: { alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginTop: 15, flexDirection: 'row', alignItems: 'center' },
    trendText: { fontWeight: '800', fontSize: 12, color: '#FFF', marginLeft: 8 },

    glossaryTitle: { fontSize: 24, fontWeight: '900', color: themeStyles.text, marginTop: 20, marginBottom: 20, marginHorizontal: 25 },
    glossaryContainer: { backgroundColor: themeStyles.card, marginHorizontal: 20, borderRadius: 32, padding: 25, marginBottom: 50, borderWidth: 1, borderColor: themeStyles.border },
    emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    emotionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    emotionInfo: { flex: 1 },
    emotionName: { fontSize: 17, fontWeight: '800', color: themeStyles.text },
    emotionDesc: { fontSize: 13, color: themeStyles.secondaryText, marginTop: 3, lineHeight: 18 },
    
    loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: themeStyles.background },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: themeStyles.background },
    emptyEmoji: { fontSize: 80, marginBottom: 20 },
    emptyText: { fontSize: 24, fontWeight: '900', textAlign: 'center', color: themeStyles.text },
  });

  const emotionsMap = [
    { name: 'Excelente', color: '#10B981', icon: 'star', desc: 'Momentos de máxima plenitud y alegría.' },
    { name: 'Feliz', color: '#6366F1', icon: 'happy', desc: 'Bienestar, paz y satisfacción general.' },
    { name: 'Agradecido', color: '#FACC15', icon: 'heart', desc: 'Sentimiento profundo de aprecio.' },
    { name: 'Sorpresa', color: '#06B6D4', icon: 'flash', desc: 'Asombro ante lo inesperado.' },
    { name: 'Neutral', color: '#94A3B8', icon: 'remove-circle', desc: 'Equilibrio y calma estable.' },
    { name: 'Enojo', color: '#F97316', icon: 'flame', desc: 'Frustración o irritación intensa.' },
    { name: 'Ansiedad', color: '#8B5CF6', icon: 'pulse', desc: 'Inquietud o estrés por el futuro.' },
    { name: 'Miedo', color: '#4B5563', icon: 'eye-off', desc: 'Sensación de inseguridad o temor.' },
    { name: 'Triste', color: '#F87171', icon: 'rainy', desc: 'Melancolía o tristeza por pérdida.' },
    { name: 'Crisis', color: '#EF4444', icon: 'alert-circle', desc: 'Angustia alta que requiere apoyo.' },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    filterData();
  }, [entries, period]);

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

  const filterData = () => {
    if (!entries.length) return;
    
    const now = new Date();
    let filtered = [];

    if (period === 'Semana') {
      const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      filtered = entries.filter(e => new Date(e.created_at) >= lastWeek);
    } else if (period === 'Mes') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = entries.filter(e => new Date(e.created_at) >= lastMonth);
    } else {
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filtered = entries.filter(e => new Date(e.created_at) >= lastYear);
    }

    setFilteredEntries(filtered);
  };

  const getInsight = (data) => {
    if (data.length < 2) return { text: "Registra al menos dos días para recibir un análisis de tendencia.", trend: "Estable", color: "#94A3B8", icon: "remove" };
    
    const scores = data.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const last = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    const diff = last - prev;

    let text = "";
    let trend = "Estable";
    let color = "#94A3B8";
    let icon = "remove";

    if (avg > 0.4) text = "Tu energía general es vibrante y positiva en este periodo.";
    else if (avg > -0.1) text = "Mantienes un equilibrio emocional notable. Estás en centro.";
    else text = "Este periodo ha sido emocionalmente exigente. Prioriza tu descanso.";

    if (diff > 0.15) { trend = "Mejorando"; color = "#10B981"; icon = "trending-up"; }
    else if (diff < -0.15) { trend = "Bajando"; color = "#EF4444"; icon = "trending-down"; }

    return { text, trend, color, icon };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyText}>Tu mapa emocional llegará pronto</Text>
      </View>
    );
  }

  const chartData = filteredEntries.length > 0 ? filteredEntries : entries.slice(-10);
  const labels = chartData.map((_, i) => `${i + 1}`);
  const scores = chartData.map(e => e.score);
  const dotColors = chartData.map(e => {
    const emotion = emotionsMap.find(emo => emo.name === e.mood);
    return emotion ? emotion.color : themeStyles.accent;
  });

  const moodCounts = {};
  chartData.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const total = chartData.length;

  const pieData = emotionsMap.map(emo => {
    const count = moodCounts[emo.name] || 0;
    const percentage = ((count / total) * 100).toFixed(0);
    return { name: `${emo.name} (${percentage}%)`, population: count, color: emo.color, legendFontColor: themeStyles.text, legendFontSize: 12 };
  }).filter(item => item.population > 0);

  const insight = getInsight(chartData);

  // Dynamic width for LineChart (Allows scrolling if many points)
  const calcWidth = Math.max(screenWidth - 40, chartData.length * 50);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Evolución de tu energía vital</Text>
        </View>

        <View style={styles.periodSelector}>
          {['Semana', 'Mes', 'Año'].map(p => (
            <TouchableOpacity 
              key={p} 
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trayectoria Personal</Text>
          <Text style={styles.chartSub}>Pulso de tu mente en este periodo</Text>
          
          <View style={styles.miniLegend}>
            {emotionsMap.filter(emo => chartData.some(e => e.mood === emo.name)).map((emo, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: emo.color }]} />
                <Text style={styles.legendLabel}>{emo.name}</Text>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <LineChart
              data={{ labels, datasets: [{ data: scores }] }}
              width={calcWidth}
              height={260}
              chartConfig={{
                backgroundColor: themeStyles.card,
                backgroundGradientFrom: themeStyles.card,
                backgroundGradientTo: themeStyles.card,
                decimalPlaces: 1,
                color: () => themeStyles.accent,
                labelColor: () => themeStyles.secondaryText,
                propsForDots: { r: "7", strokeWidth: "0" },
                formatYLabel: (y) => {
                  const val = parseFloat(y);
                  if (val >= 0.8) return "Cenit";
                  if (val >= 0.3) return "Bien";
                  if (val >= -0.1) return "Neutro";
                  if (val >= -0.6) return "Bajo";
                  return "Crítico";
                }
              }}
              getDotColor={(_, index) => dotColors[index]}
              bezier
              segments={4}
              style={{ borderRadius: 16 }}
            />
          </ScrollView>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Análisis de Bienestar</Text>
          <Text style={styles.insightText}>{insight.text}</Text>
          <View style={[styles.trendBadge, { backgroundColor: insight.color }]}>
            <Ionicons name={insight.icon} size={18} color="#FFF" />
            <Text style={styles.trendText}>Tendencia {period.toLowerCase()}: {insight.trend}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Panorama Mental</Text>
          <Text style={styles.chartSub}>Distribución de estados ({period})</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{ color: () => themeStyles.text }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
          />
        </View>

        <Text style={styles.glossaryTitle}>Glosario de Emociones</Text>
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
