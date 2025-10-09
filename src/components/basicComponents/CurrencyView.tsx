import { HStack, VStack } from "@react-native-material/core"
import React, { useEffect, useState } from "react";
import { Card, IconButton, Menu, Text, Tooltip } from "react-native-paper"
import { LayoutAnimation, View } from "react-native";
import ExpandableCard from "./ExpandableCard";
import { enableLayoutAnimations } from "react-native-reanimated";


interface Props {

    currencytitle: string;
    amount: number | string | React.ReactNode;
    amountSuffix?: string;
    amountPrefix?: string;
    expanadedView?: React.ReactNode;
    expanableHeight?: number;
    mt?: number;
    mb?: number;
    menuItems?: any;
    menuClick?: boolean;
    hideMenuButton?: boolean;
    disableMenu?: boolean;

}

const CurrencyView = (props: Props) => {

    const { currencytitle, amount, amountSuffix, amountPrefix,
        expanadedView, expanableHeight,
        mt, mb, menuItems, menuClick, hideMenuButton, disableMenu } = props;

    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);

    const closeMenu = () => setVisible(false);

    useEffect(() => {
        if (menuClick) {
            closeMenu()
        }

    }, [menuClick])

    return (
        <ExpandableCard rowStyle={{ marginTop: mt ?? 0, marginBottom: mb ?? 0 }}
            expandedChildren={
                expanadedView}>
            <VStack >
                <Card.Content
                    style={{
                        paddingHorizontal: 10,
                        paddingVertical: hideMenuButton ? 14 : 0
                    }}>

                    <HStack items={'center'} justify='between'>

                        <Text variant='labelMedium'>{currencytitle}</Text>
                        <HStack center>
                            {typeof (amount) === 'string' || typeof (amount) === 'number' ?
                                <View>
                                    <Tooltip title={amount?.toLocaleString('en-US')}>
                                        <Text variant="labelMedium" style={{ textAlign: 'right' }}
                                        > {amountPrefix && (amountPrefix + ' ')}{amount}{amountSuffix && (' ' + amountSuffix)}</Text>
                                    </Tooltip>
                                </View> :
                                amount
                            }

                            <Menu
                                anchorPosition='top'
                                contentStyle={{
                                    padding: 0, paddingHorizontal: 0,
                                    paddingVertical: 0
                                }}
                                visible={visible}
                                onDismiss={closeMenu}

                                anchor={!hideMenuButton && <IconButton disabled={disableMenu}
                                    icon="dots-vertical"
                                    onPress={() => {
                                        openMenu();
                                    }} />}>
                                {menuItems}

                            </Menu>

                        </HStack>

                    </HStack>


                </Card.Content>
            </VStack >
        </ExpandableCard>


    )
}

export default CurrencyView