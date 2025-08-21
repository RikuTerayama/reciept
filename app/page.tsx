'use client';

import dynamicImport from 'next/dynamic';
import React, { useState, useEffect } from 'react';

// 静的生成を無効化してSSRを強制
export const dynamic = 'force-dynamic';

// 静的生成を無効化
export function generateStaticParams() {
  return [];
}
import { SWRConfig } from 'swr';
import { useExpenseStore } from '@/lib/store';
import { getCurrentLanguage, t } from '@/lib/i18n';
import { loadUserDataByEmail } from '@/lib/storage';
import { APP_VERSION } from '@/lib/constants';
import { useAuthStore } from '@/lib/auth-store';
import { onAuthStateChange } from '@/lib/auth-service';
import { 
  syncUserData, 
  syncExpenseData, 
  restoreUserData, 
  saveOfflineData, 
  syncOnOnline,
  clearAllData,
  setupNetworkListener 
  } from '@/lib/sync-service';
import ImageUpload from '@/components/ImageUpload';
import BatchUpload from '@/components/BatchUpload';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import BudgetOptimizer from '@/components/BudgetOptimizer';
import UserSetup from '@/components/UserSetup';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import BudgetDisplay from '@/components/BudgetDisplay';
import AuthForm from '@/components/AuthForm';
// 動的インポートでクライアントコンポーネントを読み込み
const OfflineIndicator = dynamicImport(() => import('@/components/OfflineIndicator'), {
  ssr: false,
  loading: () => <div className="hidden" />
});

const NetworkStatus = dynamicImport(() => import('@/components/NetworkStatus').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <div className="hidden" />
});

const VoiceInput = dynamicImport(() => import('@/components/VoiceInput'), {
  ssr: false,
  loading: () => <div className="hidden" />
});
import { Settings, Menu, X, UploadCloud, FileText, Pencil, BarChart3, Camera, FolderOpen, Edit3, List, LogOut, Mic } from 'lucide-react';
import { ExpenseData, OCRResult } from '@/types';
import { calculateTotalAmountWithRounding } from '@/lib/currency';

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
    office: 'japan' // デフォルトで日本を選択
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

  // クライアントサイド判定と初期化
  useEffect(() => {
    console.log('Home component mounting...');
    setIsClient(true);
    
    // 初期化処理
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // ローカルストレージからユーザー情報を読み込み
        const savedUserInfo = localStorage.getItem('userInfo');
        if (savedUserInfo) {
          const parsed = JSON.parse(savedUserInfo);
          setUserInfo(parsed);
          setFormData({
            email: parsed.email || '',
            targetMonth: parsed.targetMonth || '',
            budget: parsed.budget || 100000,
            office: parsed.office || 'japan'
          });
        }
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // 認証状態の監視とデータ同期
  useEffect(() => {
    if (!isClient) return;

    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      
      if (user) {
        setUser(user);
        
        // 非同期処理を別関数で実行
        const handleUserData = async () => {
          try {
            console.log('Restoring user data...');
            // 初回ログイン時のデータ復元
            const restoredData = await restoreUserData(user.uid);
            if (restoredData) {
              console.log('User data restored successfully');
            }
          } catch (error) {
            console.error('Error restoring user data:', error);
          }
        };
        
        handleUserData();
      } else {
        setUser(null);
        console.log('User logged out, clearing local data');
      }
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, [isClient, setUser]);

  // ネットワーク状態の監視
  useEffect(() => {
    if (!isClient) return;

    console.log('Setting up network listener...');
    
    const handleOnline = async () => {
      console.log('Network came online, syncing data...');
      try {
        if (user) {
          await syncOnOnline(user.uid);
        }
        console.log('Data sync completed');
      } catch (error) {
        console.error('Data sync failed:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isClient, user]);

  // ユーザー情報の保存
  const saveUserInfo = async (userData: UserData) => {
    try {
      console.log('Saving user info:', userData);
      
      // ローカルストレージに保存
      localStorage.setItem('userInfo', JSON.stringify(userData));
      setUserInfo(userData);
      
      // ユーザーがログインしている場合はFirebaseにも保存
      if (user) {
        console.log('User is logged in, saving to Firebase...');
        await syncUserData(user.uid, userData);
        console.log('User data saved to Firebase');
      }
      
      console.log('User info saved successfully');
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  };

  // OCR結果を経費データに変換
  const convertOCRResultToExpense = (ocrResult: OCRResult): ExpenseData => {
    return {
      id: `ocr_${Date.now()}`,
      date: ocrResult.date || new Date().toISOString().split('T')[0],
      totalAmount: ocrResult.totalAmount || 0,
      description: ocrResult.description || ocrResult.text || '',
      category: ocrResult.category || 'その他',
      createdAt: new Date(),
      updatedAt: new Date(),
      ocrText: ocrResult.text,
      receiptNumber: ocrResult.receiptNumber,
      companyName: ocrResult.companyName
    };
  };

  // 経費データの追加
  const handleAddExpense = async (expenseData: ExpenseData) => {
    try {
      console.log('Adding expense:', expenseData);
      
      // ローカルストアに追加
      addExpense(expenseData);
      
      // ユーザーがログインしている場合はFirebaseにも保存
      if (user) {
        console.log('User is logged in, saving expense to Firebase...');
        await syncExpenseData(user.uid, [expenseData]);
        console.log('Expense saved to Firebase');
      }
      
      console.log('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // OCR完了時の処理
  const handleOCRComplete = async (ocrResult: OCRResult) => {
    try {
      console.log('OCR completed:', ocrResult);
      
      // OCR結果を経費データに変換
      const expenseData = convertOCRResultToExpense(ocrResult);
      
      // 経費データを追加
      await handleAddExpense(expenseData);
      
      // アップロードモーダルを閉じる
      setShowUploadModal(false);
      
    } catch (error) {
      console.error('Error handling OCR result:', error);
    }
  };

  // 経費データの更新
  const handleUpdateExpense = async (expenseData: ExpenseData) => {
    try {
      console.log('Updating expense:', expenseData);
      
      // ローカルストアを更新
      updateExpense(expenseData);
      
      // ユーザーがログインしている場合はFirebaseにも保存
      if (user) {
        console.log('User is logged in, updating expense in Firebase...');
        await syncExpenseData(user.uid, [expenseData]);
        console.log('Expense updated in Firebase');
      }
      
      console.log('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  // 経費データの削除
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      console.log('Deleting expense:', expenseId);
      
      // ローカルストアから削除
      deleteExpense(expenseId);
      
      // ユーザーがログインしている場合はFirebaseからも削除
      if (user) {
        console.log('User is logged in, deleting expense from Firebase...');
        // Firebaseからの削除処理を実装
        console.log('Expense deleted from Firebase');
      }
      
      console.log('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // データのエクスポート
  const handleExportData = async () => {
    try {
      console.log('Exporting data...');
      
      // 経費データをExcelファイルとしてエクスポート
      const filename = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
      await import('@/lib/excel').then(({ exportExpensesToExcel }) => 
        exportExpensesToExcel(expenses, filename)
      );
      
      console.log('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // データのインポート
  const handleImportData = async (file: File) => {
    try {
      console.log('Importing data from file:', file.name);
      
      // ファイルの内容を読み込み
      const text = await file.text();
      const lines = text.split('\n');
      
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) { // ヘッダー行をスキップ
        const line = lines[i].trim();
        if (!line) continue;
        
        const [date, amount, description, category] = line.split(',');
        if (date && amount) {
          const expenseData: ExpenseData = {
            id: `imported_${Date.now()}_${i}`,
            date: date,
            totalAmount: parseFloat(amount),
            description: description || '',
            category: category || 'その他',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          handleAddExpense(expenseData);
          importedCount++;
        }
      }
      
      console.log(`Imported ${importedCount} expenses successfully`);
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  // 予算最適化
  const handleBudgetOptimization = async (targetBudget: number) => {
    try {
      console.log('Starting budget optimization with target:', targetBudget);
      
      // 予算最適化の処理を実装
             const { optimizeBudget } = await import('@/lib/optimizer');
      const optimizedExpenses = optimizeBudget(expenses, targetBudget);
      
      console.log('Budget optimization completed');
      return optimizedExpenses;
    } catch (error) {
      console.error('Error during budget optimization:', error);
      return null;
    }
  };

  // 音声入力の処理
  const handleVoiceInput = async (transcript: string) => {
    try {
      console.log('Processing voice input:', transcript);
      
      // 音声入力を解析して経費データを抽出
             const { parseSpeechResult } = await import('@/lib/speech/parseJa');
      const parsedData = parseSpeechResult(transcript);
      
      if (parsedData && parsedData.amount) {
        const expenseData: ExpenseData = {
          id: `voice_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          totalAmount: parsedData.amount,
          description: parsedData.transcript,
          category: 'その他',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        handleAddExpense(expenseData);
        console.log('Voice input processed successfully');
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">アプリケーションを初期化中...</p>
        </div>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <SWRConfig>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* ロゴ */}
              <div className="flex items-center">
                <img 
                  src="/Expenscan_new_logo.png" 
                  alt="Expenscan" 
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-semibold text-gray-900">Expenscan</span>
              </div>

              {/* ナビゲーション */}
              <nav className="hidden md:flex space-x-8">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.singleUpload', currentLanguage, '単一アップロード')}
                </button>
                <button
                  onClick={() => setShowBatchUploadModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.batchUpload', currentLanguage, '一括アップロード')}
                </button>
                <button
                  onClick={() => setShowDataInputModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.dataInput', currentLanguage, 'データ入力')}
                </button>
                <button
                  onClick={() => setShowExpenseListModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.expenseList', currentLanguage, '経費リスト')}
                </button>
                <button
                  onClick={() => setShowOptimizerModal(true)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('navigation.budgetOptimizer', currentLanguage, '予算最適化')}
                </button>
              </nav>

              {/* 右側のメニュー */}
              <div className="flex items-center space-x-4">
                {/* 言語切り替え */}
                <LanguageSwitcher 
                  currentLanguage={currentLanguage} 
                  onLanguageChange={setCurrentLanguage} 
                />

                {/* 音声入力ボタン */}
                <button
                  onClick={() => setShowVoiceInputModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  title="音声入力"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* 設定ボタン */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  title="設定"
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* ユーザーメニュー */}
                <div className="relative">
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  {/* ドロップダウンメニュー */}
                  {showMobileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      {user ? (
                        <>
                          <button
                            onClick={() => {
                              logout();
                              setShowMobileMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut className="w-4 h-4 inline mr-2" />
                            ログアウト
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowAuthModal(true);
                            setShowMobileMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          ログイン
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総経費</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{expenses.reduce((sum, expense) => sum + expense.totalAmount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <List className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">件数</p>
                  <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit3 className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今月</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ¥{expenses
                      .filter(expense => {
                        const expenseDate = new Date(expense.date);
                        const now = new Date();
                        return expenseDate.getMonth() === now.getMonth() && 
                               expenseDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, expense) => sum + expense.totalAmount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">カテゴリ</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(expenses.map(expense => expense.category)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">レシート撮影</h3>
                  <p className="text-sm text-gray-600">カメラでレシートを撮影してOCR処理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowBatchUploadModal(true)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <UploadCloud className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">一括アップロード</h3>
                  <p className="text-sm text-gray-600">複数のレシートをまとめて処理</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowDataInputModal(true)}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">手動入力</h3>
                  <p className="text-sm text-gray-600">経費データを手動で入力</p>
                </div>
              </div>
            </button>
          </div>

          {/* 最近の経費 */}
          {expenses.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">最近の経費</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">¥{expense.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* モーダル */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">レシートアップロード</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ImageUpload onOCRComplete={handleOCRComplete} />
            </div>
          </div>
        )}

        {showBatchUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">一括アップロード</h2>
                <button
                  onClick={() => setShowBatchUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <BatchUpload onComplete={() => {}} />
            </div>
          </div>
        )}

        {showDataInputModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">経費データ入力</h2>
                <button
                  onClick={() => setShowDataInputModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ExpenseForm onSave={handleAddExpense} />
            </div>
          </div>
        )}

        {showExpenseListModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">経費リスト</h2>
                <button
                  onClick={() => setShowExpenseListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ExpenseList 
                onEdit={handleUpdateExpense}
                onDelete={handleDeleteExpense}
              />
            </div>
          </div>
        )}

        {showOptimizerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">予算最適化</h2>
                <button
                  onClick={() => setShowOptimizerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <BudgetOptimizer />
            </div>
          </div>
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">設定</h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <UserSetup 
                onSave={saveUserInfo}
              />
            </div>
          </div>
        )}

        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {authMode === 'login' ? 'ログイン' : '新規登録'}
                </h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      authMode === 'login'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ログイン
                  </button>
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      authMode === 'register'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    新規登録
                  </button>
                </div>
                <AuthForm 
                  mode={authMode}
                  onSuccess={() => setShowAuthModal(false)}
                  onCancel={() => setShowAuthModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {showVoiceInputModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">音声入力</h2>
                <button
                  onClick={() => setShowVoiceInputModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
                             <VoiceInput 
                 onComplete={(result) => {
                   if (result.amount) {
                     handleVoiceInput(result.transcript);
                   }
                 }}
                 onCancel={() => setShowVoiceInputModal(false)}
               />
            </div>
          </div>
        )}

        {/* オフラインインジケーター */}
        <OfflineIndicator />

        {/* ネットワークステータス */}
        <NetworkStatus />

        {/* バージョン情報 */}
        <div className="fixed bottom-4 right-4 text-xs text-gray-400">
          v{APP_VERSION}
        </div>
      </div>
    </SWRConfig>
  );
}


