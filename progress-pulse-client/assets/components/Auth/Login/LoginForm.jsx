import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform, View, ActivityIndicator } from 'react-native';
// import { router } from 'expo-router'; // ← if you want to navigate after success

const PROD_URL = 'https://progresspulseapplication.onrender.com';
const DEV_URL  = Platform.select({
  web:     'http://localhost:5500',
  ios:     'http://localhost:5500',
  android: 'http://10.0.2.2:5500',
  default: 'http://192.168.137.1:5500',
});

const USE_PROD = true;

const BASE_URL = USE_PROD ? PROD_URL : DEV_URL;

export default function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    const alertFn = Platform.OS === 'web' ? window.alert : Alert.alert;

    if (!email || !password) {
      alertFn('Missing info', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const ct   = res.headers.get('content-type') || '';
      const body = ct.includes('application/json') ? await res.json() : await res.text();

      console.log('LOGIN status:', res.status);
      console.log('LOGIN body:', body);

      if (!res.ok) {
        const msg = typeof body === 'object' ? body?.message : body;
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const okMsg = typeof body === 'object' ? (body.message || 'Login successful') : 'Login successful';
      alertFn('Success', okMsg);

      // If server returns a token:
      // await AsyncStorage.setItem('token', body.token);
      // router.replace('/home'); // or any screen you want
    } catch (e) {
      alertFn('Login failed', String(e.message));
    } finally {
      setLoading(false);
    }
  }
  return (
        <>
          {/* שדה אימייל */}
          <TextInput
              placeholder="Email"
              placeholderTextColor="#CCCCCC"
              className="w-full bg-secondaryBg text-[#F4F4F4] px-4 py-3 rounded-xl mb-4 border border-[#000000]"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}                 // ← קשירה ל-state
              onChangeText={setEmail}       // ← עדכון state
          />

          {/* שדה סיסמה */}
          <TextInput
              placeholder="Password"
              placeholderTextColor="lightGray"
              secureTextEntry
              className="w-full bg-secondaryBg text-primaryText px-4 py-3 rounded-xl mb-6 border border-[#000000]"
              value={password}              // ← קשירה ל-state
              onChangeText={setPassword}    // ← עדכון state
          />

          {/* כפתור התחברות */}
          <TouchableOpacity
            className="w-full bg-action py-3 rounded-xl"
            onPress={handleLogin}         // ← קריאה לפונקציה
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