import { createSlice } from '@reduxjs/toolkit';
const initialState = {
  combinedList: [],
};
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
 
    setCombinedList: (state, action) => {
      state.combinedList = action.payload;
    },
  },
});
export const { setCombinedList } = userSlice.actions;
export default userSlice.reducer;