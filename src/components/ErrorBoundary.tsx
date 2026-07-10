import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  // Nhãn ngắn để biết khu vực nào lỗi (vd "luận giải AI").
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

// Error Boundary tối giản: chặn một throw khi render (vd ReactMarkdown gặp cú
// pháp lạ từ nội dung AI sinh) để không làm sập toàn bộ cây React. Không sửa
// state, không sửa dữ liệu, hoàn toàn trong suốt khi không có lỗi.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, message: String(error?.message || error || "Lỗi không xác định") };
  }

  componentDidCatch(error: any, info: any) {
    console.error(`[ErrorBoundary${this.props.label ? ` - ${this.props.label}` : ""}]`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 text-left space-y-2">
          <p className="font-bold text-sm text-red-700 dark:text-red-400">
            Đã xảy ra lỗi khi hiển thị{this.props.label ? ` ${this.props.label}` : ""}.
          </p>
          <p className="text-xs text-red-600/80 dark:text-red-400/70 break-words">{this.state.message}</p>
          <button
            onClick={this.handleReset}
            className="mt-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            Thử hiển thị lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
