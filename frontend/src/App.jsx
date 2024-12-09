import { useState, useEffect } from "react";
import { api } from './utils/api';

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

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
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

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Model Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Version
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Metadata URI
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.metadata_uri}
                      onChange={(e) => setFormData({...formData, metadata_uri: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Private Key
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.private_key}
                      onChange={(e) => setFormData({...formData, private_key: e.target.value})}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register Model'}
                  </button>
                </form>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
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
                          {/* <pre className="text-xs mt-2 text-gray-500">
                            {JSON.stringify(model, null, 2)}
                          </pre> */}
                        </div>
                      ))}
                    </div>
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