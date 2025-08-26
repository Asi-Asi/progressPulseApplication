import { useState } from "react";
import { TextInput, TouchableOpacity, Text, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_HOST =
  Platform.OS === "android" ? "http://10.0.2.2:5500" :
  Platform.OS === "ios"     ? "http://127.0.0.1:5500" :
                               "http://localhost:5500";



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
          const response = await fetch(`${API_HOST}/api/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await response.json();
          setLoading(false);
    
          if (!response.ok) {
            Alert.alert("Login Failed", data?.message || "Invalid credentials");
            return;
          }
    
          // Trust the server: use the role it returns
          await AsyncStorage.setItem("token", data.token ?? "");
          await AsyncStorage.setItem("role", data.role ?? "");
    
          if (data.role === "admin") {
            Alert.alert("Welcome Admin!", "Redirecting to admin dashboard...");
            router.push("/AdminPage");
          } else {
            Alert.alert("Login Successful!", `Welcome, ${data.user?.name || "User"}!`);
            router.push("/MainPage");
          }
        } catch (error) {
          setLoading(false);
          Alert.alert("Error", "Something went wrong. Please try again later.");
          console.error(error);
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
