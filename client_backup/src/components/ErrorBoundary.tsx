import React, { ReactNode, useState, useEffect } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800 text-white p-6">
          <div className="max-w-md text-center">
            <h1 className="text-3xl font-bold mb-4 text-red-500">⚠️ エラーが発生しました</h1>
            <p className="text-lg mb-6 text-white/80">
              申し訳ありません。アプリケーションでエラーが発生しました。
            </p>
            <details className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
              <summary className="cursor-pointer text-red-400 font-semibold mb-2">
                エラー詳細
              </summary>
              <code className="text-xs text-white/60 break-words whitespace-pre-wrap">
                {this.state.error?.message}
              </code>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-neon-blue text-white font-semibold rounded-lg hover:bg-neon-blue/80 transition"
            >
              ページをリロード
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * フック版エラー処理（Asyncな処理用）
 */
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[useErrorHandler] Caught error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[useErrorHandler] Unhandled rejection:', {
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
      setError(new Error(String(event.reason)));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return { error, setError };
}
