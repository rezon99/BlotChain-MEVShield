import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-red-500" />
        </div>
        
        <h2 className="text-white text-xl font-semibold mb-2">
          Failed to Load Data
        </h2>
        
        <p className="text-gray-400 mb-6">
          {error}
        </p>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-white font-medium mb-2">Possible Solutions:</h3>
          <ul className="text-gray-300 text-sm space-y-1 text-left">
            <li>• Check your CoinGecko API key in .env.local</li>
            <li>• Verify your internet connection</li>
            <li>• Check if you've exceeded API rate limits</li>
            <li>• Ensure your API key has proper permissions</li>
          </ul>
        </div>
        
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
};