import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { theme, themeStyles } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('Semana');
  const [fadeAnim] = useState(new Animated.Value(0));

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { paddingBottom: 60 },
    header: { padding: 25, paddingBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleContainer: { flex: 1 },
    title: { fontSize: 34, fontWeight: '900', color: themeStyles.text, letterSpacing: -1 },
    subtitle: { fontSize: 16, color: themeStyles.secondaryText, fontWeight: '600', marginTop: 4 },
    
    periodSelector: { flexDirection: 'row', paddingHorizontal: 25, marginBottom: 25, gap: 12 },
    periodBtn: { flex: 1, paddingVertical: 14, borderRadius: 20, backgroundColor: themeStyles.card, alignItems: 'center', borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 2, width: 0}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    periodBtnActive: { backgroundColor: themeStyles.accent, borderColor: themeStyles.accent, shadowColor: themeStyles.accent, shadowOpacity: 0.3, shadowRadius: 10 },
    periodText: { fontWeight: '800', color: themeStyles.secondaryText, fontSize: 14 },
    periodTextActive: { color: '#FFF' },

    chartCard: { marginHorizontal: 20, borderRadius: 32, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {height: 15, width: 0}, shadowOpacity: 0.15, shadowRadius: 30, elevation: 8 },
    gradientCard: { paddingVertical: 30, paddingHorizontal: 10 },
    chartTitle: { fontSize: 22, fontWeight: '900', color: themeStyles.text, textAlign: 'center', marginBottom: 5 },
    chartSub: { fontSize: 14, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 25, fontWeight: '600' },
    
    miniLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 25, paddingHorizontal: 20 },
    legendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legendLabel: { fontSize: 11, fontWeight: '800', color: themeStyles.text, textTransform: 'uppercase', letterSpacing: 0.5 },

    insightCard: { marginHorizontal: 20, borderRadius: 32, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: themeStyles.border },
    insightGradient: { padding: 30 },
    insightTitle: { fontSize: 20, fontWeight: '900', color: themeStyles.text, marginBottom: 12 },
    insightText: { fontSize: 16, color: themeStyles.text, lineHeight: 24, fontWeight: '500', opacity: 0.9 },
    trendBadge: { alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, marginTop: 20, flexDirection: 'row', alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    trendText: { fontWeight: '900', fontSize: 13, color: '#FFF', marginLeft: 10, textTransform: 'uppercase' },

    glossaryTitle: { fontSize: 26, fontWeight: '900', color: themeStyles.text, marginTop: 10, marginBottom: 25, marginHorizontal: 25 },
    glossaryContainer: { backgroundColor: themeStyles.card, marginHorizontal: 20, borderRadius: 35, padding: 30, marginBottom: 50, borderWidth: 1, borderColor: themeStyles.border },
    emotionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    emotionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    emotionInfo: { flex: 1 },
    emotionName: { fontSize: 18, fontWeight: '900', color: themeStyles.text },
    emotionDesc: { fontSize: 14, color: themeStyles.secondaryText, marginTop: 5, lineHeight: 20, fontWeight: '500' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: themeStyles.background },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: themeStyles.background },
    emptyEmoji: { fontSize: 90, marginBottom: 25 },
    emptyText: { fontSize: 26, fontWeight: '900', textAlign: 'center', color: themeStyles.text, lineHeight: 34 },
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
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
    let filtered = [...entries];

    if (period === 'Semana') {
      const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      filtered = entries.filter(e => new Date(e.created_at) >= lastWeek);
    } else if (period === 'Mes') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = entries.filter(e => new Date(e.created_at) >= lastMonth);
    } else if (period === 'Año') {
      const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filtered = entries.filter(e => new Date(e.created_at) >= lastYear);
    }

    setFilteredEntries(filtered);
  };

  const getInsight = (data) => {
    if (data.length < 2) return { text: "Necesitamos más registros en este periodo para darte un análisis de tendencia.", trend: "Estable", color: "#94A3B8", icon: "remove" };
    
    const scores = data.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const last = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    const diff = last - prev;

    let text = "";
    let trend = "Estable";
    let color = "#94A3B8";
    let icon = "remove";

    if (avg > 0.4) text = "Tu energía general es vibrante y positiva en este periodo. ¡Sigue así!";
    else if (avg > -0.1) text = "Mantienes un equilibrio emocional notable. Estás en tu centro.";
    else text = "Este periodo ha sido emocionalmente exigente. Prioriza tu descanso y autocuidado.";

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
        <Text style={styles.emptyText}>Tu mapa emocional se construirá con tus primeras entradas.</Text>
      </View>
    );
  }

  const chartData = filteredEntries.length > 0 ? filteredEntries : entries;
  
  const labels = chartData.map(e => {
    const d = new Date(e.created_at);
    if (period === 'Semana') return `${d.getDate()}/${d.getMonth() + 1}`;
    if (period === 'Mes') return `${d.getDate()}`;
    return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
  });

  const scores = chartData.map(e => e.score);
  const dotColors = chartData.map(e => {
    const emotion = emotionsMap.find(emo => emo.name === e.mood);
    return emotion ? emotion.color : themeStyles.accent;
  });

  let calcWidth = screenWidth - 40;
  if (period !== 'Semana' && chartData.length > 6) {
     calcWidth = chartData.length * 60;
  }

  const moodCounts = {};
  chartData.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const total = chartData.length;

  const pieData = emotionsMap.map(emo => {
    const count = moodCounts[emo.name] || 0;
    const percentage = ((count / total) * 100).toFixed(0);
    return { name: `${emo.name} (${percentage}%)`, population: count, color: emo.color, legendFontColor: themeStyles.text, legendFontSize: 12 };
  }).filter(item => item.population > 0);

  const insight = getInsight(chartData);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Estadísticas</Text>
            <Text style={styles.subtitle}>Tu evolución histórica</Text>
          </View>
        </Animated.View>

        <View style={styles.periodSelector}>
          {['Semana', 'Mes', 'Año'].map(p => (
            <TouchableOpacity 
              testID={`period_btn_${p}`}
              key={p} 
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.chartCard}>
          <LinearGradient
            colors={[themeStyles.card, themeStyles.itemBg]}
            style={styles.gradientCard}
          >
            <Text style={styles.chartTitle}>Trayectoria Personal</Text>
            <Text style={styles.chartSub}>Detalle de tus registros</Text>
            
            <View style={styles.miniLegend}>
              {emotionsMap.filter(emo => chartData.some(e => e.mood === emo.name)).map((emo, i) => (
                <View key={i} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: emo.color }]} />
                  <Text style={styles.legendLabel}>{emo.name}</Text>
                </View>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
              <LineChart
                data={{ labels, datasets: [{ data: scores }] }}
                width={calcWidth}
                height={260}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: themeStyles.card,
                  backgroundGradientTo: themeStyles.card,
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(${themeStyles.accent === '#8E54E9' ? '142, 84, 233' : '99, 102, 241'}, ${opacity})`,
                  labelColor: () => themeStyles.secondaryText,
                  propsForDots: { r: "7", strokeWidth: "2", stroke: themeStyles.card },
                  propsForBackgroundLines: { strokeDasharray: "", stroke: themeStyles.border, opacity: 0.3 }
                }}
                getDotColor={(_, index) => dotColors[index]}
                bezier
                segments={4}
                style={{ borderRadius: 20, paddingRight: 40 }}
              />
            </ScrollView>
          </LinearGradient>
        </View>

        <View style={styles.insightCard}>
          <LinearGradient
            colors={[themeStyles.accent + '15', themeStyles.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.insightGradient}
          >
            <Text style={styles.insightTitle}>Análisis de Bienestar</Text>
            <Text style={styles.insightText}>{insight.text}</Text>
            <View style={[styles.trendBadge, { backgroundColor: insight.color }]}>
              <Ionicons name={insight.icon} size={20} color="#FFF" />
              <Text style={trendTextStyle(insight.color)}>Tendencia: {insight.trend}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.chartCard}>
          <LinearGradient
            colors={[themeStyles.card, themeStyles.itemBg]}
            style={styles.gradientCard}
          >
            <Text style={styles.chartTitle}>Panorama Mental</Text>
            <Text style={styles.chartSub}>Distribución de estados</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
          </LinearGradient>
        </View>

        <Text style={styles.glossaryTitle}>Glosario de Emociones</Text>
        <View style={styles.glossaryContainer}>
          {emotionsMap.map((emo, idx) => (
            <View key={idx} style={styles.emotionRow}>
              <View style={[styles.emotionIcon, { backgroundColor: emo.color + '15' }]}>
                <Ionicons name={emo.icon} size={28} color={emo.color} />
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

  function trendTextStyle(color) {
    return { fontWeight: '900', fontSize: 13, color: '#FFF', marginLeft: 10, textTransform: 'uppercase' };
  }
}
