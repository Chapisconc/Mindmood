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
    
    alarmCard: { backgroundColor: themeStyles.card, padding: 18, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: themeStyles.error + '40', borderLeftWidth: 5, borderLeftColor: themeStyles.error },
    alarmHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    userMail: { color: themeStyles.text, fontWeight: '700', fontSize: 15 },
    alarmDate: { color: themeStyles.secondaryText, fontSize: 12 },
    alarmText: { color: themeStyles.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic', fontWeight: '500' },
    
    exportBtn: { backgroundColor: themeStyles.secondaryText, padding: 16, borderRadius: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 40 },
    exportBtnText: { color: themeStyles.background, fontWeight: 'bold', fontSize: 16, marginLeft: 10 }
  });

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={themeStyles.accent} /></View>;

  const chartData = stats ? [
    { name: 'Excelente', count: stats.excellent_entries, color: themeStyles.success, legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Felices', count: stats.happy_entries, color: '#6366F1', legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Neutral', count: stats.neutral_entries, color: themeStyles.neutral, legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Tristes', count: stats.sad_entries, color: '#F87171', legendFontColor: themeStyles.text, legendFontSize: 12 },
    { name: 'Crisis', count: stats.crisis_entries, color: themeStyles.error, legendFontColor: themeStyles.text, legendFontSize: 12 }
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
              chartConfig={{ color: (op = 1) => themeStyles.text }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="0"
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
        {filteredAlarms.length > 0 ? filteredAlarms.map((item, index) => (
          <View key={index} style={styles.alarmCard}>
            <View style={styles.alarmHeader}>
              <Text style={styles.userMail}>{item.student_email}</Text>
              <Text style={styles.alarmDate}>{new Date(item.recorded_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.alarmText}>"{item.diary_text}"</Text>
          </View>
        )) : (
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
