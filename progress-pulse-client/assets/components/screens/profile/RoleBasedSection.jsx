import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ROLES = { ADMIN: 10, TRAINEE: 20, COACH: 30 };

export default function RoleBasedSection({
    roleLevel,
    // trainee
    joinCode,
    setJoinCode,
    onJoinWithCode,
    // coach
    coachCode,
    onCopyCode,
    onShareCode,
    onRegenerateCode,
    onOpenCoachDashboard,
    // admin
    onOpenAdminConsole,
    }) {
    const isTrainee = roleLevel === ROLES.TRAINEE;
    const isCoach = roleLevel === ROLES.COACH;
    const isAdmin = roleLevel === ROLES.ADMIN;

    return (
        <>
        {/* Trainee-only: Join a coach */}
        {isTrainee && (
            <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-2">Join a coach</Text>
            <Text className="text-muted mb-3">
                Enter the code your coach shared with you to send a join request.
            </Text>

            <View className="flex-row gap-2">
                <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="e.g. ABCD-234F"
                placeholderTextColor="#667085"
                autoCapitalize="characters"
                autoCorrect={false}
                className="flex-1 bg-field border border-fieldBorder text-text rounded-lg px-3 h-11"
                />
                <TouchableOpacity
                onPress={onJoinWithCode}
                className="px-4 h-11 rounded-lg bg-primary items-center justify-center"
                >
                <Text className="text-onPrimary font-extrabold">Send</Text>
                </TouchableOpacity>
            </View>
            </View>
        )}

        {/* Coach-only: Code panel + dashboard link */}
        {isCoach && (
            <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-2">Your coach code</Text>

            <View className="flex-row flex-wrap gap-2 items-stretch">
                <View className="flex-row items-center px-3 rounded-lg bg-field border border-fieldBorder h-11 flex-1">
                <Text numberOfLines={1} className="text-primary font-extrabold tracking-wider">
                    {coachCode ?? "—"}
                </Text>
                </View>

                <TouchableOpacity
                onPress={() => coachCode && onCopyCode?.(coachCode)}
                className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
                >
                <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="content-copy" size={16} color="#2C2C2C" />
                    <Text className="text-text font-bold">Copy</Text>
                </View>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={onShareCode}
                className="px-3 rounded-lg bg-field border border-fieldBorder h-11 items-center justify-center"
                >
                <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="share-variant" size={16} color="#2C2C2C" />
                    <Text className="text-text font-bold">Share</Text>
                </View>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={onRegenerateCode}
                className="px-3 rounded-lg bg-primary h-11 items-center justify-center"
                >
                <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons name="reload" size={16} color="#0B0F12" />
                    <Text className="text-onPrimary font-extrabold">New</Text>
                </View>
                </TouchableOpacity>
            </View>

            <Text className="text-muted mt-2 text-xs">
                Share this code with trainees. They’ll send you a join request using it.
            </Text>

            <View className="mt-4">
                <TouchableOpacity
                onPress={onOpenCoachDashboard}
                className="self-start px-4 h-11 rounded-lg bg-field border border-fieldBorder items-center justify-center"
                >
                <Text className="text-text font-bold">Open coach dashboard</Text>
                </TouchableOpacity>
            </View>
            </View>
        )}

        {/* Admin-only: Console link */}
        {isAdmin && (
            <View className="mt-4 bg-card rounded-xl border border-border p-4">
            <Text className="text-text font-extrabold mb-1">Admin</Text>
            <Text className="text-muted mb-3">Manage users, requests, and reports.</Text>
            <TouchableOpacity
                onPress={onOpenAdminConsole}
                className="self-start px-4 h-11 rounded-lg bg-primary items-center justify-center"
            >
                <Text className="text-onPrimary font-extrabold">Open admin console</Text>
            </TouchableOpacity>
            </View>
        )}
        </>
    );
}