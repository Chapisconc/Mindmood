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
    
    crisisCard: { backgroundColor: theme === 'dark' ? '#450a0a' : '#FEE2E2', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: theme === 'dark' ? '#7f1d1d' : '#EF4444', alignItems: 'center', marginBottom: 20 },
    crisisValue: { fontSize: 36, fontWeight: '900', color: theme === 'dark' ? '#fca5a5' : '#B91C1C' },
    crisisLabel: { fontSize: 12, fontWeight: '800', color: theme === 'dark' ? '#fca5a5' : '#B91C1C', textTransform: 'uppercase', marginTop: 4 },

    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeStyles.card, borderRadius: 16, paddingHorizontal: 15, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border },
    searchInput: { flex: 1, padding: 12, color: themeStyles.text, fontSize: 16 },
    
    card: { backgroundColor: themeStyles.card, padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: themeStyles.border },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: themeStyles.text, marginBottom: 15 },
    
    alarmCard: { backgroundColor: themeStyles.card, padding: 22, borderRadius: 28, marginBottom: 18, borderWidth: 1, borderColor: themeStyles.error + '40', borderLeftWidth: 6, borderLeftColor: themeStyles.error, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    alarmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: themeStyles.border + '20' },
    userMail: { color: themeStyles.text, fontWeight: '800', fontSize: 14, marginBottom: 4 },
    alarmDate: { color: themeStyles.secondaryText, fontSize: 11, fontWeight: '700' },
    alarmTime: { color: themeStyles.error, fontSize: 11, fontWeight: '900', marginTop: 2 },
    moodBadge: { alignItems: 'flex-end' },
    emoji: { fontSize: 24 },
    moodName: { fontSize: 9, fontWeight: '900', color: themeStyles.text, textTransform: 'uppercase' },
    
    alarmText: { color: themeStyles.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '500', marginBottom: 15 },

    distributionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    distBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    primaryBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
    distText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    primaryText: { color: '#F87171' },

    exportBtn: { backgroundColor: themeStyles.secondaryText, padding: 16, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 40 },
    exportBtnText: { color: themeStyles.background, fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={themeStyles.accent} /></View>;

  const chartData = stats ? [
    { name: 'Exc', count: stats.excellent_entries, color: '#10B981', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Fel', count: stats.happy_entries, color: '#6366F1', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Agr', count: stats.gratitude_entries, color: '#FACC15', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Sor', count: stats.surprise_entries, color: '#06B6D4', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Neu', count: stats.neutral_entries, color: '#94A3B8', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Eno', count: stats.anger_entries, color: '#F97316', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Ans', count: stats.anxiety_entries, color: '#8B5CF6', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Mie', count: stats.fear_entries, color: '#4B5563', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Tri', count: stats.sad_entries, color: '#F87171', legendFontColor: themeStyles.text, legendFontSize: 10 },
    { name: 'Cri', count: stats.crisis_entries, color: '#EF4444', legendFontColor: themeStyles.text, legendFontSize: 10 }
  ].filter(i => i.count > 0) : [];

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
          <Text style={styles.sectionTitle}>Distribución poblacional</Text>
          {chartData.length > 0 ? (
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={180}
              chartConfig={{ color: () => themeStyles.text }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 0]}
              absolute
            />
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
                  <Text style={styles.userMail} numberOfLines={1}>{item.student_email}</Text>
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
              
              <Text style={styles.alarmText}>"{item.diary_text}"</Text>

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
