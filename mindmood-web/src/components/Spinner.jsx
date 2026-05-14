export default function Spinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className={`flex items-center justify-center w-full py-12 ${className}`}>
      <div
        className={`${sizes[size]} border-indigo-200 dark:border-indigo-800 border-t-indigo-500 dark:border-t-indigo-400 rounded-full animate-spin`}
        role="status"
        aria-label="Cargando..."
      />
    </div>
  );
}
