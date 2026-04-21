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
    chartSub: { fontSize: 13, color: themeStyles.secondaryText, textAlign: 'center', marginBottom: 15, fontWeight: '600' },
    
    // Quick Legend for LineChart
    miniLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 10, paddingHorizontal: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    legendLabel: { fontSize: 10, fontWeight: '800', color: themeStyles.secondaryText, textTransform: 'uppercase' },

    insightCard: { backgroundColor: themeStyles.card, padding: 25, borderRadius: 28, marginBottom: 25, borderLeftWidth: 8, borderLeftColor: themeStyles.accent },
    insightTitle: { fontSize: 18, fontWeight: '900', color: themeStyles.text, marginBottom: 10 },
    insightText: { fontSize: 15, color: themeStyles.text, lineHeight: 22, fontWeight: '500' },
    trendBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
    trendText: { fontWeight: '800', fontSize: 12, color: '#FFF', marginLeft: 6 },

    glossaryTitle: { fontSize: 22, fontWeight: '900', color: themeStyles.text, marginTop: 10, marginBottom: 15, paddingHorizontal: 10 },
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

  const getInsight = (recent) => {
    if (recent.length < 2) return { text: "Necesito un par de días más para darte un análisis profundo.", trend: "Estable", color: "#94A3B8", icon: "remove" };
    
    const scores = recent.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const last = scores[scores.length - 1];
    const prev = scores[scores.length - 2];
    const diff = last - prev;

    let text = "";
    let trend = "Estable";
    let color = "#94A3B8";
    let icon = "remove";

    if (avg > 0.5) text = "Tu ánimo general es muy positivo. Estás en una racha de gran bienestar.";
    else if (avg > 0) text = "Te encuentras en un estado equilibrado. Sigues manteniendo una energía estable.";
    else if (avg > -0.5) text = "Se nota que los últimos días han sido pesados. Tu curva muestra cierta fatiga emocional.";
    else text = "Tus niveles de bienestar están en zona de alerta. Sería bueno que descansaras o hablaras con alguien.";

    if (diff > 0.2) { trend = "Mejorando"; color = "#10B981"; icon = "trending-up"; }
    else if (diff < -0.2) { trend = "Bajando"; color = "#EF4444"; icon = "trending-down"; }

    return { text, trend, color, icon };
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
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={[styles.emptyText, { color: themeStyles.text }]}>Tu gráfico está esperando</Text>
        <Text style={[styles.emptySub, { color: themeStyles.secondaryText }]}>Cuando guardes tu primer diario, aquí verás el mapa de tu mente.</Text>
      </View>
    );
  }

  const total = entries.length;
  const moodCounts = {};
  entries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });

  const recentEntries = entries.slice(-8);
  const recentScores = recentEntries.map(e => e.score);
  
  // Get UNIQUE emotions present in the current LineChart to show in mini legend
  const presentEmotions = emotionsMap.filter(emo => 
    recentEntries.some(e => e.mood === emo.name)
  );

  const dotColors = recentEntries.map(e => {
    const emotion = emotionsMap.find(emo => emo.name === e.mood);
    return emotion ? emotion.color : themeStyles.accent;
  });

  const pieData = emotionsMap.map(emo => {
    const count = moodCounts[emo.name] || 0;
    const percentage = ((count / total) * 100).toFixed(0);
    return { name: `${emo.name} (${percentage}%)`, population: count, color: emo.color, legendFontColor: themeStyles.text, legendFontSize: 12 };
  }).filter(item => item.population > 0);

  const insight = getInsight(recentEntries);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Tu evolución emocional en datos</Text>
        
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Trayectoria Personal</Text>
          <Text style={styles.chartSub}>Pulso de tus últimos días</Text>
          
          {/* 📍 MINI-LEYENDA DINÁMICA */}
          <View style={styles.miniLegend}>
            {presentEmotions.map((emo, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: emo.color }]} />
                <Text style={styles.legendLabel}>{emo.name}</Text>
              </View>
            ))}
          </View>

          <LineChart
            data={{
              labels: recentScores.map((_, i) => `${i + 1}`),
              datasets: [{ data: recentScores }]
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
            getDotColor={(dataPoint, index) => dotColors[index]}
            bezier
            fromZero={false}
            segments={4}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Análisis de Bienestar</Text>
          <Text style={styles.insightText}>{insight.text}</Text>
          <View style={[styles.trendBadge, { backgroundColor: insight.color }]}>
            <Ionicons name={insight.icon} size={16} color="#FFF" />
            <Text style={styles.trendText}>Tendencia: {insight.trend}</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Panorama Mental</Text>
          <Text style={styles.chartSub}>Distribución de tus estados</Text>
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

        <Text style={styles.glossaryTitle}>Glosario Emocional</Text>
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
