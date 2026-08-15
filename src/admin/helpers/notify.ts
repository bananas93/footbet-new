import { toast, ToastOptions } from 'react-toastify';
import { ReactNode } from 'react';

import { Slide } from 'react-toastify';
import { ToastIcon } from 'react-toastify/dist/types';

interface ToastSettings {
  position: 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right' | 'bottom-left';
  theme: 'light' | 'dark' | 'colored';
  autoClose: number | false;
  hideProgressBar: boolean;
  closeOnClick: boolean;
  pauseOnHover: boolean;
  draggable: boolean;
  icon?: ToastIcon;
  delay: boolean;
  transition: typeof Slide;
}

export const toastSettings: ToastSettings = {
  position: 'top-center',
  theme: 'colored',
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  delay: false,
  transition: Slide,
};

interface NotifyFunction {
  (message: string | JSX.Element, autoClose?: number, toastId?: string): ReactNode;
}

interface Notify {
  warning: NotifyFunction;
  error: NotifyFunction;
  success: NotifyFunction;
  info: NotifyFunction;
}

const notify: Notify = {
  warning: (message: string | JSX.Element, autoClose: number = 3000, toastId?: string): ReactNode =>
    toast.warning(message, { autoClose, toastId } as ToastOptions),
  error: (message: string | JSX.Element, autoClose: number = 3000, toastId?: string): ReactNode =>
    toast.error(message, { autoClose, toastId } as ToastOptions),
  success: (message: string | JSX.Element, autoClose: number = 3000, toastId?: string): ReactNode =>
    toast.success(message, { autoClose, toastId } as ToastOptions),
  info: (message: string | JSX.Element, autoClose: number = 3000, toastId?: string): ReactNode =>
    toast.info(message, { autoClose, toastId } as ToastOptions),
};

export { notify };
