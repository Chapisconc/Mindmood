import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';

export default function HistoryScreen() {
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
    if (mood === 'Neutral') return '😐';
    if (mood === 'Triste') return '😔';
    if (mood === 'Crisis') return '🆘';
    return '😐';
  };

  const renderItem = ({ item }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <Text style={styles.emoji}>{getEmoji(item.mood)}</Text>
      </View>
      <Text style={styles.entryText}>{item.text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>Tu bóveda de memorias está vacía.</Text>
          <Text style={styles.emptySub}>Empieza a escribir tu primer diario.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  loadingContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#0F172A' },
  list: { padding: 20 },
  entryCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 10 },
  date: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  emoji: { fontSize: 24 },
  entryText: { color: '#E2E8F0', fontSize: 16, lineHeight: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyEmoji: { fontSize: 60, marginBottom: 15 },
  emptyText: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  emptySub: { color: '#94A3B8', fontSize: 15, textAlign: 'center', marginTop: 10 }
});
