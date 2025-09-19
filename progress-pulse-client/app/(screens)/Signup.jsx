// app/(screens)/Signup.jsx
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";

import AppLogo from "../../assets/components/ui/AppLogo";

import SignupHeader from "../../assets/components/screens/Auth/Signup/SignupHeader";
import SignupForm from "../../assets/components/screens/Auth/Signup/SignupForm";
import SignupFooter from "../../assets/components/screens/Auth/Signup/SignupFooter";

export default function Signup() {
  return (
    <ScrollView
      className="flex-1 bg-bg"                
      contentContainerClassName="flex-grow"  // ← NativeWind v4+ supports this; use it if available
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
  );
}


