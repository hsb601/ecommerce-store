import { Text, View, StyleSheet, TouchableOpacity, FlatList, Image, Pressable, Modal } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { AntDesign, Fontisto, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import NetInfo from '@react-native-community/netinfo';
import { setCombinedList } from "./store/slices/userSlice";
import { useDispatch } from "react-redux";

export default function Index() {
  const [toggle, setToggle] = useState(true);
  const [data, setData] = useState(null);
  const [counters, setCounters] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const navigation = useNavigation();
  const [syncData, setSyncData] = useState(false)
  const [reload, setReload] = useState(false);
  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        setToggle(false);
        setButtonDisabled(true);
      } else {
        setToggle(true);
        setButtonDisabled(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('https://dummyjson.com/products');
      const products = response.data.products;
      await AsyncStorage.setItem("product", JSON.stringify(products));

      const storedData = await AsyncStorage.getItem("product");
      if (storedData) {
        setData(JSON.parse(storedData));
      }
      // Initialize counters
      const initialCounters = products.reduce((acc, product) => {
        acc[product.id] = 1; // Start with 1 for each product
        return acc;
      }, {});
      setCounters(initialCounters);
    } catch (error) {
      // alert(error);
      console.log(error)
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, reload]);

  const increment = (id) => {
    setCounters(prevCounters => ({
      ...prevCounters,
      [id]: prevCounters[id] + 1
    }));
  };

  const decrement = (id) => {
    setCounters(prevCounters => ({
      ...prevCounters,
      [id]: prevCounters[id] > 1 ? prevCounters[id] - 1 : 1
    }));
  };

  const online = async () => {
    setToggle(true);
  };

  const offline = () => {
    setToggle(false);
    setIsVisible(true);
  };

  const addToCart = async (item) => {
    try {
      const combinedListString = await AsyncStorage.getItem("combinedList");
      let combinedList = combinedListString ? JSON.parse(combinedListString) : [];
      const existingCombinedItem = combinedList.find(listItem => listItem.id === item.id);
  
      if (existingCombinedItem) {
        existingCombinedItem.quantity += counters[item.id];
        alert(`Existing cart product added product quantity increased`);
      } else {
        combinedList.push({
          ...item,
          quantity: counters[item.id],
        });
        alert(`Product added to cart`);
      }
  
      await AsyncStorage.setItem("combinedList", JSON.stringify(combinedList));
      const updatedCombinedList = JSON.parse(await AsyncStorage.getItem("combinedList"));
      dispatch(setCombinedList(updatedCombinedList));
  
      if (!toggle) {
        const offlineCartString = await AsyncStorage.getItem("offlinecart");
        let offlineCart = offlineCartString ? JSON.parse(offlineCartString) : [];
        const existingOfflineItem = offlineCart.find(cartItem => cartItem.id === item.id);
  
        if (existingOfflineItem) {
          existingOfflineItem.quantity += counters[item.id];
        } else {
          offlineCart.push({
            ...item,
            quantity: counters[item.id],
          });
        }
        await AsyncStorage.setItem("offlinecart", JSON.stringify(offlineCart));
        console.log(offlineCart)
        setSyncData(true);
      }
  
      if (toggle) {
        alert("Successfully uploaded data to backend");
        await AsyncStorage.removeItem("offlinecart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding to cart: " + error);
    }
  };
  

  const sync = async () => {
    try {
      const Cart = await AsyncStorage.getItem("offlinecart");
      const offlineCart = Cart ? JSON.parse(Cart) : [];
      // axios.post('https://dummyjson.com/offlineCart', {
      //   offlineCart
      // })
      // .then(function (response) {
      //   console.log(response);
      // })
      // .catch(function (error) {
      //   console.log(error);
      // });
      console.log(offlineCart)
      alert("Sync completed successfully");
      setSyncData(false)
    } catch (error) {
      console.log("Error during sync:", error);
      alert("Error during sync: " + error);
    }
  };
  useEffect(() => {
    const checkAndSyncCart = async () => {
      try {
        const offlinecart = await AsyncStorage.getItem("offlinecart");
        let cart = offlinecart ? JSON.parse(offlinecart) : false;
        if (toggle && cart) {
          await sync();
          setSyncData(false);
          await AsyncStorage.removeItem("offlinecart");
        }
      } catch (error) {
        console.error("Error retrieving or parsing offlinecart:", error);
      }
    };
    checkAndSyncCart();
  }, [toggle]);
  

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6DDCC" }}>
      <Modal animationType="slide" transparent={true} visible={isVisible}>
        <View style={styles.modalContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Are you sure switch to offline mode?</Text>
            <Pressable onPress={() => { setToggle(true); setIsVisible(false); }}>
              <MaterialIcons name="close" color="red" size={22} />
            </Pressable>
            <Pressable onPress={() => { setToggle(false); setIsVisible(false); }}>
              <MaterialCommunityIcons name="sticker-check-outline" size={24} color="green" />
            </Pressable>
          </View>
        </View>
      </Modal>
      <View style={styles.Box1}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.BoxBoldText}>Haseeb Javed</Text>
          <View style={[styles.dotround, toggle === false ? { backgroundColor: 'red' } : { backgroundColor: 'green' }]}></View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={styles.BoxText}>Modes: </Text>
          <TouchableOpacity style={{ flexDirection: 'row' }} onPress={online} disabled={buttonDisabled} >
            <Text style={[styles.BoxText, toggle === true ? { color: 'green' } : { color: 'grey' }]}>Online</Text>
            <View style={[styles.dotround, toggle === true && { backgroundColor: 'green' }]}></View>
          </TouchableOpacity>
          <TouchableOpacity style={{ flexDirection: 'row' }} onPress={offline}>
            <Text style={[styles.BoxText, toggle === false ? { color: 'red' } : { color: 'grey' }]}>Offline</Text>
            <View style={[styles.dotround, toggle === false && { backgroundColor: 'red' }]}></View>
          </TouchableOpacity>
          {toggle && syncData && (
            <TouchableOpacity style={{ flexDirection: 'row' }} onPress={sync}>
              <Text style={styles.BoxText}>Sync offline data  </Text>
              <AntDesign name="sync" size={16} color="#DC7633" />
            </TouchableOpacity>
          )}
        </View>
        <View>
          <TouchableOpacity style={styles.button2} onPress={() => { navigation.navigate("cart", { toggle }), setReload(!reload) }}>
            <Text style={styles.BoxText}>Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
      {
        data && (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View key={item.id} style={{ marginBottom: 10 }}>
                <View style={styles.Box2}>
                  <Image source={{ uri: item.thumbnail }} resizeMode="contain" style={{ width: 200, height: 200 }} />
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.Box2BoldText}>{item.title}</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.Box2Text}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.Box4}>
                  <Text style={styles.Box2Text}>Quantity</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text style={styles.incDecValue}>{counters[item.id]}</Text>
                    <TouchableOpacity style={styles.button} onPress={() => decrement(item.id)}>
                      <Fontisto name="minus-a" size={20} color="#3d3c41" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => increment(item.id)}>
                      <Fontisto name="plus-a" size={20} color="#3d3c41" />
                    </TouchableOpacity>
                    <Text style={[styles.incDecValue, { marginLeft: 10, backgroundColor: '#efefef', borderRadius: 3 }]}>${item.price * counters[item.id]}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
                    <TouchableOpacity style={styles.button2} onPress={() => { addToCart(item), setReload(!reload) }}>
                      <Text style={[styles.BoxText]}>ADD TO CART</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button2}>
                      <Text style={[styles.BoxText]}>ORDER</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )
      }
    </View >

  );
}

const styles = StyleSheet.create({
  Box: {
    paddingVertical: 10,
    marginHorizontal: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  BoxText: {
    fontSize: 14,
    color: '#DC7633',
    fontWeight: '500',
  },
  BoxBoldText: {
    fontSize: 16,
    color: '#DC7633',
  },
  BoxParaText: {
    fontSize: 14,
    color: 'white',
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
  Box1: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#efefef',
    flexWrap: 'wrap',
    gap: 4,
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
  Box3: {
    backgroundColor: 'white',
    width: '31%',
    paddingVertical: 5
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
  dotround: {
    backgroundColor: 'grey',
    borderRadius: 5,
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    marginHorizontal: 10,
  },
  dotroundred: {
    backgroundColor: 'red',
    borderRadius: 7.5,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9fceb4',
    margin: 5,
    marginHorizontal: 10,
  },
  modalContent: {
    height: '25%',
    width: '100%',
    backgroundColor: '#25292e',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    position: 'absolute',
    bottom: 0,
  },
  titleContainer: {
    height: '16%',
    backgroundColor: '#464C55',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
});
