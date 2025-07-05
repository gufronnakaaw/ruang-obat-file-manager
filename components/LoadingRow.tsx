export default function LoadingRow() {
  return (
    <tr>
      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
        <div className="flex items-center justify-center space-x-2">
          <svg
            className="h-4 w-4 animate-spin text-blue-500"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
            ></path>
          </svg>
          <span>Loading files...</span>
        </div>
      </td>
    </tr>
  );
}
