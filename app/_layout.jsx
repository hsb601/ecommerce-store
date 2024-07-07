import { Stack } from "expo-router";
import { Provider } from "react-redux";
import store from "./store/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
    <Stack>
      <Stack.Screen name="index" options={
        {
          title:"Ecommerce Store",
           headerTitleAlign:"center",
           headerTintColor:"#DC7633"
        }
      } />
      <Stack.Screen name="cart" options={
        {
          title:"Cart",
           headerTitleAlign:"center",
           headerTintColor:"#DC7633"
        }
      } />
    </Stack>
    </Provider>
  );
}
