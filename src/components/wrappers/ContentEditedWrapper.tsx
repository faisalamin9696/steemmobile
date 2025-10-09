/* eslint react/prop-types: 0 */
import moment from 'moment';
import React from 'react';
import { View } from 'react-native';
import { Text, Tooltip } from 'react-native-paper';

interface Props {
    createDate: number;
    updateDate: number;
    textvariant?: any;
}

const ContentEditedWrapper = (props: Props) => {

    let { createDate, updateDate, textvariant } = props;


    return (updateDate !== createDate ? <View>
        <Tooltip title={moment(updateDate).format('lll')}>
            <Text variant={textvariant ?? "bodySmall"}>(edited)</Text>
        </Tooltip>
    </View> : <></>)


}

export default ContentEditedWrapper
