import { HStack } from "@react-native-material/core"
import { TouchableOpacity, View } from "react-native"
import { Text, Tooltip } from "react-native-paper"
import { isAccountCommunity } from "../../utils/CommunityValidation";
import { AppRoutes } from "../../constants/AppRoutes";

interface Props {
    navigation: any;
    route: any;
    comment: Post | Feed;
}
const CommunityWrapper = (props: Props) => {
    const { navigation, route, comment } = props;


    const handleTagClick = (category: string, community: string) => {
        if (category || community) {
            const name = isAccountCommunity(category) ? AppRoutes.PAGES.CommunityPage : AppRoutes.PAGES.CategoryPage;
            navigation.push(name, {
                category,
                community,
            });

        }
    }

    return (<HStack spacing={4}>
        <Text variant="bodySmall">In</Text>
        <View>
            <Tooltip title={comment?.community ? `${comment?.community}/${comment?.category}` : comment?.category ?? ''}>
                <TouchableOpacity onPress={() => handleTagClick(comment?.category, comment?.community)}>
                    <View>
                        <Text numberOfLines={1} style={{ fontWeight: '700' }}
                            variant={'bodySmall'}>{comment?.community || comment?.category}</Text>
                    </View>
                </TouchableOpacity>
            </Tooltip>
        </View>

    </HStack>)
}

export default CommunityWrapper