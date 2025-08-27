import React from "react";
import { View, Text } from "react-native";

export default function SignupHeader() {
  return (
    <View style={{ alignItems: "center", marginBottom: 8 }}>
      {/* same headline as Login */}
      <Text style={{ color: "#FFD100", fontSize: 28, fontWeight: "800" }}>
        Progress Pulse
      </Text>
    </View>
  );
}
