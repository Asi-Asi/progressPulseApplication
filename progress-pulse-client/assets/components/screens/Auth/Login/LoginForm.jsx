// assets/components/Auth/Login/LoginForm.jsx
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const PROD_URL = 'https://progresspulseapplication.onrender.com';
const DEV_URL  = Platform.select({
  web:     'http://localhost:5500',
  ios:     'http://localhost:5500',
  android: 'http://10.0.2.2:5500',
  default: 'http://192.168.137.1:5500',
});

const USE_PROD = true;

const BASE_URL = USE_PROD ;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState('');     // אימייל
  const [password, setPassword] = useState('');     // סיסמה
  const [loading, setLoading]   = useState(false);  // מצב טעינה (לספינר)

  const alertFn = (title, msg = '') => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${msg}`);
    } else {
      // רינדור בצד שרת – לא להשתמש ב-window
      console.warn('alert (SSR):', title, msg);
    }
  } else {
    Alert.alert(title, msg);
  }
};

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
      {/* Email */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#667085" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="w-full px-4 py-3 rounded-xl mb-4 bg-field border border-fieldBorder text-text"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#667085"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="w-full px-4 py-3 rounded-xl mb-6 bg-field border border-fieldBorder text-text"
      />

      {/* Button + Spinner */}
      <TouchableOpacity
        className="w-full py-3 rounded-xl bg-primary disabled:opacity-60 active:opacity-90"
        onPress={handleLogin}
        disabled={loading}
        accessibilityState={{ disabled: loading }}
      >
        <Text className="text-center text-white font-bold text-base">
          {loading ? "Logging in…" : "Login"}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 10 }} color={"#FFFFFF"} />
        ) : null}
      </TouchableOpacity>
    </>
  );
}
