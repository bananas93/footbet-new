import { Home, Tournament } from 'pages';
import Leagues from 'pages/AppPages/Tournament/components/Leagues/Leagues';
import Matches from 'pages/AppPages/Tournament/components/Matches/Matches';
import Standings from 'pages/AppPages/Tournament/components/Standings/Standings';
import { Navigate, useRoutes } from 'react-router-dom';

export enum RoutesEnum {
  Home = '/',
  Tournament = '/tournament/:tournamentId',
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
        { path: 'achievements', element: <div>Achievements</div> },
      ],
    },
    { path: '*', element: <Navigate to={RoutesEnum.Home} /> },
  ]);
  return routes;
};
