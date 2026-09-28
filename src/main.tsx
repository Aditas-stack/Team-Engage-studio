import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class StudioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  handleResetStudio = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#090D16] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-white/15 bg-[#121829] p-6 text-center space-y-4">
            <h1 className="text-xl font-bold text-amber-400">
              Team Engage Studio Recovery
            </h1>
            <p className="text-xs text-slate-300">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleResetStudio}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Reset Saved Data &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  (
    window as unknown as { __TEAM_ENGAGE_MOUNTED__?: boolean }
  ).__TEAM_ENGAGE_MOUNTED__ = true;
  createRoot(rootElement).render(
    <StrictMode>
      <StudioErrorBoundary>
        <App />
      </StudioErrorBoundary>
    </StrictMode>
  );
}
