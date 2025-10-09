import {useAppSelector} from '../../../constants/AppFunctions';
import {getFeedBy} from '../../../steem/SteemApis';
import TabFlatList from '../../../components/basicComponents/TabFlatList';

interface Props {
  navigation: any;
  route: any;
}

const CategoryTabPage = (props: Props) => {
  const {route} = props;
  const {feed_api, category} = route?.params || {
    feed_api: '',
    account: 'null',
    type: '',
    category: '',
  };
  route.params.account = category;
  const loginInfo = useAppSelector(state => state.loginReducer.value);

  const fetchData = async () => {
    const response = await getFeedBy(
      feed_api,
      category,
      loginInfo.name || 'null',
    );
    return response as Feed[];
  };
  return <TabFlatList {...props} fetchData={fetchData} isBlog isCommunity />;
};

export {CategoryTabPage};
