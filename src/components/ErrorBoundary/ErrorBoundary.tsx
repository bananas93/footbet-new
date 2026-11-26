import { Component, ErrorInfo, ReactNode } from 'react';
import { translate } from 'i18n';
import styles from './ErrorBoundary.module.scss';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Without this, any render error leaves an empty page. In an installed PWA there
// is no address bar and no reload, so the user has no way out of a blank screen.
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // Nothing else to try: reload anyway.
    }

    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>{translate('app.error.title')}</h1>
          <p className={styles.text}>{translate('app.error.text')}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={this.handleReload}>
              {translate('app.error.reload')}
            </button>
            <button type="button" className={styles.secondary} onClick={this.handleReset}>
              {translate('app.error.reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
