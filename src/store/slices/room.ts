import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, getUserDisplayName, supabase } from 'helpers';
import { IRoom, IHttpRequestResult } from 'interfaces';
import { IPredictTableResponse } from './predict';

interface ICreateRoomPayload {
  name: string;
  type: 'public' | 'private';
  password?: string;
}

interface IJoinRoomPayload {
  roomId: number;
  password?: string;
}

interface IJoinRoomByInvitePayload {
  inviteCode: string;
  password?: string;
}

interface IGetRoomLeaderboardPayload {
  roomId: number;
  tournamentId: number;
}

const normalizeRoom = (item: any): IRoom => ({
  id: item.id,
  name: item.name,
  type: item.type,
  inviteCode: item.invite_code,
  participants: (item.room_members || [])
    .map((member: any) => ({
      id: member.user_id,
      name: getUserDisplayName(member.profiles?.name, member.profiles?.nickname),
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name)),
  creator: {
    id: item.creator?.id || item.creator_id,
    name: getUserDisplayName(item.creator?.name, item.creator?.nickname),
  },
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

export const getRooms = createAsyncThunk('room/getRooms', async () => {
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `
      id,
      name,
      type,
      invite_code,
      creator_id,
      created_at,
      updated_at,
      creator:profiles!rooms_creator_id_fkey(id, name, nickname),
      room_members(
        user_id,
        profiles(id, name, nickname)
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeRoom);
});

export const getOneRoom = createAsyncThunk('room/getOneRoom', async (id: number) => {
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `
      id,
      name,
      type,
      invite_code,
      creator_id,
      created_at,
      updated_at,
      creator:profiles!rooms_creator_id_fkey(id, name, nickname),
      room_members(
        user_id,
        profiles(id, name, nickname)
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRoom(data);
});

export const createRoom = createAsyncThunk('room/createRoom', async (room: ICreateRoomPayload, thunkAPI) => {
  const { data, error } = await supabase.rpc('create_room', {
    p_name: room.name,
    p_type: room.type,
    p_password: room.password || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getRooms());
  return { roomId: data?.id as number | undefined };
});

export const updateRoom = createAsyncThunk('room/updateRoom', async (room: IRoom, thunkAPI) => {
  const payload: Record<string, any> = {
    name: room.name,
    type: room.type,
  };

  const { error } = await supabase.from('rooms').update(payload).eq('id', room.id);
  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getRooms());
});

export const deleteRoom = createAsyncThunk('room/deleteRoom', async (id: number, thunkAPI) => {
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getRooms());
});

export const joinRoom = createAsyncThunk('room/joinRoom', async ({ roomId, password }: IJoinRoomPayload, thunkAPI) => {
  const { data, error } = await supabase.rpc('join_room', {
    p_room_id: roomId,
    p_password: password || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getRooms());
  return { roomId: (data?.id as number | undefined) || roomId };
});

export const joinRoomByInviteCode = createAsyncThunk(
  'room/joinRoomByInviteCode',
  async ({ inviteCode, password }: IJoinRoomByInvitePayload, thunkAPI) => {
    const { data, error } = await supabase.rpc('join_room_by_invite_code', {
      p_invite_code: inviteCode,
      p_password: password || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    await thunkAPI.dispatch(getRooms());
    return { roomId: data?.id as number | undefined };
  },
);

export const leaveRoom = createAsyncThunk('room/leaveRoom', async (roomId: number, thunkAPI) => {
  const { error } = await supabase.rpc('leave_room', { p_room_id: roomId });
  if (error) {
    throw new Error(error.message);
  }

  await thunkAPI.dispatch(getRooms());
});

export const getRoomLeaderboard = createAsyncThunk(
  'room/getRoomLeaderboard',
  async ({ roomId, tournamentId }: IGetRoomLeaderboardPayload) => {
    const { data, error } = await supabase.rpc('get_room_leaderboard', {
      p_room_id: roomId,
      p_tournament_id: tournamentId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      roomId,
      tournamentId,
      rows: (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        totalMatches: item.total_matches,
        points: item.points,
        correctScore: item.correct_score,
        correctDifference: item.correct_difference,
        fivePlusGoals: item.five_plus_goals,
        correctResult: item.correct_result,
      })) as IPredictTableResponse[],
    };
  },
);

interface IPredictState {
  rooms: IRoom[];
  getRoomsRequest: IHttpRequestResult<IRoom[]>;
  getOneRoomRequest: IHttpRequestResult<IRoom>;
  createRoomRequest: IHttpRequestResult<void>;
  updateRoomRequest: IHttpRequestResult<void>;
  deleteRoomRequest: IHttpRequestResult<void>;
  joinRoomRequest: IHttpRequestResult<void>;
  joinRoomByInviteCodeRequest: IHttpRequestResult<void>;
  leaveRoomRequest: IHttpRequestResult<void>;
  getRoomLeaderboardRequest: IHttpRequestResult<IPredictTableResponse[]>;
  roomTable: {
    [key: string]: IPredictTableResponse[];
  };
}

const initialState: IPredictState = {
  rooms: [],
  getRoomsRequest: createHttpRequestInitResult(),
  getOneRoomRequest: createHttpRequestInitResult(),
  createRoomRequest: createHttpRequestInitResult(),
  updateRoomRequest: createHttpRequestInitResult(),
  deleteRoomRequest: createHttpRequestInitResult(),
  joinRoomRequest: createHttpRequestInitResult(),
  joinRoomByInviteCodeRequest: createHttpRequestInitResult(),
  leaveRoomRequest: createHttpRequestInitResult(),
  getRoomLeaderboardRequest: createHttpRequestInitResult(),
  roomTable: {},
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
    createExtraReducersForResponses(builder, joinRoom, 'joinRoomRequest');
    createExtraReducersForResponses(builder, joinRoomByInviteCode, 'joinRoomByInviteCodeRequest');
    createExtraReducersForResponses(builder, leaveRoom, 'leaveRoomRequest');
    createExtraReducersForResponses(builder, getRoomLeaderboard, 'getRoomLeaderboardRequest', (state, action) => {
      const { roomId, tournamentId, rows } = action.payload;
      const key = `${tournamentId}:${roomId}`;
      state.roomTable[key] = rows;
    });
  },
});

// export const {} = RoomSlice.actions;

export default RoomSlice.reducer;
