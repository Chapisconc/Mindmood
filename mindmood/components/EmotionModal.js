import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmotionModal({
  visible,
  onClose,
  type,
  summary,
  distribution,
  primaryMood,
  navigation,
}) {
  const isCrisis = type === "crisis";

  const handleClose = () => {
    onClose();
    if (navigation) navigation.goBack();
  };

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const moodConfigs = {
    Excelente: { bg: "#064E3B", border: "#10B981", icon: "#10B981" },
    Feliz: { bg: "#1E1B4B", border: "#6366F1", icon: "#6366F1" },
    Sorpresa: { bg: "#083344", border: "#06B6D4", icon: "#06B6D4" },
    Neutral: { bg: "#0F172A", border: "#94A3B8", icon: "#94A3B8" },
    Enojo: { bg: "#431407", border: "#F97316", icon: "#F97316" },
    Miedo: { bg: "#1F2937", border: "#9CA3AF", icon: "#9CA3AF" },
    Triste: { bg: "#450A0A", border: "#F87171", icon: "#F87171" },
    Asco: { bg: "#1A2E05", border: "#84CC16", icon: "#84CC16" },
    Crisis: { bg: "#180808", border: "#EF4444", icon: "#EF4444" },
  };

  const currentConfig = moodConfigs[primaryMood] || moodConfigs["Neutral"];

  const renderDetectedEmotions = () => {
    if (!distribution) return null;

    const winner = primaryMood || Object.keys(distribution)[0];
    const others = Object.keys(distribution).filter((name) => name !== winner);

    return (
      <View style={styles.distributionContainer}>
        <View
          style={[
            styles.distBadge,
            {
              backgroundColor: currentConfig.border + "30",
              borderColor: currentConfig.border,
            },
          ]}
        >
          <Text style={[styles.distText, { color: "#FFF" }]}>✨ {winner}</Text>
        </View>
        <View style={styles.othersContainer}>
          {others.map((name) => (
            <View key={name} style={styles.distBadge}>
              <Text style={styles.distText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: currentConfig.bg,
              borderColor: currentConfig.border,
              borderWidth: 2,
            },
          ]}
        >
          {/* Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: currentConfig.icon,
                shadowColor: currentConfig.icon,
              },
            ]}
          >
            <Ionicons
              name={isCrisis ? "heart" : "sparkles"}
              size={36}
              color="#FFF"
            />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              isCrisis ? styles.crisisTitle : { color: "#FFF" },
            ]}
          >
            {isCrisis ? "No estás solo" : "Análisis Mental"}
          </Text>

          {/* Distribution */}
          {!isCrisis && renderDetectedEmotions()}

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: currentConfig.border }]}
          />

          {/* Message */}
          <Text style={styles.message}>
            {isCrisis
              ? "Hemos notado que estás pasando por un momento difícil. Por favor, considera hablar con alguien de confianza."
              : summary || "Tu reflexión ha sido guardada correctamente."}
          </Text>

          {/* Crisis Hotlines */}
          {isCrisis && (
            <View style={styles.hotlineContainer}>
              <TouchableOpacity
                style={styles.hotlineBtn}
                onPress={() => handleCall("075")}
              >
                <View style={styles.hotlineIcon}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </View>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineName}>Linea Cero Suicidios</Text>
                  <Text style={styles.hotlineNumber}>075</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hotlineBtn}
                onPress={() => handleCall("8009112000")}
              >
                <View style={styles.hotlineIcon}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </View>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineName}>Linea de la Vida</Text>
                  <Text style={styles.hotlineNumber}>800-911-2000</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.hotlineBtn}
                onPress={() => handleCall("5556030000")}
              >
                <View style={styles.hotlineIcon}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </View>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineName}>SAPTEL</Text>
                  <Text style={styles.hotlineNumber}>55-5603-0000</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity
            style={[
              styles.closeBtn,
              isCrisis ? styles.crisisCloseBtn : styles.normalCloseBtn,
            ]}
            onPress={handleClose}
          >
            <Text style={styles.closeBtnText}>
              {isCrisis ? "Entendido" : "Cerrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  card: {
    width: "100%",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  normalCard: {
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.2)",
  },
  crisisCard: {
    backgroundColor: "#180808",
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },

  // Icon
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  normalIcon: {
    backgroundColor: "#6366F1",
    shadowColor: "#6366F1",
  },
  crisisIcon: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  normalTitle: {
    color: "#FFF",
  },
  crisisTitle: {
    color: "#FCA5A5",
  },

  // Distribution
  distributionContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  othersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  distBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  primaryBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "rgba(99, 102, 241, 0.4)",
  },
  distText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  primaryText: {
    color: "#818CF8",
  },

  // Divider
  divider: {
    width: 60,
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
  },
  normalDivider: {
    backgroundColor: "#6366F1",
  },
  crisisDivider: {
    backgroundColor: "#EF4444",
  },

  // Message
  message: {
    fontSize: 17,
    color: "#E2E8F0",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "600",
    marginBottom: 30,
    paddingHorizontal: 5,
  },

  // Hotlines
  hotlineContainer: {
    width: "100%",
    marginBottom: 25,
    gap: 12,
  },
  hotlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  hotlineIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
  hotlineNumber: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },

  // Close Button
  closeBtn: {
    width: "100%",
    padding: 20,
    borderRadius: 22,
    alignItems: "center",
  },
  normalCloseBtn: {
    backgroundColor: "#6366F1",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  crisisCloseBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
