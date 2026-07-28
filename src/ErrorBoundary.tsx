import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// 토스 네이티브 브릿지 호출(광고 SDK 등)이 예상 밖의 상황에서 예외를 던지는 경우가
// 있어서, 어디서 터지든 앱 전체가 빈 화면이 되는 대신 재시도 화면으로 대응한다.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
          <p className="text-sm font-bold text-zinc-500">일시적인 오류가 발생했어요.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="rounded-full bg-lime-400 px-5 py-2 text-sm font-black tracking-wide text-black uppercase active:bg-lime-300"
          >
            다시 시도하기
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
