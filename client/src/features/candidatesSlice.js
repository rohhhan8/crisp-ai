import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allCandidates: [],
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action) => {
      state.allCandidates.push(action.payload);
    },
  },
});

export const { addCandidate } = candidatesSlice.actions;
export default candidatesSlice.reducer;
