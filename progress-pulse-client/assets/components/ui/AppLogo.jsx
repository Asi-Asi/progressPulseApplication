import { Pressable } from "react-native";
import LogoSvg from "../../../assets/images/progress-logo.svg"; 
import { useRouter } from "expo-router";

export default function AppLogo({ width = 160, height = 40 , style }) {
    const router = useRouter();
    const onPress = () => router.replace("/MainPage");

    if (onPress) {
        return (
            <Pressable onPress={onPress} hitSlop={10} style={style}>
            <LogoSvg width={width} height={height} />
            </Pressable>
        );
    }
    return <LogoSvg width={width} height={height} style={style} />;

}
