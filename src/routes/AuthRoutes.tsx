import { Navigate, useRoutes } from 'react-router-dom';
import { SignIn } from 'pages';
import SignUp from 'pages/AuthPages/SignUp/SignUp';

export enum AuthRoutesEnum {
  SignIn = '/signin',
  SignUp = '/signup',
}

export const AuthRoutes = () => {
  const routes = useRoutes([
    { path: AuthRoutesEnum.SignIn, element: <SignIn /> },
    { path: AuthRoutesEnum.SignUp, element: <SignUp /> },
    { path: '*', element: <Navigate to={AuthRoutesEnum.SignIn} /> },
  ]);
  return routes;
};
