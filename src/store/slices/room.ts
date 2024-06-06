import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers';
import { AxiosResponse } from 'axios';
import { IRoom, IHttpRequestResult } from 'interfaces';

interface ICreateRoomPayload {
  name: string;
  type: 'public' | 'private';
  password?: string;
}

export const getRooms = createAsyncThunk('room/getRooms', async () => {
  const response: AxiosResponse<IRoom[]> = await http.api.get(`/room`);
  return response.data;
});

export const getOneRoom = createAsyncThunk('room/getOneRoom', async (id: number) => {
  const response: AxiosResponse<IRoom> = await http.api.get(`/room/${id}`);
  return response.data;
});

export const createRoom = createAsyncThunk('room/createRoom', async (room: ICreateRoomPayload, thunkAPI) => {
  await http.api.post(`/room`, room);
  await thunkAPI.dispatch(getRooms());
});

export const updateRoom = createAsyncThunk('room/updateRoom', async (room: IRoom, thunkAPI) => {
  await http.api.put(`/room/${room.id}`, room);
  await thunkAPI.dispatch(getRooms());
});

export const deleteRoom = createAsyncThunk('room/deleteRoom', async (id: number, thunkAPI) => {
  await http.api.delete(`/room/${id}`);
  await thunkAPI.dispatch(getRooms());
});

interface IPredictState {
  rooms: IRoom[];
  getRoomsRequest: IHttpRequestResult<IRoom[]>;
  getOneRoomRequest: IHttpRequestResult<IRoom>;
  createRoomRequest: IHttpRequestResult<void>;
  updateRoomRequest: IHttpRequestResult<void>;
  deleteRoomRequest: IHttpRequestResult<void>;
}

const initialState: IPredictState = {
  rooms: [],
  getRoomsRequest: createHttpRequestInitResult(),
  getOneRoomRequest: createHttpRequestInitResult(),
  createRoomRequest: createHttpRequestInitResult(),
  updateRoomRequest: createHttpRequestInitResult(),
  deleteRoomRequest: createHttpRequestInitResult(),
};

export const RoomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, getRooms, 'getRoomsRequest', (state, action) => {
      state.rooms = action.payload;
    });
    createExtraReducersForResponses(builder, getOneRoom, 'getOneRoomRequest');
    createExtraReducersForResponses(builder, createRoom, 'createRoomRequest');
    createExtraReducersForResponses(builder, updateRoom, 'updateRoomRequest');
    createExtraReducersForResponses(builder, deleteRoom, 'deleteRoomRequest');
  },
});

// export const {} = RoomSlice.actions;

export default RoomSlice.reducer;
