import React, {useEffect, useState} from 'react';
import {StyleSheet, TouchableOpacity, ViewStyle} from 'react-native';
import {HStack} from '@react-native-material/core';
import {Card, Divider, MD2Colors, Text} from 'react-native-paper';
import Icon, {Icons} from '../Icons';
import {StyleProp} from 'react-native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';

interface Props {
  tags: any[];
  onDragEnd?: (data: string[]) => void;
  onDelete?: (item: string) => void;
  isStatic?: boolean;
  width?: number;
  handleItemPress?: (item: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  disableDelete?: boolean;
}

const TagsFlatList = (props: Props) => {
  const {
    tags,
    onDragEnd,
    onDelete,
    isStatic,
    width,
    handleItemPress,
    containerStyle,
    disableDelete,
  } = props;

  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(tags);
  }, [tags]);

  const renderTagItem = (info: DragListRenderItemInfo<string>) => {
    const {item, onDragStart, onDragEnd, isActive} = info;

    return (
      <Card mode="contained" key={`${item}`}>
        <TouchableOpacity
          onPressIn={() => {
            if (!isStatic) onDragStart();
          }}
          onPressOut={onDragEnd}
          onPress={() => {
            if (handleItemPress && isStatic) {
              handleItemPress(item);
            }
          }}
          activeOpacity={isStatic ? 0.2 : 1}
          disabled={isStatic ? false : isActive}
          style={[
            styles.rowItem,
            {
              opacity: isStatic ? 1 : isActive ? 0.5 : 1,
              padding: 0,
              borderRadius: 20,
            },
          ]}>
          <HStack center style={styles.itemStyle}>
            <Text variant="bodySmall">{item}</Text>
            {isStatic ? null : (
              <TouchableOpacity
                disabled={disableDelete ?? false}
                onPress={() => {
                  if (onDelete) onDelete(item);
                }}>
                <Icon
                  type={Icons.MaterialCommunityIcons}
                  name={'close-circle'}
                  color={MD2Colors.red400}
                  style={{marginLeft: 10}}
                  size={18}
                />
              </TouchableOpacity>
            )}
          </HStack>
        </TouchableOpacity>
      </Card>
    );
  };

  async function onReordered(fromIndex: number, toIndex: number) {
    const copy = [...data]; // Don't modify react data in-place
    const removed = copy.splice(fromIndex, 1);

    copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
    setData(copy);
    onDragEnd && onDragEnd(copy ?? []);
  }

  return (
    <DragList
      horizontal
      keyboardShouldPersistTaps="always"
      data={data}
      style={{width: width ?? undefined}}
      keyExtractor={item => item}
      onReordered={onReordered}
      renderItem={renderTagItem}
      showsHorizontalScrollIndicator={false}
      containerStyle={[{marginTop: 5}, containerStyle]}
      ItemSeparatorComponent={() => <Divider leftInset />}
    />
  );
};

export default TagsFlatList;

const styles = StyleSheet.create({
  rowItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  itemStyle: {
    // backgroundColor: AppColors.CARD_COLOR,
    marginHorizontal: 4,
    padding: 4,
    borderRadius: 25,
  },
});
