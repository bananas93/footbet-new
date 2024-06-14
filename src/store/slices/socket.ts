import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  message: string;
}

const initialState: SocketState = {
  message: '',
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    setMatchUpdated: (state, action: PayloadAction<any>) => {
      state.message = `Match ${action.payload.matchId} has been updated`;
    },
  },
});

export const { setMessage, setMatchUpdated } = socketSlice.actions;

export default socketSlice.reducer;
