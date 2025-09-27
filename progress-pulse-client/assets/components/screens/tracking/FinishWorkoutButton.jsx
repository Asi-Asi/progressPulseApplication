import { View, Text, TouchableOpacity } from "react-native";

export default function FinishWorkoutButton({ disabled, onPress, bottomOffset }) {
    return (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: bottomOffset }}>
        <TouchableOpacity
            disabled={disabled}
            onPress={onPress}
            className={`h-12 rounded-xl items-center justify-center ${
            disabled ? "bg-card opacity-60" : "bg-primary"
            }`}
        >
            <Text className={`${disabled ? "text-muted" : "text-onPrimary font-extrabold"}`}>
            Finish Workout
            </Text>
        </TouchableOpacity>
        </View>
    );
}
