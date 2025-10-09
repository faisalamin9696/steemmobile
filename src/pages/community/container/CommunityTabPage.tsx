import {useAppSelector} from '../../../constants/AppFunctions';
import {getFeedBy} from '../../../steem/SteemApis';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import TabFlatList from '../../../components/basicComponents/TabFlatList';

interface Props {
  navigation: any;
  route: any;
}

const CommunityTabPage = (props: Props) => {
  const {navigation, route} = props;
  const {feed_api, type, category} = route?.params || {
    feed_api: '',
    account: 'null',
    type: '',
    category: '',
  };
  route.params.account = category;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const parent = navigation?.getParent().getParent();

  const fetchData = async () => {
    const response = await getFeedBy(
      feed_api,
      category,
      loginInfo.name || 'null',
    );
    return response as Feed[];
  };
  return (
    <MainWrapper>
      <TabFlatList
        {...props}
        account={category}
        parentNav={parent}
        fetchData={fetchData}
        isBlog
        isCommunity
      />
    </MainWrapper>
  );
};

export {CommunityTabPage};
