export default function RecipeCardSkeleton() {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse h-[22rem] flex flex-col">
        <div className="w-full h-48 bg-gray-200"></div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="flex justify-between items-center mt-auto">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
          <div className="mt-3">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5 mt-1"></div>
          </div>
        </div>
      </div>
    );
  }