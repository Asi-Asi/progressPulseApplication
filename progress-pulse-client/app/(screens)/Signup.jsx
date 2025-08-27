// app/(screens)/Signup.jsx
import React from "react";
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";

import SignupHeader from "../../assets/components/Auth/Signup/SignupHeader";
import SignupForm from "../../assets/components/Auth/Signup/SignupForm";
import SignupFooter from "../../assets/components/Auth/Signup/SignupFooter";

export default function Signup() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1E1E1E" }}>
      <Stack.Screen
        options={{
          title: "Login", // keep header style identical to login
          headerStyle: { backgroundColor: "#1E1E1E" },
          headerTintColor: "#FFD100",
          headerTitleStyle: { fontWeight: "bold", fontSize: 26 },
        }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          gap: 24,
          paddingHorizontal: 24,
          paddingVertical: 32,
          backgroundColor: "#1E1E1E",
        }}
      >
        <SignupHeader />
        <SignupForm />
        <SignupFooter />
      </View>
    </ScrollView>
  );
}


