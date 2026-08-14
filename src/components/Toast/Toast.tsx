import React from 'react';
import { IconProps, ToastContainer, ToastPosition, cssTransition } from 'react-toastify';

const glyphProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'footbet-toast__glyph',
};

const SuccessGlyph = () => (
  <svg {...glyphProps}>
    <path d="M5.2 12.4 9.7 16.9 18.8 7.4" />
  </svg>
);

const ErrorGlyph = () => (
  <svg {...glyphProps}>
    <path d="M7 7 17 17" />
    <path d="M17 7 7 17" />
  </svg>
);

const WarningGlyph = () => (
  <svg {...glyphProps}>
    <path d="M12 4.4 21 19.6H3z" />
    <path d="M12 10v3.7" />
    <path d="M12 16.7h.01" />
  </svg>
);

const InfoGlyph = () => (
  <svg {...glyphProps}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 11.3v5" />
    <path d="M12 7.9h.01" />
  </svg>
);

const renderIcon = ({ type }: IconProps) => {
  switch (type) {
    case 'success':
      return <SuccessGlyph />;
    case 'error':
      return <ErrorGlyph />;
    case 'warning':
      return <WarningGlyph />;
    default:
      return <InfoGlyph />;
  }
};

const CloseButton = ({ closeToast }: { closeToast: (e: React.MouseEvent<HTMLElement>) => void }) => (
  <button type="button" className="footbet-toast__close" onClick={closeToast} aria-label="Закрити сповіщення">
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M6.8 6.8 17.2 17.2" />
      <path d="M17.2 6.8 6.8 17.2" />
    </svg>
  </button>
);

const toastTransition = cssTransition({
  enter: 'footbet-toast--enter',
  exit: 'footbet-toast--exit',
  collapseDuration: 260,
});

interface ToastProps {
  position?: ToastPosition;
}

const Toast: React.FC<ToastProps> = ({ position = 'top-right' }) => (
  <ToastContainer
    position={position}
    theme="dark"
    autoClose={4000}
    newestOnTop
    closeOnClick
    pauseOnHover
    pauseOnFocusLoss={false}
    draggable="touch"
    draggableDirection="x"
    draggablePercent={45}
    icon={renderIcon}
    closeButton={CloseButton}
    transition={toastTransition}
    className="footbet-toast-container"
    toastClassName="footbet-toast"
    bodyClassName="footbet-toast-body"
    progressClassName="footbet-toast__progress"
  />
);

export default Toast;
