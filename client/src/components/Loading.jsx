export const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative">
        <div className="loading-spinner"></div>
        <p className="text-center mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};
