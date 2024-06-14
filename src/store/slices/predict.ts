import { AxiosResponse } from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createExtraReducersForResponses, createHttpRequestInitResult, http } from 'helpers/http';
import { IHttpRequestResult } from 'interfaces/api';
import { IPredict } from 'interfaces';
import { getMatches } from './match';

interface ISetPredictPayload {
  matchId: number;
  userId: number;
  homeScore: number;
  awayScore: number;
  tournamentId: number;
}

interface ISetPredictResponse {
  predict: IPredict;
  message: string;
}

export interface IPredictTableResponse {
  id: number;
  name: string;
  points: number;
  correctScore: number;
  correctDifference: number;
  fivePlusGoals: number;
  correctResult: number;
}

export const setPredict = createAsyncThunk('predict/setPredict', async (predict: ISetPredictPayload, thunkAPI) => {
  try {
    const response: AxiosResponse<ISetPredictResponse> = await http.api.post(`/predict`, predict);
    await thunkAPI.dispatch(getMatches({ tournamentId: predict.tournamentId, _background: true }));
    return response.data;
  } catch (err: any) {
    thunkAPI.rejectWithValue(err.response.data);
  }
});

export const getPredictsTable = createAsyncThunk('predict/getPredictsTable', async (tournamentId: number) => {
  const response: AxiosResponse<IPredictTableResponse[]> = await http.api.get(`/predict/tournament/${tournamentId}`);
  return response.data;
});

export const getMatchPredicts = createAsyncThunk('predict/getMatchPredicts', async (matchId: number) => {
  const response: AxiosResponse<IPredict[]> = await http.api.get(`/predict/match/${matchId}`);
  return response.data;
});

interface IPredictState {
  setPredictRequest: IHttpRequestResult<ISetPredictResponse>;
  getPredictsTableRequest: IHttpRequestResult<IPredictTableResponse[]>;
  getMatchPredictsRequest: IHttpRequestResult<IPredict[]>;
  table: {
    [key: number]: IPredictTableResponse[];
  };
}

const initialState: IPredictState = {
  setPredictRequest: createHttpRequestInitResult(),
  getPredictsTableRequest: createHttpRequestInitResult(),
  getMatchPredictsRequest: createHttpRequestInitResult(),
  table: {},
};

export const PredictSlice = createSlice({
  name: 'predict',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    createExtraReducersForResponses(builder, setPredict, 'setPredictRequest');
    createExtraReducersForResponses(builder, getPredictsTable, 'getPredictsTableRequest', (state, action) => {
      const tournamentId = action.meta.arg;
      state.table[tournamentId] = action.payload || [];
    });
    createExtraReducersForResponses(builder, getMatchPredicts, 'getMatchPredictsRequest');
  },
});

// export const {} = PredictSlice.actions;

export default PredictSlice.reducer;
