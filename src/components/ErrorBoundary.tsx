import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EcoClean Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900">Erreur d'affichage</h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-xs">
            Un problème technique est survenu lors du chargement de cet écran. Nos agents travaillent à sa résolution.
          </p>
          {this.state.error && (
            <pre className="mt-3 p-3 bg-slate-100 rounded-xl text-[10px] font-mono text-left text-slate-600 max-w-full overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-6 px-6 py-3 bg-ecogreen-500 hover:bg-ecogreen-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-ecogreen-500/15 transition-all uppercase tracking-wider"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
