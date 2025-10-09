import {getFeedBy} from '../../../steem/SteemApis';
import TabFlatList from '../../../components/basicComponents/TabFlatList';
import {useAppSelector} from '../../../constants/AppFunctions';

interface Props {
  navigation: any;
  route: any;
}

const AccountTabPage = (props: Props) => {
  const {navigation, route} = props;
  const {feed_api, isAccount} = route.params;
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  const fetchData = async () => {
    const response = await getFeedBy(
      feed_api,
      loginInfo?.name,
      loginInfo?.name || 'null',
    );
    return response as Feed[];
  };
  return (
    <TabFlatList
      fetchData={fetchData}
      navigation={navigation}
      route={route}
      account={loginInfo?.name}
    />
  );
};

export {AccountTabPage};
