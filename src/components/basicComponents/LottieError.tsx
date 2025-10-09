import { VStack } from "@react-native-material/core";
import AnimatedLottieView from "lottie-react-native"
import { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Button, Card, Text } from "react-native-paper";

interface Props {
    width?: number;
    height?: number;
    loading?: boolean;
    error?: string;
    onTryAgain?: () => void;
    buttonText?: string;
    empty?: boolean;
    style?: StyleProp<ViewStyle>;
}

const LottieError = (props: Props) => {
    const { width, height, error, onTryAgain, buttonText, empty, style } = props;

    return <View style={style}>{useMemo(() => {
        return <VStack items={'center'} spacing={10}>
            <View>
                <AnimatedLottieView
                    style={{
                        width: width || 120,
                        height: height || 120,
                        alignSelf: 'center',
                    }} loop autoPlay
                    source={require('../../../assets/anim/' + 'error_cross_anim.json')}
                />
            </View>
            <View>
                {error && <Card style={{ margin: 2, maxWidth: 350 }}>
                    <Card.Content>
                        <VStack>
                            <Text lineBreakMode='clip'
                                numberOfLines={3}>{error}</Text>
                        </VStack>

                    </Card.Content>
                </Card>}
            </View>
            {empty ? null : <Button
                mode="text"
                onPress={onTryAgain}>{buttonText ?? 'Try Again'}</Button>}


        </VStack>
    }, [width, height])}
    </View>
}

export default LottieError

