import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  title: string;
  subtitle?: string;
  actionText?: string;
  actionFunction?: () => void;
  isForm?: boolean;
  PaperProps?: any;
  children: React.ReactNode;
}

const Modal: React.FC<Props> = ({
  isOpen,
  handleClose,
  title,
  subtitle,
  actionText,
  actionFunction,
  isForm,
  PaperProps,
  children,
}) => {
  return (
    <Dialog open={isOpen} onClose={handleClose} PaperProps={PaperProps} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {subtitle && <DialogContentText>{subtitle}</DialogContentText>}
        {children}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose}>
          Закрити
        </Button>
        <Button
          type={isForm ? 'submit' : 'button'}
          variant="contained"
          {...(actionFunction && { onClick: actionFunction })}>
          {actionText ? actionText : 'Зберегти'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Modal;
