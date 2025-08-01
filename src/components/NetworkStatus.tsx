'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface NetworkStatusProps {
  onOnline?: () => void;
  onOffline?: () => void;
  showDebugInfo?: boolean;
}

export default function NetworkStatus({ 
  onOnline, 
  onOffline, 
  showDebugInfo = false 
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [lastOffline, setLastOffline] = useState<Date | null>(null);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOffline(new Date());
      onOffline?.();
    };

    // 初期状態を設定
    setIsOnline(navigator.onLine);
    setLastOnline(navigator.onLine ? new Date() : null);

    // 接続タイプの取得
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
    }

    // イベントリスナーを追加
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOnline, onOffline]);

  // デバッグ情報の表示
  if (showDebugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-surface-800 rounded-lg p-4 border border-surface-700 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium text-white">
              ネットワーク状態: {isOnline ? 'オンライン' : 'オフライン'}
            </span>
          </div>
          
          <div className="text-xs text-surface-400 space-y-1">
            <div>接続タイプ: {connectionType}</div>
            {lastOnline && (
              <div>最後のオンライン: {lastOnline.toLocaleTimeString()}</div>
            )}
            {lastOffline && (
              <div>最後のオフライン: {lastOffline.toLocaleTimeString()}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 通常の通知表示
  if (!isOnline) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            現在オフラインです。オンライン復帰時にデータは自動で同期されます
          </span>
        </div>
      </div>
    );
  }

  return null;
}

// テスト用のネットワーク状態シミュレーター
export const NetworkSimulator: React.FC = () => {
  const [simulateOffline, setSimulateOffline] = useState(false);

  const toggleNetwork = () => {
    setSimulateOffline(!simulateOffline);
    
    // navigator.onLine をシミュレート
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: !simulateOffline
    });
    
    // イベントを発火
    window.dispatchEvent(new Event(simulateOffline ? 'offline' : 'online'));
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-surface-800 rounded-lg p-4 border border-surface-700 shadow-lg">
        <h3 className="text-sm font-medium text-white mb-2">ネットワークテスト</h3>
        <button
          onClick={toggleNetwork}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            simulateOffline
              ? 'bg-red-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          {simulateOffline ? 'オンラインに戻す' : 'オフラインにする'}
        </button>
        <p className="text-xs text-surface-400 mt-2">
          現在: {simulateOffline ? 'オフライン' : 'オンライン'}
        </p>
      </div>
    </div>
  );
}; 
