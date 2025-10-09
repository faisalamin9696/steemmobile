/* eslint react/prop-types: 0 */
import moment from 'moment';
import React from 'react';
import { View } from 'react-native';
import { Text, Tooltip } from 'react-native-paper';
import { getTimeFromNow } from '../../utils/time';

interface Props {
    date: number;
    textvariant?: any;
    withoutUtc?: boolean;
}

const TimeAgoWrapper = (props: Props) => (
    <View style={{ width: 'auto' }}>
        <Tooltip title={moment(props.date).format('lll') ?? getTimeFromNow(props.date, props.withoutUtc ?? false)}>
            <Text variant={props.textvariant ?? "bodySmall"}>{getTimeFromNow(props.date, props.withoutUtc ?? false)?.toLowerCase()}</Text>
        </Tooltip >
    </View>
    // const intervalIdRef = useRef<NodeJS.Timer | undefined>();

    // useEffect(() => {
    //     setTimeAgo(getTimeFromNow(date, withoutUtc ?? false));

    //     // return () => clearInterval(intervalIdRef.current);
    // }, [date])
    // Function to update the value in the Redux store
    // const updateReduxValue = () => {
    //     setTimeAgo(getTimeFromNow(date, withoutUtc ?? false));
    // };

    // Set up the interval to run the updateReduxValue function every 60 seconds
    // useEffect(() => {
    //     intervalIdRef.current = setInterval(updateReduxValue, 60000);
    //     return () => clearInterval(intervalIdRef.current);
    // }, []);





)

export default TimeAgoWrapper
