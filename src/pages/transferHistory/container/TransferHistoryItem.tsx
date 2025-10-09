import React, {useContext} from 'react';
import {vestToSteem} from '../../../steem/CondenserApis';
import {useAppSelector} from '../../../constants/AppFunctions';
import {HStack, VStack} from '@react-native-material/core';
import TimeAgoWrapper from '../../../components/wrappers/TimeAgoWrapper';
import {Button, Card, Text} from 'react-native-paper';
import {Icons} from '../../../components/Icons';
import {PreferencesContext} from '../../../contexts/ThemeContext';
import {MaterialDarkTheme, MaterialLightTheme} from '../../../utils/theme';
import ExpandableCard from '../../../components/basicComponents/ExpandableCard';
import {writeToClipboard} from '../../../utils/clipboard';

interface Props {
  op: AccountHistory;
  context: any;
  socialUrl?: any;
}
const TransferHistoryItem = (props: Props) => {
  let {op, context, socialUrl} = props;

  const steemGlobals = useAppSelector(state => state.steemGlobalReducer.value);
  const {isThemeDark} = useContext(PreferencesContext);
  // context -> account perspective

  const type = op.op[0];
  const data = op.op[1];

  const powerdown_vests =
    type === 'withdraw_vesting'
      ? vestToSteem(
          data.vesting_shares,
          steemGlobals.steem_per_share,
        )?.toLocaleString('en-US')
      : undefined;

  const reward_vests =
    type === 'claim_reward_balance'
      ? vestToSteem(
          data.reward_vests,
          steemGlobals.steem_per_share,
        )?.toLocaleString('en-US')
      : undefined;
  const curation_reward =
    type === 'curation_reward'
      ? vestToSteem(data.reward, steemGlobals.steem_per_share)?.toLocaleString(
          'en-US',
        )
      : undefined;
  const author_reward =
    type === 'author_reward'
      ? vestToSteem(
          data.vesting_payout,
          steemGlobals.steem_per_share,
        )?.toLocaleString('en-US')
      : undefined;
  const benefactor_reward =
    type === 'comment_benefactor_reward'
      ? vestToSteem(data.reward, steemGlobals.steem_per_share)?.toLocaleString(
          'en-US',
        )
      : undefined;

  /* All transfers involve up to 2 accounts, context and 1 other. */
  let message = '';

  const postLink = (socialUrl, author, permlink) => (
    <a href={`${socialUrl}/@${author}/${permlink}`} target="_blank">
      {author}/{permlink}
    </a>
  );

  if (type === 'transfer_to_vesting') {
    const amount = data.amount.split(' ')[0];

    if (data.from === context) {
      if (data.to === '') {
        message = `Transfer ${amount} to STEEM POWER`;
        // tt('g.transfer') + amount + tt('g.to') + 'STEEM POWER';
      } else {
        message = `Transfer ${amount} STEEM POWER to ${data.to}`;
        // tt('g.transfer') + amount + ' STEEM POWER' + tt('g.to');
      }
    } else if (data.to === context) {
      message = `Receive ${amount} STEEM POWER from `;

      // tt('g.receive') + amount + ' STEEM POWER' + tt('g.from');
    } else {
      message = ` Transfer ${amount} STEEM POWER from ${data.from} to ${data.to}`;
    }
  } else if (
    /^transfer$|^transfer_to_savings$|^transfer_from_savings$/.test(type)
  ) {
    // transfer_to_savings
    const fromWhere =
      type === 'transfer_to_savings'
        ? `Transfer to savings ${data.amount} to ${data.to}`
        : type === 'transfer_from_savings'
        ? `Transfer from savings ${data.amount} to  ${data.to}`
        : `Transfer ${data.amount} to  ${data.to}`;

    if (data.from === context) {
      // Semi-bad behavior - passing `type` to translation engine -- @todo better somehow?
      // type can be to_savings, from_savings, or not_savings
      // Also we can't pass React elements (link to other account) so its order is fixed :()
      message = fromWhere;
      // message = (
      //     <span>

      //         {data.request_id &&
      //             tt('transferhistoryrow_jsx.request_id', {
      //                 request_id: data.request_id,
      //             })}
      //     </span>
      // );
      // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.to');
    } else if (data.to === context) {
      const fromWhere =
        type === 'transfer_to_savings'
          ? `Receive from savings ${data.amount} from ${data.from}`
          : type === 'transfer_from_savings'
          ? `Transfer from savings ${data.amount} from ${data.from}`
          : `Received ${data.amount} from ${data.from}`;
      message = fromWhere;

      // message = (
      //     <span>
      //         {data.request_id &&
      //             tt('transferhistoryrow_jsx.request_id', {
      //                 request_id: data.request_id,
      //             })}
      //     </span>
      // );
      // tt('g.receive') + `${fromWhere} ${data.amount}` + tt('g.from');
    } else {
      // Removing the `from` link from this one -- only one user is linked anyways.
      const fromWhere =
        type === 'transfer_to_savings'
          ? `Transfer to savings ${data.amount} from ${data.from} to ${data.to}`
          : type === 'transfer_from_savings'
          ? `Transfer from savings ${data.amount} from ${data.from} to ${data.to}`
          : `Transfer ${data.amount} from ${data.from} to ${data.to}`;

      message = fromWhere;

      // message = (
      //     <span>

      //         {data.request_id &&
      //             ' ' +
      //             tt('transferhistoryrow_jsx.request_id', {
      //                 request_id: data.request_id,
      //             })}
      //     </span>
      // );
      // tt('g.transfer') + `${fromWhere} ${data.amount}` + tt('g.from');
    }
  } else if (type === 'cancel_transfer_from_savings') {
    message = `Cancel transfer from savings Request ID: ${data.request_id}`;
    // `${tt('transferhistoryrow_jsx.cancel_transfer_from_savings')} (${tt('g.request')} ${data.request_id})`;
  } else if (type === 'withdraw_vesting') {
    if (data.vesting_shares === '0.000000 VESTS') message = `Stop power down`;
    else message = `Start power down of ${powerdown_vests} STEEM`;

    // tt('transferhistoryrow_jsx.start_power_down_of') + ' ' + powerdown_vests + ' STEEM';
  } else if (type === 'curation_reward') {
    message = `${curation_reward} STEEM POWER for ${postLink(
      socialUrl,
      data.comment_author,
      data.comment_permlink,
    )}`;

    // `${curation_reward} TEEM POWER` + tt('g.for');
  } else if (type === 'author_reward') {
    let steem_payout = '';
    if (data.steem_payout !== '0.000 STEEM')
      steem_payout = ', ' + data.steem_payout;
    message = `${author_reward} ${steem_payout} and ${
      data.sbd_payout
    } STEEM POWER for ${postLink(socialUrl, data.author, data.permlink)}`;

    // `${data.sbd_payout}${steem_payout}, ${tt( 'g.and' )} ${author_reward} STEEM POWER ${tt('g.for')}`;
  } else if (type === 'claim_reward_balance') {
    const rewards: any[] = [];
    if (parseFloat(data.reward_steem.split(' ')[0]) > 0)
      rewards.push(data.reward_steem);
    if (parseFloat(data.reward_sbd.split(' ')[0]) > 0)
      rewards.push(data.reward_sbd);
    if (parseFloat(data.reward_vests.split(' ')[0]) > 0)
      rewards.push(`${reward_vests} STEEM POWER`);

    switch (rewards.length) {
      case 3:
        message = `Claim rewards: ${rewards[0]}, ${rewards[1]} and ${rewards[2]}`;
        break;
      case 2:
        message = `Claim rewards: ${rewards[0]} and ${rewards[1]}`;
        break;
      case 1:
        message = `Claim rewards:${rewards[0]}`;
        break;
    }
  } else if (type === 'interest') {
    message = `Receive interest of ${data.interest}`;
  } else if (type === 'fill_convert_request') {
    message = `Fill convert request: ${data.amount_in} for ${data.amount_out}`;
  } else if (type === 'fill_order') {
    if (data.open_owner == context) {
      // my order was filled by data.current_owner
      message = `Paid ${data.open_pays} for ${data.current_pays}`;
    } else {
      // data.open_owner filled my order
      message = `Paid ${data.open_pays} for ${data.current_pays}`;

      // `Paid ${data.current_pays} for ${ data.open_pays }`;
    }
  } else if (type === 'comment_benefactor_reward') {
    message = `${benefactor_reward} STEEM POWER for ${data.author}/${data.permlink}`;
  } else {
    message = JSON.stringify({type, ...data}, null, 2);
  }

  return (
    <ExpandableCard
      expandedChildren={
        data.memo ? (
          <VStack mt={10} spacing={6} items="start">
            <Text>{data.memo}</Text>
            <Button
              mode="elevated"
              compact
              onPress={() => {
                writeToClipboard(data.memo);
              }}
              labelStyle={{
                fontSize: 12,
                marginVertical: 2,
                marginHorizontal: 4,
              }}>
              COPY
            </Button>
          </VStack>
        ) : null
      }>
      <Card mode="contained">
        <Card.Content style={{paddingVertical: 6, paddingHorizontal: 10}}>
          <VStack spacing={6}>
            <Text variant="bodySmall" lineBreakMode="tail">
              {message}
            </Text>
            <HStack items="center" spacing={6}>
              <Icons.MaterialCommunityIcons
                size={18}
                name="clock"
                color={
                  isThemeDark
                    ? MaterialDarkTheme.colors.onSurface
                    : MaterialLightTheme.colors.onSurface
                }
              />
              <TimeAgoWrapper date={op.time * 1000} />
            </HStack>
          </VStack>
        </Card.Content>
      </Card>
    </ExpandableCard>
  );
};

export {TransferHistoryItem};
