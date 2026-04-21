import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../services/supabase';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) setStats(statsData[0]);

      // Fetch Crisis Alarms
      const { data: alarmData, error: alarmError } = await supabase.rpc('get_admin_alarms');
      if (alarmError) throw alarmError;
      setAlarms(alarmData || []);
    } catch (error) {
      console.error('Fetch Admin Data Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#F87171" /></View>;

  const chartData = stats ? [
    { name: 'Excelente', count: stats.excellent_entries, color: '#34D399', legendFontColor: '#CBD5E1', legendFontSize: 12 },
    { name: 'Felices', count: stats.happy_entries, color: '#10B981', legendFontColor: '#CBD5E1', legendFontSize: 12 },
    { name: 'Neutral', count: stats.neutral_entries, color: '#FCD34D', legendFontColor: '#CBD5E1', legendFontSize: 12 },
    { name: 'Tristes', count: stats.sad_entries, color: '#F87171', legendFontColor: '#CBD5E1', legendFontSize: 12 },
    { name: 'Riesgo Crítico', count: stats.crisis_entries, color: '#EF4444', legendFontColor: '#CBD5E1', legendFontSize: 12 }
  ].filter(i => i.count > 0) : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Control</Text>
      <Text style={styles.headerSub}>Métricas Institucionales MindMood</Text>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statBoxHalf}>
              <Text style={styles.statLabel}>Usuarios</Text>
              <Text style={styles.statNumber}>{String(stats.total_users ?? 0)}</Text>
            </View>
            <View style={styles.statBoxHalf}>
              <Text style={styles.statLabel}>Diarios</Text>
              <Text style={styles.statNumber}>{String(stats.total_entries ?? 0)}</Text>
            </View>
          </View>

          <View style={styles.crisisBox}>
            <Text style={styles.statLabel}>Alertas Activas (Crisis Estudiantes)</Text>
            <Text style={styles.crisisNumber}>{String(stats.crisis_entries ?? 0)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Distribución Poblacional</Text>
          {chartData.length > 0 ? (
            <View style={styles.chartWrapper}>
              <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={180}
                chartConfig={{ color: (op = 1) => `rgba(0,0,0,${op})` }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          ) : <Text style={styles.emptyText}>No hay registros todavía.</Text>}
        </View>
      )}

      <Text style={styles.sectionAlertTitle}>🚨 Bitácoras de Riesgo Expreso</Text>
      <Text style={styles.sectionAlertSub}>Estos diarios activaron el protocolo de intervención.</Text>
      
      {alarms.length > 0 ? (
        alarms.map((alarm, idx) => (
          <View key={idx} style={styles.alarmCard}>
            <View style={styles.alarmHeader}>
              <Text style={styles.alarmEmail}>{alarm.student_email}</Text>
              <Text style={styles.alarmDate}>{new Date(alarm.recorded_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.alarmText}>"{alarm.diary_text}"</Text>
          </View>
        ))
      ) : (
        <View style={styles.noAlarmsBox}>
          <Text style={styles.noAlarmsText}>✅ Todo excelente. No hay alumnos en crisis.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión Administrador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#09090B' },
  headerTitle: { color: '#FAFAFA', fontSize: 32, fontWeight: '900', marginTop: 40, letterSpacing: -0.5 },
  headerSub: { color: '#A1A1AA', fontSize: 15, marginBottom: 30 },
  statsContainer: { gap: 15, marginBottom: 15 },
  statRow: { flexDirection: 'row', gap: 15 },
  statBoxHalf: { flex: 1, backgroundColor: '#18181B', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#27272A' },
  crisisBox: { backgroundColor: '#450a0a', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#7f1d1d', alignItems: 'center' },
  statLabel: { color: '#A1A1AA', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  statNumber: { color: '#FAFAFA', fontSize: 40, fontWeight: 'bold' },
  crisisNumber: { color: '#fca5a5', fontSize: 50, fontWeight: '900' },
  sectionTitle: { color: '#FAFAFA', fontSize: 18, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  chartWrapper: { backgroundColor: '#18181B', borderRadius: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#27272A', alignItems: 'center' },
  sectionAlertTitle: { color: '#fca5a5', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  sectionAlertSub: { color: '#A1A1AA', fontSize: 13, marginBottom: 15 },
  alarmCard: { backgroundColor: '#18181B', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderLeftWidth: 4, borderColor: '#27272A', borderLeftColor: '#ef4444' },
  alarmHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  alarmEmail: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 15 },
  alarmDate: { color: '#52525B', fontSize: 12 },
  alarmText: { color: '#D4D4D8', fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  noAlarmsBox: { backgroundColor: '#14532d', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  noAlarmsText: { color: '#86efac', fontWeight: 'bold' },
  emptyText: { color: '#52525B', textAlign: 'center', marginTop: 10 },
  logoutBtn: { padding: 15, alignSelf: 'center', marginTop: 10, marginBottom: 40, backgroundColor: '#27272A', borderRadius: 12 },
  logoutText: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold' }
});
