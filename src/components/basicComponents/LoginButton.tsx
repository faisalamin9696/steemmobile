import { Button } from "react-native-paper"
import { AppRoutes } from "../../constants/AppRoutes";

interface Props {
    buttonText?: string;
    navigation: any;
}
const LoginButton = (props: Props) => {
    const { navigation, buttonText } = props;

    const navigate = () => {
        navigation?.push(AppRoutes.PAGES.LoginPage);
    }
    return <Button style={{ alignSelf: 'center', margin: 20 }} mode="contained" onPress={navigate}>{buttonText ?? 'Login to continue'}</Button>
}

export default LoginButton;