import { useState, useEffect } from "react";
import { api } from './utils/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { modelSchema } from "./schemas/model"; 
import { cache } from "react";
import { Toaster, toast } from 'react-hot-toast';
import { Spinner } from './components/Spinners';

export default function App() {
  const [contractStatus, setContractStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    metadata_uri: '',
    private_key: ''
  });
  const [registeredModels, setRegisteredModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loadingDetails, setLoadingDeatils] = useState(false);

  useEffect(() => {
    loadContractStatus();
  }, []);

  const loadContractStatus = async () => {
    try {
      console.log('Fetching contract status...');
      const status = await api.getContractStatus();
      console.log('Contract status:', status);
      setContractStatus(status);
    } catch (err) {
      setError('Failed to load contract status');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.registerModel(formData);
      console.log('Registeration result:', result);

      // 登録したモデル情報をセット
      const newModel = {
        name: formData.name,
        version: formData.version,
        metadata_uri: formData.metadata_uri,
        model_id: result.data.model_id,
        transaction_hash: result.data.transaction_hash
      }

      setRegisteredModels([newModel, ...registeredModels]);

      // 入力フォームを初期化
      setFormData({
        name: '',
        version: '',
        metadata_uri: '',
        private_key: ''
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register model');
    } finally {
      setLoading(false);
    }
  };

  // モデル詳細を取得する関数
  const fetchModelDetails = async (modelId) => {
    setLoadingDeatils(true);
    try {
      const modelDetails = await api.getModel(modelId);
      setSelectedModel(modelDetails);
    } catch (err) {
      console.log('Error fetching model details:', err);
      setError('Failed to load model details');
    } finally {
      setLoadingDeatils(false);
    }
  }

  const {
    register,
    handleSubmit: validateSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(modelSchema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    // 登録開始のトースト
    const loadingToast = toast.loading('Registering model...');

    try {
      const result = await api.registerModel(data);
      const newModel = {
        name: data.name,
        version: data.version,
        model_id: result.model_id,
        transaction_hash: result.transaction_hash
      };

      setRegisteredModels([newModel, ...registeredModels]);
      reset(); // フォームのリセット

      // 成功時のトースト
      toast.success('Model registered successfully!', {
        id: loadingToast,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to register model';
      setError(errorMessage);

      // エラー時のトースト
      toast.error(errorMessage, {
        id: loadingToast,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      {/* トースト通知のコンテナ */}
      <Toaster position="top-right" />

      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg rounded-none sm:rounded-3xl p-6 sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold mb-8 text-center text-gray-900">
                  Model Registry
                </h1>

                {/* Contract Status */}
                {contractStatus && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">Contract Status</h2>
                    <p className="text-sm">
                      Initialized: {contractStatus.contract_initialized ? '✅' : '❌'}
                    </p>
                    <p className="text-sm">
                      Connected: {contractStatus.web3_connected ? '✅' : '❌'}
                    </p>
                  </div>
                )}
                {/* Registered Models */}
                {registeredModels.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Registered Models</h2>
                    <div className="space-y-4">
                      {registeredModels.map((model) => (
                        <div key={model.model_id} className="card bg-gray-50">
                          <h3 className="font-semibold">
                            {model.name} {model.version && `v${model.version}`}
                          </h3>
                          {model.model_id && (
                            <p className="text-sm text-gray-600">ID: {model.model_id}</p>
                          )}
                          {model.metadata_uri && (
                            <p className="text-sm text-gray-600">URI: {model.metadata_uri}</p>
                          )}
                          <button onClick={() => fetchModelDetails(model.model_id)}
                            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              View Details
                          </button>
                          {/* <pre className="text-xs mt-2 text-gray-500">
                            {JSON.stringify(model, null, 2)}
                          </pre> */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ボタンのローディング状態を改善 */}
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  {loading && <Spinner />}
                  <span>{loading ? 'Registering...' : 'Register Model'}</span>
                </button>

                {/* モデル一覧のスケルトンローディング */}
                {loading && !error && (
                  <div className="mt-8 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                )}

                {/* モデル詳細のモーダル */}
                {selectedModel && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full m-4">
                      <h2 className="text-xl font-semibold mb-4">Model Details</h2>
                      <button
                        onClick={() => setSelectedModel(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* <div className="space-y-2">
                        <p><span className="font-semibold">Name:</span> {selectedModel.name}</p>
                        <p><span className="font-semibold">Version:</span> {selectedModel.version}</p>
                        <p><span className="font-semibold">Metadata URI:</span> {selectedModel.metadata_uri}</p>
                        <p><span className="font-semibold">Owner:</span> {selectedModel.owner}</p>
                        <p><span className="font-semibold">Active:</span> {selectedModel.is_active ? 'Yes' : 'No'}</p>
                        <p><span className="font-semibold">Created:</span> {new Date(selectedModel.timestamp * 1000).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => setSelectedModel(null)}
                        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Close
                      </button> */}
                    </div>
                  </div>
                )}
                  {/* Registration Form */}
                  <form onSubmit={validateSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Model Name
                      </label>
                      <input
                        {...register('name')}
                        className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Enter model name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Version
                      </label>
                      <input
                        {...register('version')}
                        className={`input-field ${errors.version ? 'border-red-500' : ''}`}
                        placeholder="1.0.0"
                      />
                      {errors.version && (
                        <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Metadata URI
                      </label>
                      <input
                        {...register('metadata_uri')}
                        className={`input-field ${errors.metadata_uri ? 'border-red-500' : ''}`}
                        placeholder="ipfs://"
                      />
                      {errors.metadata_uri && (
                        <p className="mt-1 text-sm text-red-600">{errors.metadata_uri.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Private Key
                      </label>
                      <input
                        {...register('private_key')}
                        className={`input-field ${errors.private_key ? 'border-red-500' : ''}`}
                        type="password"
                        placeholder="Enter private key"
                      />
                      {errors.private_key && (
                        <p className="mt-1 text-sm text-red-600">{errors.private_key.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={loading}
                    >
                      {loading ? 'Registering...' : 'Register Model'}
                    </button>
                  </form>

                  {/* エラーメッセージ */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}