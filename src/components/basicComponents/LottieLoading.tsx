import AnimatedLottieView from "lottie-react-native"
import { useMemo } from "react";
import { View } from "react-native";

interface Props {
    width?: number;
    height?: number;
    loading: boolean


}

const LottieLoading = (props: Props) => {
    const { width, height, loading } = props;
    return <View>{useMemo(() => {
        return loading ? <AnimatedLottieView
            style={{
                width: width || 80,
                height: height || 80,
                alignSelf: 'center',
            }} loop autoPlay
            source={require('../../../assets/anim/' + 'jumping_box_anim.json')}
        /> : null
    }, [loading, width, height])}
    </View>
}

export { LottieLoading }

