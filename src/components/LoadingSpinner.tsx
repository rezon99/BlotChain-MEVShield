import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          
          {/* Inner ring */}
          <div className="absolute top-2 left-2 w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
        </div>
        
        <h2 className="text-white text-xl font-semibold mt-6 mb-2">
          Loading Market Data
        </h2>
        <p className="text-gray-400">
          Fetching real-time cryptocurrency data from CoinGecko...
        </p>
        
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};