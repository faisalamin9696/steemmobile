import {HStack, VStack} from '@react-native-material/core';
import BadgeAvatar from './BadgeAvatar';
import {Button, Card, Text} from 'react-native-paper';
import {View} from 'react-native';
import {Linking} from 'react-native';
import {Share} from 'react-native';
import {AppRoutes} from '../../constants/AppRoutes';

interface Props {
  navigation: any;
  item: {name: string; title: string; contact: string; contactType: string};
}
const AboutItem = (props: Props) => {
  const {navigation, item} = props;

  //   const hideButton = item.contactType === 'account';
  const hideButton = false;

  const handleContactClick = async () => {
    switch (item.contactType) {
      case 'mail':
        const mailtoLink = `mailto:${item.contact}`;
        Linking.openURL(mailtoLink);
        break;

      case 'url':
        Linking.openURL(item.contact);
        break;
      case 'account':
        navigation.push(AppRoutes.PAGES.ProfilePage, {
          account: item.name,
        });
        break;
      default:
        Share.share({message: item.contact});
        break;
    }
  };
  return (
    <Card style={{margin: 4}} mode="contained">
      <Card.Content style={{paddingHorizontal: 10, paddingVertical: 10}}>
        <VStack spacing={4}>
          <HStack fill items="center" spacing={10}>
            <View>
              <BadgeAvatar
                navigation={navigation}
                avatarSize={70}
                name={item.name}
              />
            </View>
            <VStack spacing={6} fill>
              <View>
                <Text variant="labelLarge">{item.name}</Text>

                <Text variant="labelSmall">{item.title}</Text>
              </View>
              <VStack>
                <Text lineBreakMode="clip" style={{fontStyle: 'italic'}}>
                  {item.contact}
                </Text>
              </VStack>
            </VStack>
            <Button
              uppercase
              labelStyle={{marginVertical: 2, fontSize: 12}}
              compact
              mode="contained"
              onPress={handleContactClick}
              style={{
                alignSelf: 'flex-end',
                display: hideButton ? 'none' : 'flex',
                position: 'absolute',
                right: 0,
                bottom: 30,
              }}>
              Contact
            </Button>
          </HStack>
        </VStack>
      </Card.Content>
    </Card>
  );
};

export default AboutItem;
