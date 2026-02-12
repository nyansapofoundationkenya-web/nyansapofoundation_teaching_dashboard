const LoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-[var(--background-light)] border border-[var(--background-lighter)] rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 bg-[var(--primary-2)] rounded-full animate-pulse"></div>
            <div className="w-2.5 h-2.5 bg-[var(--primary-3)] rounded-full animate-pulse delay-150"></div>
            <div className="w-2.5 h-2.5 bg-[var(--primary-2)] rounded-full animate-pulse delay-300"></div>
          </div>
          <span className="text-sm opacity-80">Analyzing your data...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;