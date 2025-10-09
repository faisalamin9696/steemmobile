import {HStack, VStack} from '@react-native-material/core';
import {PureComponent, useEffect, useMemo, useState} from 'react';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  MD2Colors,
  Text,
} from 'react-native-paper';
import {Modal} from 'react-native';
import {useAppSelector} from '../../constants/AppFunctions';
import Slider from '@react-native-community/slider';
import Icon, {Icons} from '../Icons';
import {getVoteData} from '../../steem/SteemApis';
import {getItemFromStorage} from '../../utils/realm';

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setClear?: boolean;
  handleVote?: (weight: number) => void;
}

interface ItemProps {
  iconType: any;
  iconName: string;
  value: any;
  tooltip: string;
  setTooltip: any;
}

class ItemCard extends PureComponent<ItemProps> {
  render() {
    const {iconType, iconName, value, tooltip, setTooltip} = this.props;
    return (
      <Card
        mode="elevated"
        onPress={() => setTooltip(tooltip)}
        theme={{roundness: 2}}
        style={{
          marginRight: 10,
          width: 50,
          alignItems: 'center',
          height: 50,
          justifyContent: 'center',
        }}
        contentStyle={{marginHorizontal: 0, marginVertical: 0}}>
        <Card.Content style={{paddingHorizontal: 0, paddingVertical: 0}}>
          <VStack items="center" spacing={6}>
            <Icon
              {...this.props}
              type={iconType}
              name={iconName}
              color={MD2Colors.teal500}
              style={{}}
              size={15}
            />
            <Text variant="labelSmall">{value}</Text>
          </VStack>
        </Card.Content>
      </Card>
    );
  }
}

const VotingModal = (props: Props) => {
  const {visible, setVisible, setClear, handleVote} = props;
  const loginInfo = useAppSelector(state => state.loginReducer.value);
  const globalData = useAppSelector(state => state.steemGlobalReducer.value);
  const [tooltip, setTooltip] = useState('');
  const initialValue = getItemFromStorage('last_vote') ?? 100;

  const isDraft = false;
  const hideRewardDialog = () => setVisible(false);
  const [voteData, setVoteData] = useState<VoteData>();
  const [value, setValue] = useState(initialValue);

  const onUpvoteClick = () => {
    handleVote && handleVote(+value.toFixed(3));
    hideRewardDialog();
  };

  const onDownvoteClick = () => {
    handleVote && handleVote(-value.toFixed(3));
    hideRewardDialog();
  };

  useEffect(() => {
    if (setClear) {
    }
  }, [setClear]);

  useEffect(() => {
    const vData = getVoteData(loginInfo, globalData);
    setVoteData(vData);
  }, [loginInfo]);

  useEffect(() => {
    if (tooltip) {
      setTimeout(() => {
        setTooltip('');
      }, 1500);
    }
  }, [tooltip]);

  const sliderView = useMemo(() => {
    return (
      <HStack mt={10} items="center">
        <IconButton
          onPress={onUpvoteClick}
          icon={'chevron-up-circle-outline'}
          iconColor={MD2Colors.teal500}
        />

        <HStack items="center" style={{flex: 1}}>
          <Slider
            style={{flex: 0.8}}
            minimumValue={0}
            maximumValue={100}
            value={initialValue}
            step={1}
            minimumTrackTintColor={MD2Colors.green600}
            maximumTrackTintColor={MD2Colors.red400}
            onValueChange={setValue}
          />
          <Text style={{flex: 0.2}} variant="labelSmall">
            {value} %
          </Text>
        </HStack>

        <IconButton
          onPress={onDownvoteClick}
          icon={'chevron-down-circle-outline'}
          iconColor={MD2Colors.red400}
        />
      </HStack>
    );
  }, [value]);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onDismiss={hideRewardDialog}
      onRequestClose={hideRewardDialog}>
      <Dialog
        style={{opacity: 0.9}}
        theme={{
          roundness: 2,
          animation: {scale: 0, defaultAnimationDuration: 0},
        }}
        visible={visible}
        onDismiss={hideRewardDialog}>
        <VStack items="center">
          {useMemo(() => {
            return (
              tooltip && (
                <Button
                  icon={'information'}
                  labelStyle={{marginVertical: 1, fontSize: 12}}
                  mode="elevated"
                  style={{paddingHorizontal: 0}}>
                  {tooltip}
                </Button>
              )
            );
          }, [tooltip])}

          {useMemo(() => {
            return (
              voteData && (
                <HStack justify="between" spacing={10} mt={tooltip ? 10 : 0}>
                  <ItemCard
                    tooltip={'Voting power'}
                    iconType={Icons.FontAwesome}
                    iconName={'flash'}
                    value={voteData.voting_power.toFixed(2)}
                    setTooltip={setTooltip}
                  />
                  <ItemCard
                    tooltip={'Full vote value'}
                    iconType={Icons.FontAwesome}
                    iconName={'dollar'}
                    value={voteData.full_vote.toFixed(3)}
                    setTooltip={setTooltip}
                  />
                  <ItemCard
                    tooltip={'Current vote value'}
                    iconType={Icons.FontAwesome5}
                    iconName={'search-dollar'}
                    value={voteData.current_vote.toFixed(3)}
                    setTooltip={setTooltip}
                  />
                  <ItemCard
                    tooltip={'Resource credit'}
                    iconType={Icons.MaterialCommunityIcons}
                    iconName={'credit-card-check'}
                    value={voteData.resource_credit.toFixed(2)}
                    setTooltip={setTooltip}
                  />
                </HStack>
              )
            );
          }, [voteData, tooltip])}

          {sliderView}
        </VStack>
      </Dialog>
    </Modal>
  );
};

export default VotingModal;
