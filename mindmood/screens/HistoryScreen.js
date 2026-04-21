import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { themeStyles } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: themeStyles.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: themeStyles.background },
    list: { padding: 20, paddingBottom: 100 },
    entryCard: { backgroundColor: themeStyles.card, padding: 22, borderRadius: 28, marginBottom: 18, borderWidth: 1, borderColor: themeStyles.border, shadowColor: '#000', shadowOffset: {width:0, height:6}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: themeStyles.border + '30' },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    date: { color: themeStyles.secondaryText, fontSize: 13, fontWeight: '800', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    emoji: { fontSize: 32 },
    entryText: { color: themeStyles.text, fontSize: 17, lineHeight: 28, fontWeight: '500', letterSpacing: 0.2 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyEmoji: { fontSize: 72, marginBottom: 24 },
    emptyText: { color: themeStyles.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
    emptySub: { color: themeStyles.secondaryText, fontSize: 16, textAlign: 'center', marginTop: 12, fontWeight: '600', lineHeight: 24 }
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getEmoji = (mood) => {
    if (mood === 'Excelente') return '🤩';
    if (mood === 'Feliz') return '😊';
    if (mood === 'Agradecido') return '🙏';
    if (mood === 'Sorpresa') return '😲';
    if (mood === 'Neutral') return '😐';
    if (mood === 'Enojo') return '😠';
    if (mood === 'Ansiedad') return '😰';
    if (mood === 'Miedo') return '😨';
    if (mood === 'Triste') return '😔';
    if (mood === 'Crisis') return '🆘';
    return '😐';
  };

  const renderItem = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={themeStyles.secondaryText} />
          <Text style={styles.date}>{new Date(item.recorded_at || item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <Text style={styles.emoji}>{getEmoji(item.mood)}</Text>
      </View>
      <Text style={styles.entryText}>{item.text}</Text>
    </View>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeStyles.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>Bóveda vacía</Text>
          <Text style={styles.emptySub}>Tus reflexiones guardadas aparecerán aquí.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
