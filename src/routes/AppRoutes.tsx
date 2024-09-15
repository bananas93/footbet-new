import { Home, Tournament, User } from 'pages';
import Profile from 'pages/AppPages/Profile/Profile';
import Rules from 'pages/AppPages/Rules/Rules';
import Achievements from 'pages/AppPages/Tournament/components/Achievements/Achievements';
import Leagues from 'pages/AppPages/Tournament/components/Leagues/Leagues';
import Matches from 'pages/AppPages/Tournament/components/Matches/Matches';
import Standings from 'pages/AppPages/Tournament/components/Standings/Standings';
import { Navigate, useRoutes } from 'react-router-dom';

export enum RoutesEnum {
  Home = '/',
  Tournament = '/tournament/:tournamentId',
  User = '/user',
  Rules = '/rules',
  Profile = '/profile/:userId/:tournamentId',
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
        { path: 'leagues', element: <Leagues /> },
        { path: 'achievements', element: <Achievements /> },
      ],
    },
    { path: RoutesEnum.User, element: <User /> },
    { path: RoutesEnum.Profile, element: <Profile /> },
    { path: RoutesEnum.Rules, element: <Rules /> },
    { path: '*', element: <Navigate to={RoutesEnum.Home} /> },
  ]);
  return routes;
};
