import { Navigate, useRoutes } from 'react-router-dom';
import { SignIn } from 'pages';
import SignUp from 'pages/AuthPages/SignUp/SignUp';
import ForgotPassword from 'pages/AuthPages/ForgotPassword/ForgotPassword';
import CheckValidationCode from 'pages/AuthPages/CheckValidationCode/CheckValidationCode';
import SetPassword from 'pages/AuthPages/SetPassword/SetPassword';

export enum AuthRoutesEnum {
  SignIn = '/signin',
  SignUp = '/signup',
  ForgotPassword = '/forgot-password',
  CheckCode = '/check-code',
  SetPassword = '/set-password',
}

export const AuthRoutes = () => {
  const routes = useRoutes([
    { path: AuthRoutesEnum.SignIn, element: <SignIn /> },
    { path: AuthRoutesEnum.SignUp, element: <SignUp /> },
    { path: AuthRoutesEnum.ForgotPassword, element: <ForgotPassword /> },
    { path: AuthRoutesEnum.CheckCode, element: <CheckValidationCode /> },
    { path: AuthRoutesEnum.SetPassword, element: <SetPassword /> },
    { path: '*', element: <Navigate to={AuthRoutesEnum.SignIn} /> },
  ]);
  return routes;
};
