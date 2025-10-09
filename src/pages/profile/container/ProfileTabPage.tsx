import {useAppSelector} from '../../../constants/AppFunctions';
import {getFeedBy} from '../../../steem/SteemApis';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import TabFlatList from '../../../components/basicComponents/TabFlatList';

interface Props {
  navigation: any;
  route: any;
}

const ProfileTabPage = (props: Props) => {
  const {route} = props;
  const {feed_api, account} = route?.params || {
    feed_api: '',
    account: 'null',
    type: '',
  };
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const fetchData = async () => {
    const response = await getFeedBy(
      feed_api,
      account,
      loginInfo.name || 'null',
    );
    return response as Feed[];
  };
  return (
    <MainWrapper>
      <TabFlatList
        account={account}
        {...props}
        {...props}
        fetchData={fetchData}
      />
    </MainWrapper>
  );
};

export {ProfileTabPage};
