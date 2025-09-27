import { useMemo } from "react";
import { View, Text, TextInput, Image, TouchableOpacity } from "react-native";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };
const roleLabel = (n) => (n === ROLES.ADMIN ? "admin" : n === ROLES.COACH ? "coach" : "trainee");

function Avatar({ displayName, avatarUrl }) {
    return (
        <View className="w-16 h-16 rounded-full bg-field border border-fieldBorder items-center justify-center overflow-hidden">
        {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="w-16 h-16" />
        ) : (
            <Text className="text-primary font-extrabold text-xl">
            {displayName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </Text>
        )}
        </View>
    );
}

function Field({ label, children }) {
    return (
        <View className="mb-3">
        <Text className="text-muted mb-1">{label}</Text>
        {children}
        </View>
    );
}

export default function UserInfoSection({
    user,
    roleLevel,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    onSave,
    saving,
    onOpenHistory,
}) {
    const displayName = useMemo(() => {
        const fn = (firstName || "").trim();
        const ln = (lastName || "").trim();
        const full = [fn, ln].filter(Boolean).join(" ");
        return full || email || "User";
    }, [firstName, lastName, email]);

    return (
        <View className="mt-4 bg-card rounded-xl border border-border p-4">
        <View className="flex-row items-center gap-3">
            <Avatar displayName={displayName} avatarUrl={user?.avatarUrl} />
            <View className="flex-1">
            <Text className="text-text font-bold text-lg">{displayName}</Text>
            <Text className="text-muted">{email || user?.email}</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-primary/90">
            <Text className="text-onPrimary font-extrabold text-xs">
                {roleLabel(roleLevel)}
            </Text>
            </View>
        </View>

        <View className="mt-4">
            <Field label="First name">
            <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#667085"
                autoCorrect={false}
                className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
            />
            </Field>

            <Field label="Last name">
            <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#667085"
                autoCorrect={false}
                className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
            />
            </Field>

            {/* Email (read-only) */}
            <Field label="Email (read-only)">
            <TextInput
                value={email}
                editable={false}
                selectTextOnFocus={false}
                placeholder="you@example.com"
                placeholderTextColor="#667085"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-field border border-fieldBorder text-text rounded-lg px-3 h-11 opacity-70"
            />
            </Field>

            <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
                onPress={onSave}
                disabled={saving}
                className="px-4 h-11 rounded-lg bg-primary items-center justify-center"
            >
                <Text className="text-onPrimary font-extrabold">
                {saving ? "Saving…" : "Save changes"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onOpenHistory}
                className="px-4 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
            >
                <Text className="text-text font-bold">Training history</Text>
            </TouchableOpacity>
            </View>
        </View>
    </View>
);
}
