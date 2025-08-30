// assets/components/Auth/Login/LoginForm.jsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ===== Base URL config (choose PROD or DEV) =====
const PC_LAN_IP = '192.168.137.1'; // IP של ה-PC כשבודקים על פלאפון אמיתי
const PROD_URL = 'https://progresspulseapplication.onrender.com';
const DEV_URL  = Platform.select({
  web:     'http://localhost:5500',   // דפדפן / Expo web
  ios:     'http://localhost:5500',   // iOS simulator
  android: 'http://10.0.2.2:5500',    // Android emulator
  default: `http://${PC_LAN_IP}:5500`,// פלאפון אמיתי על אותה רשת
});
const USE_PROD = true;                // שנה ל-false כשבודקים מקומי
const BASE_URL = USE_PROD ? PROD_URL : DEV_URL;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState('');     // אימייל
  const [password, setPassword] = useState('');     // סיסמה
  const [loading, setLoading]   = useState(false);  // מצב טעינה (לספינר)

  const alertFn = Platform.OS === 'web' ? window.alert : Alert.alert; // אלרט אחיד

  const handleLogin = async () => {
    if (!email || !password) {                       // ולידציה בסיסית
      alertFn('Error', 'Please fill in both fields');
      return;
    }

    try {
      setLoading(true);                              // הצג ספינר

      const res = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),         // ניקוי ו-lowercase
          password,
        }),
      });

      const ct   = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : {};

      if (!res.ok) {
        alertFn('Login Failed', data?.message || `HTTP ${res.status}`);
        return;
      }

      // שמירת טוקן/תפקיד
      await AsyncStorage.multiSet([
        ['token', data.token ?? ''],
        ['role',  data.role  ?? ''],
      ]);

      // ניתוב לפי תפקיד
      if (data.role === 'admin') {
        alertFn('Welcome Admin!', 'Redirecting to admin dashboard…');
        router.replace('/AdminPage');
      } else {
        alertFn('Login Successful!', `Welcome, ${data.user?.name || 'User'}!`);
        router.replace('/MainPage');
      }
    } catch (e) {
      console.error(e);
      alertFn('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);                           
    }
  };

  return (
    <>
      {/* אימייל */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#CCCCCC"
        value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address"
        className="w-full bg-secondaryBg text-[#F4F4F4] px-4 py-3 rounded-xl mb-4 border border-[#000000]"
        editable={!loading}                           
      />

      {/* סיסמה */}
      <TextInput
        placeholder="Password"
        placeholderTextColor="#CCCCCC"
        secureTextEntry
        value={password} onChangeText={setPassword}
        className="w-full bg-secondaryBg text-primaryText px-4 py-3 rounded-xl mb-6 border border-[#000000]"
        editable={!loading}
      />

      {/* כפתור התחברות + ספינר טעינה */}
      <TouchableOpacity
        className={`w-full py-3 rounded-xl ${loading ? 'bg-gray-600' : 'bg-action'}`}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-center text-primaryText font-bold text-base">
          {loading ? 'Logging in…' : 'Login'}
        </Text>
        {loading ? <ActivityIndicator style={{ marginTop: 10 }} /> : null}
      </TouchableOpacity>
    </>
  );
}
