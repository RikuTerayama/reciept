'use client';

import React, { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { useExpenseStore } from '../src/lib/store';
import { getCurrentLanguage, t } from '../src/lib/i18n';
import { loadUserDataByEmail } from '../src/lib/storage';
import { APP_VERSION } from '../src/lib/constants';
import { useAuthStore } from '../src/lib/auth-store';
import { onAuthStateChange } from '../src/lib/auth-service';
import { 
  syncUserData, 
  syncExpenseData, 
  restoreUserData, 
  saveOfflineData, 
  syncOnOnline,
  clearAllData,
  setupNetworkListener 
} from '../src/lib/sync-service';
import ImageUpload from '../src/components/ImageUpload';
import BatchUpload from '../src/components/BatchUpload';
import ExpenseForm from '../src/components/ExpenseForm';
import ExpenseList from '../src/components/ExpenseList';
import BudgetOptimizer from '../src/components/BudgetOptimizer';
import UserSetup from '../src/components/UserSetup';
import LanguageSwitcher from '../src/components/LanguageSwitcher';
import BudgetDisplay from '../src/components/BudgetDisplay';
import AuthForm from '../src/components/AuthForm';
import OfflineIndicator from '../src/components/OfflineIndicator';
import NetworkStatus, { NetworkSimulator } from '../src/components/NetworkStatus';
import VoiceInput from '../src/components/VoiceInput';
import { Settings, Menu, X, UploadCloud, FileText, Pencil, BarChart3, Camera, FolderOpen, Edit3, List, LogOut, Mic } from 'lucide-react';
import { ExpenseData } from '../src/types';
import { calculateTotalAmountWithRounding } from '../src/lib/currency';

// 型定義
interface UserData {
  email: string;
  targetMonth: string;
  budget: number;
  currency?: string;
  office?: string;
}

export default function Home() {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    targetMonth: '',
    budget: 100000,
    office: 'japan'
  });
  
  // 認証状態
  const { user, loading: authLoading, setUser, logout } = useAuthStore();
  
  // モーダル状態
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showDataInputModal, setShowDataInputModal] = useState(false);
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVoiceInputModal, setShowVoiceInputModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();

  // 基本的な初期化処理
  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  // 音声入力完了時の処理
  const handleVoiceInputComplete = (result: any) => {
    console.log('Voice input completed:', result);
    setShowVoiceInputModal(false);
    setShowDataInputModal(true);
  };

  const handleSingleUpload = () => {
    setShowUploadModal(true);
  };

  const handleBatchUpload = () => {
    setShowBatchUploadModal(true);
  };

  const handleDataInput = () => {
    setShowDataInputModal(true);
  };

  const handleExpenseList = () => {
    setShowExpenseListModal(true);
  };

  const handleOptimizer = () => {
    setShowOptimizerModal(true);
  };

  const navigationItems = [
    { key: 'singleUpload', label: '単一アップロード', action: handleSingleUpload },
    { key: 'batchUpload', label: '一括アップロード', action: handleBatchUpload },
    { key: 'dataInput', label: 'データ入力', action: handleDataInput },
    { key: 'expenseList', label: '経費リスト', action: handleExpenseList },
    { key: 'budgetOptimizer', label: '予算最適化', action: handleOptimizer },
  ];

  // ローディング状態の表示
  if (isLoading || !isClient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <SWRConfig
      value={{
        fetcher: (resource, init) => fetch(resource, init).then(res => res.json()),
        revalidateOnFocus: false,
        dedupingInterval: 10000,
        errorRetryCount: 2,
        onError: (error) => {
          console.error('SWR Error:', error);
        },
      }}
    >
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        {/* ヘッダー */}
        <header className="border-b border-gray-800 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* ロゴ */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
                  title="ホームに戻る"
                >
                  <img 
                    src="/Expenscan_new_logo.png" 
                    alt="Expenscan Logo" 
                    className="h-8 w-auto object-contain max-w-full sm:h-10"
                    style={{ maxHeight: '40px' }}
                  />
                </button>
              </div>

              {/* 中央: ナビゲーション（デスクトップ） */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={item.action}
                    className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* 右: アクション */}
              <div className="flex items-center space-x-3">
                {/* 認証状態に応じたボタン */}
                {user ? (
                  <>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                      title="設定"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          setUserInfo(null);
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors duration-200"
                      title="ログアウト"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                  >
                    ログイン
                  </button>
                )}
                
                {/* モバイルメニューボタン */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* モバイルナビゲーション */}
            {showMobileMenu && (
              <div className="md:hidden border-t border-gray-800 bg-gray-800/95 backdrop-blur-sm">
                <nav className="flex flex-col space-y-1 py-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        item.action();
                        setShowMobileMenu(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200 text-center"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* メインコンテンツエリア */}
            <div className="mt-8">
              {userInfo ? (
                <div className="space-y-8">
                  {/* クイックアクション */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <button
                      onClick={handleSingleUpload}
                      className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500 transition-colors">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-white mb-1">単一アップロード</h3>
                        <p className="text-sm text-gray-400">レシート画像を1枚ずつアップロード</p>
                      </div>
                    </button>

                    <button
                      onClick={handleBatchUpload}
                      className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500 transition-colors">
                          <FolderOpen className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-white mb-1">一括アップロード</h3>
                        <p className="text-sm text-gray-400">複数のレシート画像を同時にアップロード</p>
                      </div>
                    </button>

                    <button
                      onClick={handleDataInput}
                      className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500 transition-colors">
                          <Edit3 className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-white mb-1">データ入力</h3>
                        <p className="text-sm text-gray-400">経費情報を手動で入力・編集</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setShowVoiceInputModal(true)}
                      className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500 transition-colors">
                          <Mic className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-white mb-1">音声入力</h3>
                        <p className="text-sm text-gray-400">音声で経費情報を入力</p>
                      </div>
                    </button>

                    <button
                      onClick={handleExpenseList}
                      className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500 transition-colors">
                          <List className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-medium text-white mb-1">経費リスト</h3>
                        <p className="text-sm text-gray-400">登録済み経費の一覧表示と管理</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                // 設定画面
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4 text-white">Welcome</h2>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 mx-auto">
                    <h3 className="text-xl font-semibold mb-6 text-center text-white">設定</h3>
                    <div className="text-center text-gray-400">
                      アプリケーションの初期設定を行ってください
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* モーダル */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <h2 className="text-xl font-semibold text-white text-center flex-1">単一アップロード</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <ImageUpload 
                  onOCRComplete={(ocrResult) => {
                    console.log('OCR Result:', ocrResult);
                    setShowUploadModal(false);
                    setShowDataInputModal(true);
                  }}
                  onComplete={() => {
                    setShowUploadModal(false);
                    setShowDataInputModal(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showBatchUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <h2 className="text-xl font-semibold text-white text-center flex-1">一括アップロード</h2>
                <button
                  onClick={() => setShowBatchUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <BatchUpload 
                onComplete={() => {
                  setShowBatchUploadModal(false);
                  setShowDataInputModal(true);
                }}
              />
            </div>
          </div>
        )}

        {showDataInputModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <h2 className="text-xl font-semibold text-white text-center flex-1">データ入力</h2>
                <button
                  onClick={() => setShowDataInputModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <ExpenseForm onSave={(expenseData) => {
                  addExpense(expenseData);
                  setShowDataInputModal(false);
                }} />
              </div>
            </div>
          </div>
        )}

        {showExpenseListModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <h2 className="text-xl font-semibold text-white text-center flex-1">経費リスト</h2>
                <button
                  onClick={() => setShowExpenseListModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center">
                <ExpenseList activeMonth={userInfo?.targetMonth ?? ''} />
              </div>
            </div>
          </div>
        )}

        {showOptimizerModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1"></div>
                <h2 className="text-xl font-semibold text-white text-center flex-1">予算最適化</h2>
                <button
                  onClick={() => setShowOptimizerModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <BudgetOptimizer hideTitle={true} activeMonth={userInfo?.targetMonth ?? ''} />
            </div>
          </div>
        )}

        {/* 音声入力モーダル */}
        {showVoiceInputModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <VoiceInput
              onComplete={handleVoiceInputComplete}
              onCancel={() => setShowVoiceInputModal(false)}
            />
          </div>
        )}

        {/* 認証モーダル */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {authMode === 'login' ? 'ログイン' : '新規登録'}
                </h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AuthForm 
                mode={authMode}
                onSuccess={(userInfo) => {
                  setUser(userInfo);
                  setShowAuthModal(false);
                }}
                onCancel={() => setShowAuthModal(false)}
              />
            </div>
          </div>
        )}

        {/* フッター */}
        <footer className="border-t border-gray-800 bg-gray-800/50 backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-400">
              © 2025 Expenscan. All rights reserved. Developed by Riku Terayama
            </div>
          </div>
        </footer>
      </div>
    </SWRConfig>
  );
}
