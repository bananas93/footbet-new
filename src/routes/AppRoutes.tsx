import { Home, Tournament, User } from 'pages';
import Profile from 'pages/AppPages/Profile/Profile';
import Rules from 'pages/AppPages/Rules/Rules';
import Achievements from 'pages/AppPages/Tournament/components/Achievements/Achievements';
import Leagues from 'pages/AppPages/Tournament/components/Leagues/Leagues';
import Matches from 'pages/AppPages/Tournament/components/Matches/Matches';
import Rooms from 'pages/AppPages/Tournament/components/Rooms/Rooms';
import Standings from 'pages/AppPages/Tournament/components/Standings/Standings';
import { Navigate, useRoutes } from 'react-router-dom';
import RequireAuthRoute from './RequireAuthRoute';

export enum RoutesEnum {
  Home = '/',
  Tournament = '/tournament/:tournamentId',
  User = '/user',
  Rules = '/rules',
  Profile = '/profile/:userId',
}

export const AppRoutes = () => {
  const routes = useRoutes([
    { path: RoutesEnum.Home, element: <Home /> },
    {
      path: RoutesEnum.Tournament,
      element: <Tournament />,
      children: [
        { path: '', element: <Matches /> },
        { path: 'standings', element: <Standings /> },
        {
          path: 'leagues',
          element: (
            <RequireAuthRoute>
              <Leagues />
            </RequireAuthRoute>
          ),
        },
        {
          path: 'rooms',
          element: (
            <RequireAuthRoute>
              <Rooms />
            </RequireAuthRoute>
          ),
        },
        {
          path: 'achievements',
          element: (
            <RequireAuthRoute>
              <Achievements />
            </RequireAuthRoute>
          ),
        },
      ],
    },
    {
      path: RoutesEnum.User,
      element: (
        <RequireAuthRoute>
          <User />
        </RequireAuthRoute>
      ),
    },
    { path: RoutesEnum.Profile, element: <Profile /> },
    { path: '/profile/:userId/:tournamentId', element: <Profile /> },
    { path: RoutesEnum.Rules, element: <Rules /> },
    { path: '*', element: <Navigate to={RoutesEnum.Home} /> },
  ]);
  return routes;
};
