import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserInfo, ExpenseData } from '@/types';

// 新規登録
export const registerUser = async (email: string, password: string, userData: Omit<UserInfo, 'uid' | 'createdAt' | 'updatedAt'>) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userInfo: UserInfo = {
      uid: user.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Firestoreにユーザー情報を保存
    await setDoc(doc(db, 'users', user.uid), userInfo);
    
    return userInfo;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ログイン
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserInfo;
    } else {
      throw new Error('User data not found');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ログアウト
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 認証状態の監視
export const onAuthStateChange = (callback: (user: UserInfo | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as UserInfo);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// ユーザー設定の保存
export const saveUserSettings = async (uid: string, settings: Partial<UserInfo>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...settings,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの保存
export const saveExpenseData = async (uid: string, expense: ExpenseData) => {
  try {
    await addDoc(collection(db, 'users', uid, 'expenses'), {
      ...expense,
      createdAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの取得（ページネーション対応）
export const getExpenseData = async (uid: string, limit: number = 100): Promise<ExpenseData[]> => {
  try {
    const expensesQuery = query(
      collection(db, 'users', uid, 'expenses'),
      orderBy('receiptDate', 'desc'),
      limit(limit as number)
    );
    const querySnapshot = await getDocs(expensesQuery);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as ExpenseData[];
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの一括保存（バッチ処理）
export const saveExpenseDataBatch = async (uid: string, expenses: ExpenseData[]) => {
  try {
    const batch = writeBatch(db);
    
    expenses.forEach(expense => {
      const docRef = doc(collection(db, 'users', uid, 'expenses'));
      batch.set(docRef, {
        ...expense,
        createdAt: new Date()
      });
    });
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの更新（トランザクション対応）
export const updateExpenseData = async (uid: string, expenseId: string, updates: Partial<ExpenseData>) => {
  try {
    const expenseRef = doc(db, 'users', uid, 'expenses', expenseId);
    
    await runTransaction(db, async (transaction) => {
      const expenseDoc = await transaction.get(expenseRef);
      if (!expenseDoc.exists()) {
        throw new Error('Expense not found');
      }
      
      transaction.update(expenseRef, {
        ...updates,
        updatedAt: new Date()
      });
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 
