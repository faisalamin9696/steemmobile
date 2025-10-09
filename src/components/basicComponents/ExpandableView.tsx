import { useEffect, useState } from "react";
import { Animated,View, ViewStyle } from "react-native";

interface Props {
    children: React.ReactNode;
    expandedChildren?: React.ReactNode;
    maxHeight?: number;
    expanderStyle?: ViewStyle;
    visible: any;
    animDuration?: number;

}


const ExpandableView = (props: Props) => {
    const { children, maxHeight, expanderStyle, visible, animDuration } = props;
    const [viewHeight] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(viewHeight, {
            toValue: visible ? maxHeight || 200 : 0,
            duration: animDuration ?? 300,
            useNativeDriver: false
        }).start();
    }, [visible, viewHeight]);



    return (<View>

        <Animated.View style={{ height: viewHeight }}>
            {children}
        </Animated.View>
    </View>
    );
};

export default ExpandableView

