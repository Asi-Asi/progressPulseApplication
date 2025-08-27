// assets/components/Auth/Signup/SignupForm.jsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const PROD_URL = 'https://progresspulseapplication.onrender.com';
const DEV_URL  = Platform.select({
  web:     'http://localhost:5500',
  ios:     'http://localhost:5500',
  android: 'http://10.0.2.2:5500',
  default: 'http://192.168.137.1:5500',
});

// החלף ל-true כשאתה רוצה לעבוד מול Render
const USE_PROD = true;

const BASE_URL = USE_PROD ? PROD_URL : DEV_URL;

export default function   SignupForm({ onSubmit }) {
  const [firstName, setFirstName]   = useState('');       
  const [lastName, setLastName]     = useState('');        
  const [birthDate, setBirthDate]   = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);     
  const [sex, setSex]               = useState('');        
  const [phone, setPhone]           = useState('');        
  const [email, setEmail]           = useState('');        
  const [password, setPassword]     = useState('');        
  const [loading, setLoading]       = useState(false);     

  const handleSignup = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if ((password || "").length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_HOST}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim(),
          email,
          password,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.status === 201) {
        Alert.alert("Success", "Registration successful! You can log in now.");
        // Optional: router.push("/");
      } else if (res.status === 409) {
        Alert.alert("Email already registered", "Try logging in instead.");
      } else {
        Alert.alert("Signup failed", data?.message || "Please check your details.");
      }
    } catch (e) {
      setLoading(false);
      console.error("Signup error:", e);
      Alert.alert("Error", "Unable to reach the server.");
    }
  };

  const field = {
    backgroundColor: "#2B2B2B",
    color: "#FFFFFF",
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 14,
  };

  return (
    <View style={{ width: "100%" }}>
      {/* Keep only the fields you need visually; styling matches Login */}
      <TextInput
        style={field}
        placeholder="First name"
        placeholderTextColor="#9CA3AF"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        value={lastName} onChangeText={setLastName}
        placeholder="Last Name" placeholderTextColor="#AAAAAA"
        autoCapitalize="words" textContentType="familyName"
        className="bg-secondaryBg text-primaryText p-4 rounded-xl mb-4"
      />

      
      {/* Sex (Male/Female) */}
      <View className="flex-row gap-3 mb-4">
        {/* Male */}
        <TouchableOpacity
          onPress={() => setSex('male')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityState={{ selected: sex === 'male' }}
          className={`relative flex-1 items-center justify-center p-4 rounded-2xl border
            ${sex === 'male'
              ? 'bg-secondaryBg border-[#FFD100] shadow-2xl'
              : 'bg-secondaryBg border-[#333533] opacity-80'}`}
          disabled={loading}
        >
          {sex === 'male' && (
          <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FFD100]" />
          )}
          <Text className={`font-bold ${sex === 'male' ? 'text-[#FFD100]' : 'text-primaryText'}`}>
            Male
          </Text>
        </TouchableOpacity>

        {/* Female */}
        <TouchableOpacity
          onPress={() => setSex('female')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityState={{ selected: sex === 'female' }}
          className={`relative flex-1 items-center justify-center p-4 rounded-2xl border
            ${sex === 'female'
              ? 'bg-secondaryBg border-[#FFD100] shadow-2xl'
              : 'bg-secondaryBg border-[#333533] opacity-80'}`}
          disabled={loading}
        >
          {sex === 'female' && (
            <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#FFD100]" />
          )}
          <Text className={`font-bold ${sex === 'female' ? 'text-[#FFD100]' : 'text-primaryText'}`}>
            Female
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phone */}
      <TextInput
        style={field}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={field}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        style={{
          backgroundColor: "#FF5A2C",
          height: 50,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 8,
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

