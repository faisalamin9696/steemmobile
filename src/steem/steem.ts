import {DiscussionQueryCategory} from '@steempro/dsteem';
import {client} from './CondenserApis';

export const getActiveFeed = async (
  category: DiscussionQueryCategory,
  observer: string = 'null',
  start_author?: string,
  start_permlink?: string,
  limit: number = 10,
): Promise<PostHivemind[]> => {
  try {
    if (!category) {
      throw new Error('Invalid request');
    }
    const response = await client.call('bridge', 'get_ranked_posts', {
      sort: category,
      tag: '',
      observer: observer,
      limit,
      start_permlink,
      start_author,
    });
    if (response) {
      console.log(1122, response);
      return response as PostHivemind[];
    } else {
      throw new Error(response);
    }
  } catch (error: any) {
    // log and re-throw any errors that occur
    console.error('Failed to fetch data:', error);
    throw new Error(error);
  }
};
