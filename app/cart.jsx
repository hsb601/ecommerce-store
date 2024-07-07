import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from "@react-navigation/native";
import { AntDesign, Fontisto } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { setCombinedList } from "./store/slices/userSlice";

const Cart = () => {
  const { toggle } = useRoute().params;
  const [counters, setCounters] = useState({});
  const dispatch = useDispatch();
  const combinedList = useSelector((state) => state.user.combinedList);

  useEffect(() => {
    const fetchData = async () => {
      const savedList = JSON.parse(await AsyncStorage.getItem("combinedList")) || [];
      dispatch(setCombinedList(savedList));
      const initialCounters = savedList.reduce((acc, item) => {
        acc[item.id] = item.quantity || 1;
        return acc;
      }, {});
      setCounters(initialCounters);
    };
    fetchData();
  }, [toggle]);

  const updateOfflineCart = async (id, newQuantity) => {
    try {
      const offlineCartString = await AsyncStorage.getItem("offlinecart");
      const offlineCart = offlineCartString ? JSON.parse(offlineCartString) : [];
      const itemIndex = offlineCart.findIndex(item => item.id === id);
      const updatedItem = combinedList.find(item => item.id === id);
      if (itemIndex !== -1) {
        offlineCart[itemIndex].quantity = newQuantity;
      } else if (updatedItem) {
        offlineCart.push({ ...updatedItem, quantity: newQuantity, totalPrice: newQuantity * updatedItem.price });
      }
      await AsyncStorage.setItem("offlinecart", JSON.stringify(offlineCart));
    } catch (error) {
      console.error("Error updating offline cart:", error);
    }
  };

  const updateQuantity = async (id, delta) => {
    setCounters(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
    const updatedData = combinedList.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, (counters[id] || 1) + delta);
        if (!toggle) updateOfflineCart(id, newQuantity);
        return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.price };
      }
      return item;
    });
    await AsyncStorage.setItem("combinedList", JSON.stringify(updatedData));
    dispatch(setCombinedList(updatedData));
  };

  const deleteData = async (id) => {
    const updatedData = combinedList.filter(item => item.id !== id);
    await AsyncStorage.setItem("combinedList", JSON.stringify(updatedData));
    dispatch(setCombinedList(updatedData));
  };

  return (
    <View>
      {combinedList && (
        <FlatList
          data={combinedList}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <View key={`${item.type}-${item.id}`} style={{ marginVertical: 10 }}>
              <View style={styles.Box2}>
                <Image
                  source={item.thumbnail && toggle ? { uri: item.thumbnail } : toggle ? require('../assets/images/image.png') : require('../assets/images/offline.png')}
                  resizeMode="contain"
                  style={{ width: 200, height: 200 }}
                />
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.Box2BoldText}>{item.title}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.Box2Text}>{item.category}</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.Box2Text, { color: toggle ? 'green' : 'red' }]}>{toggle ? 'Online mode' : 'Offline mode'}</Text>
                </View>
              </View>
              <View style={styles.Box4}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.incDecValue}>{counters[item.id] || item.quantity}</Text>
                  <TouchableOpacity style={styles.button} onPress={() => updateQuantity(item.id, -1)}>
                    <Fontisto name="minus-a" size={20} color="#3d3c41" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={() => updateQuantity(item.id, 1)}>
                    <Fontisto name="plus-a" size={20} color="#3d3c41" />
                  </TouchableOpacity>
                  <Text style={[styles.incDecValue, { marginLeft: 10, backgroundColor: '#efefef', borderRadius: 3 }]}>${(counters[item.id] || item.quantity) * item.price}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                  <TouchableOpacity style={styles.button2}>
                    <Text style={styles.BoxText}>BUY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button2} onPress={() => deleteData(item.id)}>
                    <Text style={styles.BoxText}>DELETE <AntDesign name="delete" size={16} color="#DC7633" /></Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Cart;

const styles = StyleSheet.create({
  BoxText: {
    fontSize: 14,
    color: '#DC7633',
    fontWeight: '500',
  },
  Box2Text: {
    fontSize: 10,
    color: 'slategray',
    fontWeight: '500',
  },
  Box2BoldText: {
    fontSize: 14,
    color: '#3d3c41',
    fontWeight: '500'
  },
  Box2: {
    paddingVertical: 15,
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#efefef',
    borderRadius: 1,
    flexWrap: 'wrap',
    gap: 4,
    padding: 5
  },
  Box4: {
    paddingBottom: 10,
    marginHorizontal: 20,
    backgroundColor: 'white',
    gap: 6,
    padding: 5
  },
  button: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#efefef',
    width: 50,
    height: 40,
    alignItems: 'center',
    padding: 9,
  },
  button2: {
    backgroundColor: '#F6DDCC',
    borderWidth: 1,
    borderColor: '#efefef',
    height: 40,
    alignItems: 'center',
    padding: 9,
  },
  incDecValue: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#efefef',
    width: 100,
    height: 40,
    fontSize: 17,
    fontWeight: '600',
    color: '#3d3c41',
    padding: 8,
  },
});
