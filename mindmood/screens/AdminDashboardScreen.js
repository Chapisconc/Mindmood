import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }) {
  const { theme, themeStyles } = useTheme();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [filteredAlarms, setFilteredAlarms] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredAlarms(alarms);
    } else {
      const filtered = alarms.filter(a => 
        a.student_email?.toLowerCase().includes(searchText.toLowerCase()) ||
        a.diary_text?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredAlarms(filtered);
    }
  }, [searchText, alarms]);

  const fetchAdminData = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) setStats(statsData[0]);

      const { data: alarmData, error: alarmError } = await supabase.rpc('get_admin_alarms');
      if (alarmError) throw alarmError;
      setAlarms(alarmData || []);
      setFilteredAlarms(alarmData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!stats) return;
    const report = `# Reporte MindMood - ${new Date().toLocaleDateString()}\n\n` +
      `Estadísticas Generales:\n` +
      `- Total Usuarios: ${stats.total_users}\n` +
      `- Total Diarios: ${stats.total_entries}\n` +
      `- Casos en Riesgo Crítico: ${stats.crisis_entries}\n\n` +
      `Alertas Detectadas:\n` +
      alarms.map(a => `- [${a.student_email}] ${a.diary_text.substring(0, 50)}...`).join('\n');

    try {
      await Share.share({ message: report });
    } catch (error) {
      console.error(error);
    }
  };

  const getEmoji = (mood) => {
    const map = {
      'Excelente': '🤩', 'Feliz': '😊', 'Agradecido': '🙏', 'Sorpresa': '😲',
      'Neutral': '😐', 'Enojo': '😠', 'Ansiedad': '😰', 'Miedo': '😨',
      'Triste': '😔', 'Crisis': '🆘'
    };
    return map[mood] || '😐';
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    scroll: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
    title: { fontSize: 28, fontWeight: '900', color: themeStyles.text },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
    statCard: { flex: 1, backgroundColor: themeStyles.card, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: themeStyles.border, alignItems: 'center' },
    statValue: { fontSize: 24, fontWeight: '900', color: themeStyles.text },
    statLabel: { fontSize: 11, color: themeStyles.secondaryText, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
    
    crisisCard: { backgroundColor: theme === 'dark' ? 'rgba(127, 29, 29, 0.2)' : '#FEE2E2', padding: 20, borderRadius: 24, borderWidth: 2, borderColor: theme === 'dark' ? '#ef4444' : '#EF4444', alignItems: 'center', marginBottom: 20 },
    crisisValue: { fontSize: 42, fontWeight: '900', color: theme === 'dark' ? '#f87171' : '#B91C1C' },
    crisisLabel: { fontSize: 13, fontWeight: '800', color: theme === 'dark' ? '#f87171' : '#B91C1C', textTransform: 'uppercase', marginTop: 4 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, borderRadius: 16, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border },
    searchInput: { flex: 1, padding: 12, color: themeStyles.text, fontSize: 16 },
    
    card: { backgroundColor: themeStyles.card, padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    sectionTitle: { fontSize: 22, fontWeight: '900', color: themeStyles.text, marginBottom: 15, letterSpacing: -0.5 },
    
    alarmCard: { backgroundColor: themeStyles.card, padding: 22, borderRadius: 28, marginBottom: 18, borderWidth: 1, borderColor: themeStyles.border, borderLeftWidth: 8, borderLeftColor: themeStyles.error, shadowColor: themeStyles.error, shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
    alarmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: themeStyles.border + '20' },
    userMail: { color: themeStyles.accent, fontWeight: '800', fontSize: 15, marginBottom: 4 },
    alarmDate: { color: themeStyles.secondaryText, fontSize: 12, fontWeight: '700' },
    alarmTime: { color: themeStyles.error, fontSize: 12, fontWeight: '900', marginTop: 2 },
    moodBadge: { alignItems: 'flex-end', backgroundColor: themeStyles.itemBg, padding: 8, borderRadius: 12 },
    emoji: { fontSize: 28 },
    moodName: { fontSize: 10, fontWeight: '900', color: themeStyles.text, textTransform: 'uppercase', marginTop: 2 },
    
    alarmText: { color: themeStyles.text, fontSize: 16, lineHeight: 26, fontStyle: 'italic', fontWeight: '500', marginBottom: 15, opacity: 0.9 },

    distributionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    distBadge: { backgroundColor: themeStyles.itemBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: themeStyles.border },
    primaryBadge: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)' },
    distText: { color: themeStyles.secondaryText, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    primaryText: { color: '#ef4444' },

    exportBtn: { backgroundColor: themeStyles.accent, padding: 18, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 50, shadowColor: themeStyles.accent, shadowOffset: {width:0, height:10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
    exportBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, marginLeft: 10 }
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={themeStyles.accent} /></View>;

  const emotionsMap = [
    { name: 'Excelente', color: '#10B981' },
    { name: 'Feliz', color: '#6366F1' },
    { name: 'Agradecido', color: '#FACC15' },
    { name: 'Sorpresa', color: '#06B6D4' },
    { name: 'Neutral', color: '#94A3B8' },
    { name: 'Enojo', color: '#F97316' },
    { name: 'Ansiedad', color: '#8B5CF6' },
    { name: 'Miedo', color: '#4B5563' },
    { name: 'Triste', color: '#F87171' },
    { name: 'Crisis', color: '#EF4444' },
  ];

  const chartData = stats ? emotionsMap.map(emo => {
    const keyMap = {
      'Excelente': 'excellent_entries', 'Feliz': 'happy_entries', 'Agradecido': 'gratitude_entries',
      'Sorpresa': 'surprise_entries', 'Neutral': 'neutral_entries', 'Enojo': 'anger_entries',
      'Ansiedad': 'anxiety_entries', 'Miedo': 'fear_entries', 'Triste': 'sad_entries', 'Crisis': 'crisis_entries'
    };
    return { name: emo.name, count: stats[keyMap[emo.name]] || 0, color: emo.color, legendFontColor: themeStyles.text, legendFontSize: 12 };
  }).filter(i => i.count > 0) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Panel Admin</Text>
          <TouchableOpacity onPress={async () => {
            await supabase.auth.signOut();
            navigation.replace('Login');
          }}>
            <Ionicons name="log-out-outline" size={26} color={themeStyles.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_users}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.total_entries}</Text>
            <Text style={styles.statLabel}>Diarios</Text>
          </View>
        </View>

        <View style={styles.crisisCard}>
            <Text style={styles.crisisValue}>{stats?.crisis_entries}</Text>
            <Text style={styles.crisisLabel}>Alertas de Riesgo Activas</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Panorama Poblacional</Text>
          <Text style={{ fontSize: 13, color: themeStyles.secondaryText, marginBottom: 20, fontWeight: '600' }}>Distribución de estados de ánimo actuales</Text>
          
          {chartData.length > 0 ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 25 }}>
                {chartData.map((emo, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: emo.color }} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: themeStyles.secondaryText, textTransform: 'uppercase' }}>{emo.name}</Text>
                  </View>
                ))}
              </View>

              <PieChart
                data={chartData.map(d => ({ ...d, name: '' }))} // Remove inline names
                width={screenWidth - 40}
                height={200}
                chartConfig={{ color: () => themeStyles.text }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="50"
                center={[screenWidth / 6, 0]}
                hasLegend={false}
              />
            </>
          ) : <Text style={{ color: themeStyles.secondaryText, textAlign: 'center' }}>Sin registros aún.</Text>}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={themeStyles.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Filtrar por correo o texto..."
            placeholderTextColor={themeStyles.secondaryText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <Text style={styles.sectionTitle}>Bitácora de Riesgos 🔥</Text>
        {filteredAlarms.length > 0 ? filteredAlarms.map((item, index) => {
          const dateObj = new Date(item.recorded_at);
          const sortedMoods = item.distribution ? Object.entries(item.distribution).sort((a,b) => b[1] - a[1]) : [[item.mood, 100]];

          return (
            <View key={index} style={styles.alarmCard}>
              <View style={styles.alarmHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userMail} numberOfLines={1}>
                    {item.student_email || item.email || "Usuario Desconocido"}
                  </Text>
                  <Text style={styles.alarmDate}>{dateObj.toLocaleDateString()}</Text>
                  <Text style={styles.alarmTime}>
                    <Ionicons name="time-outline" size={12} /> {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.moodBadge}>
                  <Text style={styles.emoji}>{getEmoji(item.mood)}</Text>
                  <Text style={styles.moodName}>{item.mood}</Text>
                </View>
              </View>
              
              <Text style={styles.alarmText}>&quot;{item.diary_text}&quot;</Text>

              <View style={styles.distributionContainer}>
                {sortedMoods.map(([name], idx) => (
                  <View key={idx} style={[styles.distBadge, name === item.mood && styles.primaryBadge]}>
                    <Text style={[styles.distText, name === item.mood && styles.primaryText]}>
                      {name === item.mood ? `🔥 ${name}` : name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        }) : (
          <Text style={{ color: themeStyles.secondaryText, textAlign: 'center', fontStyle: 'italic', marginVertical: 20 }}>No hay alertas que coincidan.</Text>
        )}

        <TouchableOpacity style={styles.exportBtn} onPress={shareReport}>
          <Ionicons name="share-social-outline" size={22} color={themeStyles.background} />
          <Text style={styles.exportBtnText}>Exportar Reporte Mensual</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
