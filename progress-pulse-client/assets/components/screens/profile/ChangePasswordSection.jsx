import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";

function Field({ label, children }) {
  return (
    <View className="mb-3">
      <Text className="text-muted mb-1">{label}</Text>
      {children}
    </View>
  );
}

export default function ChangePasswordSection({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    onChangePassword,
    changingPass,
}) {
    return (
        <View className="mt-4 bg-card rounded-xl border border-border p-4">
        <Text className="text-text font-extrabold mb-2">Change Password</Text>

        <Field label="Current password">
            <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Current password"
            placeholderTextColor="#667085"
            autoCapitalize="none"
            autoCorrect={false}
            // 🔒 Block AutoFill (iOS/Android)
            textContentType="oneTimeCode"
            autoComplete="off"
            importantForAutofill="no"
            contextMenuHidden
            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
            />
        </Field>

        <Field label="New password">
            <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="New password (min 6 chars)"
            placeholderTextColor="#667085"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="oneTimeCode"
            autoComplete="off"
            importantForAutofill="no"
            contextMenuHidden
            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
            />
        </Field>

        <Field label="Confirm new password">
            <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new password"
            placeholderTextColor="#667085"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="oneTimeCode"
            autoComplete="off"
            importantForAutofill="no"
            contextMenuHidden
            className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
            />
        </Field>

        <TouchableOpacity
            onPress={onChangePassword}
            disabled={changingPass}
            className="mt-2 px-4 h-11 rounded-lg bg-primary items-center justify-center"
        >
            <Text className="text-onPrimary font-extrabold">
            {changingPass ? "Updating…" : "Change password"}
            </Text>
        </TouchableOpacity>
        </View>
    );
}