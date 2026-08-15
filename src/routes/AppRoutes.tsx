import { Home, Tournament, User } from 'pages';
import ProjectSupport from 'pages/AppPages/ProjectSupport/ProjectSupport';
import Profile from 'pages/AppPages/Profile/Profile';
import Rules from 'pages/AppPages/Rules/Rules';
import Achievements from 'pages/AppPages/Tournament/components/Achievements/Achievements';
import Leagues from 'pages/AppPages/Tournament/components/Leagues/Leagues';
import Matches from 'pages/AppPages/Tournament/components/Matches/Matches';
import MatchDetails from 'pages/AppPages/Tournament/components/MatchDetails/MatchDetails';
import Rooms from 'pages/AppPages/Tournament/components/Rooms/Rooms';
import Standings from 'pages/AppPages/Tournament/components/Standings/Standings';
import TeamDetails from 'pages/AppPages/Tournament/components/TeamDetails/TeamDetails';
import { Navigate, useRoutes } from 'react-router-dom';
import RequireAuthRoute from './RequireAuthRoute';

export enum RoutesEnum {
  Home = '/',
  Tournament = '/tournament/:tournamentId',
  User = '/user',
  Rules = '/rules',
  ProjectSupport = '/project-support',
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
        { path: 'match/:matchId', element: <MatchDetails /> },
        { path: 'team/:teamId', element: <TeamDetails /> },
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
    { path: RoutesEnum.ProjectSupport, element: <ProjectSupport /> },
    { path: '*', element: <Navigate to={RoutesEnum.Home} /> },
  ]);
  return routes;
};
