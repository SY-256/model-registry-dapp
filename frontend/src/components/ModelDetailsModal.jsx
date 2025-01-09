// src/components/ModelDetailsModal.jsx
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export const ModelDetailsModal = ({
  model,
  onClose,
  onUpdate,
  currentAccount,
  isLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    version: "",
    metadata_uri: "",
    private_key: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdate(updateForm);
      setIsEditing(false);
      setUpdateForm({ version: "", metadata_uri: "", private_key: "" });
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4 transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Model Details</h2>
          <div className="flex space-x-2">
            {model.owner === currentAccount && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700"
              >
                <span className="sr-only">Edit</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Version
              </label>
              <input
                type="text"
                value={updateForm.version}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, version: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Metadata URI
              </label>
              <input
                type="text"
                value={updateForm.metadata_uri}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, metadata_uri: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="ipfs://"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Private Key
              </label>
              <input
                type="password"
                value={updateForm.private_key}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, private_key: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter private key"
              />
            </div>
            <div className="flex space-x-4 mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? <LoadingSpinner size="small" /> : "Update"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Name:</span> {model.name}
            </p>
            <p>
              <span className="font-semibold">Version:</span> {model.version}
            </p>
            <p>
              <span className="font-semibold">Metadata URI:</span>{" "}
              {model.metadata_uri}
            </p>
            <p>
              <span className="font-semibold">Owner:</span> {model.owner}
            </p>
            <p>
              <span className="font-semibold">Active:</span>{" "}
              {model.is_active ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">Created:</span>{" "}
              {new Date(model.timestamp * 1000).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
