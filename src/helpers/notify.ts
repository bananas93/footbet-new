import { toast, ToastOptions } from 'react-toastify';
import { ReactNode } from 'react';

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
