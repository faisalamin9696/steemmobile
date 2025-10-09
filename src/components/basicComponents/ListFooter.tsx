import { HStack } from "@react-native-material/core"
import { ActivityIndicator } from "react-native-paper"


interface Props {
    marginTop?: number;
    marginBottom?: number;
    loading: boolean;

}
const ListFooter = (props: Props) => {
    const { marginTop, marginBottom, loading } = props;



    return (<>{loading && <HStack center mt={marginTop ?? 10} mb={marginBottom ?? 0}>
        <ActivityIndicator size={20} />
    </HStack>}
    </>)
}

export default ListFooter