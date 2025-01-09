export const LoadingSpinner = ({ size = "normal" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    normal: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}
      />
    </div>
  );
};
