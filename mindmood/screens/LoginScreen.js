import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen({ navigation }) {
  const { theme, themeStyles, toggleTheme, syncTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkRoleAndRedirect(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          checkRoleAndRedirect(session.user.id);
        }
      },
    );

    // Entry animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkRoleAndRedirect(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data?.role === "admin") {
        navigation.replace("AdminDashboard");
      } else {
        navigation.replace("Home");
      }
    } catch (e) {
      console.log("Role check fail:", e);
      navigation.replace("Home");
    }
  }

  const onPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert("Error", "Por favor llena todos los campos");
      return;
    }
    setLoading(true);
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      Alert.alert("Error de Inicio", error.message);
    } else if (user) {
      await supabase
        .from("profiles")
        .update({ theme: theme })
        .eq("id", user.id);
      await syncTheme();
    }
    setLoading(false);
  }

  const gradientColors = theme === 'dark'
    ? [themeStyles.background, '#0C0F1D', themeStyles.background]
    : [themeStyles.background, '#EEF0FF', themeStyles.background];

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
    header: { alignItems: "center", marginBottom: 36 },
    logoContainer: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: themeStyles.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 22,
      shadowColor: themeStyles.accent,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.45,
      shadowRadius: 28,
      elevation: 14,
    },
    logoText: {
      fontSize: 38,
      fontWeight: "900",
      color: themeStyles.text,
      letterSpacing: 1.5,
    },
    subtitle: {
      fontSize: 16,
      color: themeStyles.secondaryText,
      marginTop: 8,
      textAlign: "center",
      fontWeight: '600',
    },
    card: {
      backgroundColor: themeStyles.card,
      padding: 26,
      borderRadius: 28,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 28,
      elevation: 8,
      borderWidth: 1,
      borderColor: themeStyles.border,
    },
    label: {
      color: themeStyles.text,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 8,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeStyles.background,
      borderRadius: 18,
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: themeStyles.border,
      paddingHorizontal: 15,
    },
    input: { flex: 1, padding: 16, color: themeStyles.text, fontSize: 16 },
    buttonMain: {
      backgroundColor: themeStyles.accent,
      padding: 19,
      borderRadius: 18,
      alignItems: "center",
      marginTop: 12,
      shadowColor: themeStyles.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    buttonMainText: { color: "#FFF", fontWeight: "900", fontSize: 18, letterSpacing: 0.8 },
    registerLink: { marginTop: 30, alignItems: "center" },
    registerText: { color: themeStyles.secondaryText, fontSize: 15 },
    themeToggle: {
      position: "absolute",
      right: 0,
      top: 0,
      padding: 12,
      backgroundColor: themeStyles.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: themeStyles.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  });

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Animated.View style={[styles.header, { opacity: logoFade, transform: [{ scale: logoScale }] }]}>
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              <Ionicons
                name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                size={26}
                color={themeStyles.text}
              />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={52} color="#FFF" />
            </View>
            <Text style={styles.logoText}>MindMood</Text>
            <Text style={styles.subtitle}>Tu espacio seguro de salud mental</Text>
          </Animated.View>

          <Animated.View style={[{ opacity: cardFade, transform: [{ translateY: cardSlide }] }]}>
            <View style={styles.card}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={themeStyles.secondaryText}
                />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={themeStyles.secondaryText}
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={themeStyles.secondaryText}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={themeStyles.secondaryText}
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={themeStyles.secondaryText}
                  />
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={themeStyles.accent}
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.buttonMain}
                    onPress={signInWithEmail}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.buttonMainText}>Entrar</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerText}>
                ¿No tienes cuenta?{" "}
                <Text style={{ fontWeight: "900", color: themeStyles.accent }}>
                  Regístrate aquí
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
