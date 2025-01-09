export const AlertMessage = ({ type, message }) => {
  const types = {
    error: "bg-red-50 text-red-700 border-red-400",
    success: "bg-green-50 text-green-700 border-green-400",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-400",
    info: "bg-blue-50 text-blue-700 border-blue-400",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${types[type]} flex items-start space-x-3`}
    >
      <div className="flex-shrink-0">
        {type === "error" && (
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex-1">{message}</div>
    </div>
  );
};
