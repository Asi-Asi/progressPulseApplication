import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";

const API_HOST =
  process.env.EXPO_PUBLIC_API_BASE ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:5500"
    : Platform.OS === "ios"
    ? "http://127.0.0.1:5500"
    : "http://localhost:5500");

export default function SignupForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);

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
        style={field}
        placeholder="Last name"
        placeholderTextColor="#9CA3AF"
        value={lastName}
        onChangeText={setLastName}
      />
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

