import { useState } from 'react';
import { TextInput, TouchableOpacity, Text, Alert, Platform } from 'react-native';  
// import { router } from 'expo-router'; // ← if you want to navigate after success
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

const BASE_URL = USE_PROD ? PROD_URL : DEV_URL;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both fields");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/users/login`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
      email: email.trim().toLowerCase(), 
      password
      }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert('Login Failed', data?.message || 'Invalid credentials');
        return;
      }

      await AsyncStorage.multiSet([
        ['token', data.token ?? ''],
        ['role',  data.role  ?? ''],
      ]);

      // נווט לפי תפקיד
      if (data.role === 'admin') {
        Alert.alert('Welcome Admin!', 'Redirecting to admin dashboard…');
        router.replace('/AdminPage'); 
      } else {
        Alert.alert('Login Successful!', `Welcome, ${data.user?.name || 'User'}!`);
        router.replace('/MainPage');   
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false); 
    }
  };


  
  return (
    <>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#CCCCCC"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="w-full bg-secondaryBg text-[#F4F4F4] px-4 py-3 rounded-xl mb-4 border border-[#000000]"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="lightGray"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="w-full bg-secondaryBg text-primaryText px-4 py-3 rounded-xl mb-6 border border-[#000000]"
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className={`w-full py-3 rounded-xl ${loading ? "bg-gray-600" : "bg-action"}`}
      >
        <Text className="text-center text-primaryText font-bold text-base">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </>
  );
}
