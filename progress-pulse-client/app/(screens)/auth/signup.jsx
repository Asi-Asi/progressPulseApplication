// app/(screens)/Signup.jsx
import React from "react";
import {
  ScrollView,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { Stack } from "expo-router";

import AppLogo from "../../../assets/components/ui/AppLogo";
import SignupHeader from "../../../assets/components/screens/Auth/Signup/SignupHeader";
import SignupForm from "../../../assets/components/screens/Auth/Signup/SignupForm";
import SignupFooter from "../../../assets/components/screens/Auth/Signup/SignupFooter";

export default function Signup() {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"} // adjusts layout based on platform
    >
        <ScrollView
          className="flex-1 bg-bg"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled" // allows form to work properly
        >
          <Stack.Screen
            options={{
              headerTitle: () => <AppLogo />,
              headerTitleAlign: "left",
              headerStyle: { backgroundColor: "#FDFBFA" },
            }}
          />
          <View className="flex-1 justify-center gap-6 px-6 py-8 bg-bg">
            <SignupHeader />
            <SignupForm />
            <SignupFooter />
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
