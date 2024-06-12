import { Navigate, useRoutes } from 'react-router-dom';
import { SignIn } from 'pages';
import SignUp from 'pages/AuthPages/SignUp/SignUp';
import ForgotPassword from 'pages/AuthPages/ForgotPassword/ForgotPassword';

export enum AuthRoutesEnum {
  SignIn = '/signin',
  SignUp = '/signup',
  ForgotPassword = '/forgot-password',
}

export const AuthRoutes = () => {
  const routes = useRoutes([
    { path: AuthRoutesEnum.SignIn, element: <SignIn /> },
    { path: AuthRoutesEnum.SignUp, element: <SignUp /> },
    { path: AuthRoutesEnum.ForgotPassword, element: <ForgotPassword /> },
    { path: '*', element: <Navigate to={AuthRoutesEnum.SignIn} /> },
  ]);
  return routes;
};
