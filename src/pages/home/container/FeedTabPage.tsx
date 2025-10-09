import {getFeedBy} from '../../../steem/SteemApis';
import MainWrapper from '../../../components/wrappers/MainWrapper';
import React from 'react';
import TabFlatList from '../../../components/basicComponents/TabFlatList';
import {getItemFromStorage} from '../../../utils/realm';
import {AppStrings} from '../../../constants/AppStrings';
import TabFlatListHivemind from '../../../components/basicComponents/TabFlatListHivemind';

interface Props {
  navigation: any;
  route: any;
}

const FeedTabPage = (props: Props) => {
  const {navigation, route} = props;
  const {feed_api, route: parentRoute} = route.params;
  const parent = navigation?.getParent()?.getParent();

  const fetchData = async () => {
    const currentUser: AccountExt = getItemFromStorage(
      AppStrings.CURRENT_USER_SCHEMA,
    );
    const response = await getFeedBy(
      feed_api,
      undefined,
      currentUser?.name || 'null',
    );
    return response as Feed[];
  };

  const onScroll = ({nativeEvent}) => {
    if (parentRoute) {
      const currentScrollPosition =
        Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      if (parentRoute?.params?.isExtended !== currentScrollPosition <= 0)
        navigation
          ?.getParent()
          ?.setParams({isExtended: currentScrollPosition <= 0});
    }
  };
  return (
    <MainWrapper>
      <TabFlatList
        {...props}
        parentNav={parent}
        fetchData={fetchData}
        handleOnScroll={onScroll}
      />
    </MainWrapper>
  );
};

export {FeedTabPage};
