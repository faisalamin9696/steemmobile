import AnimatedLottieView from "lottie-react-native"
import { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

interface Props {
    width?: number;
    height?: number;
    loading: boolean;
    style?: StyleProp<ViewStyle>
}

const LottieLinearLoading = (props: Props) => {
    const { width, height, loading, style } = props;
    return <View>{useMemo(() => {
        return loading ? <AnimatedLottieView
            style={[{
                width: width || 100,
                height: height ||100,
                alignSelf: 'center',
            }, style]} loop autoPlay
            source={require('../../../assets/anim/' + 'linear_loading_anim.json')}
        /> : null
    }, [loading, width, height])}
    </View>
}

export { LottieLinearLoading }

