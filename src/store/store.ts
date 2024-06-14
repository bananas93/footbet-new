import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth';
import tournamentReducer from './slices/tournament';
import matchReducer from './slices/match';
import roomReducer from './slices/room';
import predictReducer from './slices/predict';
import userReducer from './slices/user';
import socketReducer from './slices/socket';

const saveState = (state: RootState) => {
  try {
    const serializedState = JSON.stringify(state);
    sessionStorage.setItem('reduxState', serializedState);
  } catch (e) {
    console.error('Could not save state', e);
  }
};

const loadState = () => {
  try {
    const serializedState = sessionStorage.getItem('reduxState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.error('Could not load state', e);
    return undefined;
  }
};

const rootReducer = combineReducers({
  auth: authReducer,
  tournament: tournamentReducer,
  match: matchReducer,
  room: roomReducer,
  predict: predictReducer,
  user: userReducer,
  socket: socketReducer,
});

const preloadedState = loadState();

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
