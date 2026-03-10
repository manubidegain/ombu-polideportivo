interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-[#1b1b1b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-50'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      {/* Animated Padel Ball */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23]
            shadow-lg animate-bounce relative overflow-hidden`}
        >
          {/* Ball texture lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-white/30 rotate-45" />
            <div className="absolute w-full h-0.5 bg-white/30 -rotate-45" />
          </div>
          {/* Shine effect */}
          <div className="absolute top-2 left-2 w-4 h-4 bg-white/40 rounded-full blur-sm" />
        </div>

        {/* Shadow */}
        <div
          className={`${
            size === 'sm' ? 'w-8 h-2' : size === 'md' ? 'w-16 h-3' : 'w-24 h-4'
          } absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/20 rounded-full blur-sm animate-pulse`}
        />
      </div>

      {/* Loading text */}
      {text && (
        <p className="mt-6 font-heading text-[18px] text-white animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Inline loader for buttons (generic spinner)
export function ButtonSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Inline padel ball loader for buttons
export function ButtonBallSpinner() {
  return (
    <span className="inline-flex items-center justify-center">
      <span className="relative inline-block w-4 h-4 animate-bounce">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#dbf228] to-[#c5db23]">
          {/* Ball texture lines */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-full h-[1px] bg-white/30 rotate-45" />
            <span className="absolute w-full h-[1px] bg-white/30 -rotate-45" />
          </span>
        </span>
      </span>
    </span>
  );
}
