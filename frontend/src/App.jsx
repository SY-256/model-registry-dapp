// src/App.jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { modelSchema } from "./schemas/model";
import { api } from "./utils/api";
import { Toaster, toast } from "react-hot-toast";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AlertMessage } from "./components/AlertMessage";
import { ModelDetailsModal } from "./components/ModelDetailsModal";

export default function App() {
  const [contractStatus, setContractStatus] = useState(null);
  const [registeredModels, setRegisteredModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVersion, setFilterVersion] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentAccount, setCurrentAccount] = useState(null);

  const {
    register,
    handleSubmit: validateSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(modelSchema),
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("Fetching contract status...");
        const status = await api.getContractStatus();
        console.log("Contract status:", status);
        setContractStatus(status);

        console.log("Fetching models...");
        const models = await api.getModels();
        console.log("Fetched models:", models);
        setRegisteredModels(models);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        if (err.response) {
          console.error("API Error details:", {
            status: err.response.status,
            data: err.response.data,
          });
        }
        setError("Failed to load initial data");
      }
    };

    fetchInitialData();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    const loadingToast = toast.loading("Registering model...");

    try {
      console.log("Submitting model data:", data);
      const result = await api.registerModel(data);
      console.log("Registration result:", result);
      setCurrentAccount(result.owner);

      const newModel = {
        name: data.name,
        version: data.version,
        metadata_uri: data.metadata_uri,
        model_id: result.model_id,
        transaction_hash: result.transaction_hash,
        timestamp: Math.floor(Date.now() / 1000),
        owner: result.owner,
      };

      setRegisteredModels([newModel, ...registeredModels]);
      reset();

      toast.success("Model registered successfully!", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage =
        err.response?.data?.detail || "Failed to register model";
      setError(errorMessage);

      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateModel = async (formData) => {
    setLoading(true);
    const loadingToast = toast.loading("Updating model...");

    try {
      const result = await api.updateModel(selectedModel.model_id, formData);

      const updatedModels = registeredModels.map((model) =>
        model.model_id === selectedModel.model_id
          ? { ...model, ...result }
          : model
      );

      setRegisteredModels(updatedModels);
      setSelectedModel({ ...selectedModel, ...result });

      toast.success("Model updated successfully!", {
        id: loadingToast,
      });
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update model", {
        id: loadingToast,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchModelDetails = async (modelId) => {
    try {
      console.log("Fetching details for model ID:", modelId);
      if (!modelId) {
        throw new Error("Model ID is undefined");
      }
      const modelDetails = await api.getModel(modelId);
      console.log("Received model details:", modelDetails);
      setSelectedModel(modelDetails);
    } catch (err) {
      console.error("Error fetching model details:", err);
      toast.error("Failed to load model details");
    }
  };

  const filteredModels = registeredModels
    .filter((model) => {
      const matchesSearch = model.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesVersion =
        !filterVersion || model.version.includes(filterVersion);
      return matchesSearch && matchesVersion;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          const timestampA = a.timestamp || 0;
          const timestampB = b.timestamp || 0;
          return timestampB - timestampA;
        case "oldest":
          const oldTimestampA = a.timestamp || 0;
          const oldTimestampB = b.timestamp || 0;
          return oldTimestampA - oldTimestampB;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col">
      <Toaster position="top-right" />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Model Registry
            </h1>

            {contractStatus && (
              <div className="mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">
                    Contract Status
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Initialized:
                      </span>
                      {contractStatus.contract_initialized ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Connected:</span>
                      {contractStatus.web3_connected ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span className="text-red-500">✗</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={validateSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Model Name
                </label>
                <input
                  {...register("name")}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  placeholder="Enter model name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <input
                  {...register("version")}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.version ? "border-red-500" : ""
                  }`}
                  placeholder="1.0.0"
                />
                {errors.version && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.version.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Metadata URI
                </label>
                <input
                  {...register("metadata_uri")}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.metadata_uri ? "border-red-500" : ""
                  }`}
                  placeholder="ipfs://"
                />
                {errors.metadata_uri && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.metadata_uri.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Private Key
                </label>
                <input
                  {...register("private_key")}
                  type="password"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.private_key ? "border-red-500" : ""
                  }`}
                  placeholder="Enter private key"
                />
                {errors.private_key && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.private_key.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Registering...</span>
                  </>
                ) : (
                  "Register Model"
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4">
                <AlertMessage type="error" message={error} />
              </div>
            )}

            {registeredModels.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Search models..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={filterVersion}
                      onChange={(e) => setFilterVersion(e.target.value)}
                    >
                      <option value="">All Versions</option>
                      <option value="1.0">Version 1.0.x</option>
                      <option value="2.0">Version 2.0.x</option>
                    </select>

                    <select
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredModels.map((model) => (
                    <div
                      key={model.model_id}
                      className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-4"
                    >
                      <h3 className="font-semibold text-lg">{model.name}</h3>
                      <p className="text-sm text-gray-600">
                        Version: {model.version}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        ID: {model.model_id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created:{" "}
                        {new Date(model.timestamp * 1000).toLocaleString()}
                      </p>
                      <button
                        onClick={() => fetchModelDetails(model.model_id)}
                        className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedModel && (
        <ModelDetailsModal
          model={selectedModel}
          onClose={() => setSelectedModel(null)}
          onUpdate={handleUpdateModel}
          currentAccount={currentAccount}
          isLoading={loading}
        />
      )}
    </div>
  );
}
