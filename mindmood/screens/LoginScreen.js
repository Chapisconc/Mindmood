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
    ? ['#0B0F19', '#151B2B', '#0B0F19']
    : ['#F8FAFC', '#EEF2FF', '#F8FAFC'];

  const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 28 },
    header: { alignItems: "center", marginBottom: 40 },
    logoContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: themeStyles.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 2,
      borderColor: themeStyles.border,
      shadowColor: themeStyles.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 16,
    },
    logoIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: themeStyles.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    logoText: {
      fontSize: 32,
      fontWeight: "900",
      color: themeStyles.text,
      letterSpacing: -1,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: themeStyles.secondaryText,
      textAlign: "center",
      fontWeight: '600',
      maxWidth: 280,
    },
    card: {
      backgroundColor: themeStyles.card,
      padding: 30,
      borderRadius: 32,
      shadowColor: themeStyles.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 10,
      borderWidth: 1,
      borderColor: themeStyles.border,
    },
    label: {
      color: themeStyles.text,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 10,
      marginLeft: 6,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: themeStyles.background,
      borderRadius: 16,
      marginBottom: 18,
      borderWidth: 1.5,
      borderColor: themeStyles.border,
      paddingHorizontal: 16,
      paddingVertical: 4,
    },
    input: { flex: 1, padding: 14, color: themeStyles.text, fontSize: 16 },
    buttonMain: {
      padding: 20,
      borderRadius: 18,
      alignItems: "center",
      marginTop: 16,
      shadowColor: themeStyles.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    buttonMainText: { color: "#FFF", fontWeight: "900", fontSize: 17, letterSpacing: 0.5 },
    registerLink: { marginTop: 32, alignItems: "center" },
    registerText: { color: themeStyles.secondaryText, fontSize: 15 },
    themeToggle: {
      position: "absolute",
      right: 20,
      top: 20,
      padding: 12,
      backgroundColor: themeStyles.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: themeStyles.border,
      shadowColor: themeStyles.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 6,
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
                size={24}
                color={themeStyles.text}
              />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconWrapper}>
                <Ionicons name="heart" size={40} color="#FFF" />
              </View>
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
                  <LinearGradient
                    colors={themeStyles.accentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonMain}
                  >
                    <TouchableOpacity
                      onPress={signInWithEmail}
                      onPressIn={onPressIn}
                      onPressOut={onPressOut}
                      activeOpacity={0.9}
                      style={{ width: '100%', alignItems: 'center' }}
                    >
                      <Text style={styles.buttonMainText}>Entrar</Text>
                    </TouchableOpacity>
                  </LinearGradient>
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
