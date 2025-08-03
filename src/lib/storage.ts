import { ExpenseData, UserInfo } from '@/types';

// ローカルストレージキー
const EXPENSES_KEY = 'expenses';
const USER_INFO_KEY = 'userInfo';
const USER_IMAGES_KEY = 'userImages';

// 経費データの保存
export const saveExpenses = (expenses: ExpenseData[]): void => {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Failed to save expenses:', error);
  }
};

// 経費データの取得
export const getExpenses = (): ExpenseData[] => {
  try {
    const data = localStorage.getItem(EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get expenses:', error);
    return [];
  }
};

// ユーザー情報の保存
export const saveUserInfo = (userInfo: UserInfo): void => {
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } catch (error) {
    console.error('Failed to save user info:', error);
  }
};

// ユーザー情報の取得
export const getUserInfo = (): UserInfo | null => {
  try {
    const data = localStorage.getItem(USER_INFO_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return null;
  }
};

// メールアドレスでユーザーデータを取得
export const loadUserDataByEmail = async (email: string): Promise<{ userInfo: UserInfo; expenses: ExpenseData[] } | null> => {
  try {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.email === email) {
      const expenses = getExpenses().filter(expense => expense.userEmail === email);
      return { userInfo, expenses };
    }
    return null;
  } catch (error) {
    console.error('Failed to load user data by email:', error);
    return null;
  }
};

// 画像データの保存
export const saveImageData = (email: string, imageData: string, fileName: string): void => {
  try {
    const userImages = getUserImages(email);
    userImages.push({
      fileName,
      imageData,
      createdAt: new Date().toISOString()
    });
    
    const allUserImages = getAllUserImages();
    allUserImages[email] = userImages;
    localStorage.setItem(USER_IMAGES_KEY, JSON.stringify(allUserImages));
  } catch (error) {
    console.error('Failed to save image data:', error);
  }
};

// ユーザーの画像データを取得
export const getUserImages = (email: string): Array<{ fileName: string; imageData: string; createdAt: string }> => {
  try {
    const allUserImages = getAllUserImages();
    return allUserImages[email] || [];
  } catch (error) {
    console.error('Failed to get user images:', error);
    return [];
  }
};

// 全ユーザーの画像データを取得
export const getAllUserImages = (): { [email: string]: Array<{ fileName: string; imageData: string; createdAt: string }> } => {
  try {
    const data = localStorage.getItem(USER_IMAGES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get all user images:', error);
    return {};
  }
};

// 画像データを削除
export const deleteImageData = (email: string, fileName: string): void => {
  try {
    const userImages = getUserImages(email);
    const filteredImages = userImages.filter(img => img.fileName !== fileName);
    
    const allUserImages = getAllUserImages();
    allUserImages[email] = filteredImages;
    localStorage.setItem(USER_IMAGES_KEY, JSON.stringify(allUserImages));
  } catch (error) {
    console.error('Failed to delete image data:', error);
  }
};

// 経費データに画像URLを追加
export const addImageToExpense = (expenseId: string, imageUrl: string, fileName: string): void => {
  try {
    const expenses = getExpenses();
    const updatedExpenses = expenses.map(expense => {
      if (expense.id === expenseId) {
        return {
          ...expense,
          imageUrl,
          imageFileName: fileName
        };
      }
      return expense;
    });
    
    saveExpenses(updatedExpenses);
  } catch (error) {
    console.error('Failed to add image to expense:', error);
  }
}; 
