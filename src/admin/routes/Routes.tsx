import { Navigate, useRoutes } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Tournaments from '../pages/Tournaments/Tournaments';
import Teams from '../pages/Teams/Teams';
import Matches from '../pages/Matches/Matches';
import Rooms from '../pages/Rooms/Rooms';
import Predictions from '../pages/Predictions/Predictions';
import Users from '../pages/Users/Users';

export enum RoutesEnum {
  Home = '',
  Tournaments = 'tournaments',
  Teams = 'teams',
  Matches = 'matches',
  Rooms = 'rooms',
  Predictions = 'predictions',
  Users = 'users',
}

export const AdminLinks = {
  Home: '/admin',
  Tournaments: '/admin/tournaments',
  Teams: '/admin/teams',
  Matches: '/admin/matches',
  Rooms: '/admin/rooms',
  Predictions: '/admin/predictions',
  Users: '/admin/users',
} as const;

export const Routes = () => {
  const routes = useRoutes([
    { index: true, element: <Home /> },
    { path: RoutesEnum.Tournaments, element: <Tournaments /> },
    { path: RoutesEnum.Teams, element: <Teams /> },
    { path: RoutesEnum.Matches, element: <Matches /> },
    { path: RoutesEnum.Rooms, element: <Rooms /> },
    { path: RoutesEnum.Predictions, element: <Predictions /> },
    { path: RoutesEnum.Users, element: <Users /> },
    { path: '*', element: <Navigate to={AdminLinks.Home} /> },
  ]);
  return routes;
};
