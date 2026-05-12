import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function StreakModal({ visible, streak, onClose }) {
  const { themeStyles } = useTheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: themeStyles.card }]}>
          <View style={styles.fireContainer}>
            <View style={styles.outerGlow}>
              <View style={styles.innerGlow}>
                <Ionicons name="flame" size={80} color="#FF9500" />
              </View>
            </View>
          </View>

          <Text style={[styles.title, { color: themeStyles.text }]}>¡Increíble Racha! 🚀</Text>
          <Text style={[styles.streakText, { color: '#FF9500' }]}>{streak} Días</Text>
          
          <Text style={[styles.description, { color: themeStyles.secondaryText }]}>
            Has mantenido tu bienestar como prioridad por {streak} días consecutivos. ¡Sigue así, tu mente te lo agradece!
          </Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FF9500' }]} 
            onPress={onClose}
          >
            <Text style={styles.buttonText}>¡Entendido!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modal: {
    width: width * 0.85,
    borderRadius: 35,
    padding: 30,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  fireContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  outerGlow: {
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  innerGlow: {
    padding: 15,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 5
  },
  streakText: {
    fontSize: 50,
    fontWeight: '900',
    marginBottom: 15
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800'
  }
});
