import { UserInfo, ExpenseData } from '@/types';

// クライアントサイドのみでFirebaseを初期化
let firebaseAuth: any = null;
let firebaseFirestore: any = null;

const initializeFirebase = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (firebaseAuth && firebaseFirestore) {
    return { auth: firebaseAuth, firestore: firebaseFirestore };
  }

  const { initializeApp } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const { getFirestore } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(app);
  firebaseFirestore = getFirestore(app);

  return { auth: firebaseAuth, firestore: firebaseFirestore };
};

// 新規登録
export const registerUser = async (email: string, password: string, userData: Omit<UserInfo, 'uid' | 'createdAt' | 'updatedAt'>) => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { setDoc, doc } = await import('firebase/firestore');

    const userCredential = await createUserWithEmailAndPassword(firebase.auth, email, password);
    const user = userCredential.user;
    
    const userInfo: UserInfo = {
      uid: user.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Firestoreにユーザー情報を保存
    await setDoc(doc(firebase.firestore, 'users', user.uid), userInfo);
    
    return userInfo;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ログイン
export const loginUser = async (email: string, password: string) => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { getDoc, doc } = await import('firebase/firestore');

    const userCredential = await signInWithEmailAndPassword(firebase.auth, email, password);
    const user = userCredential.user;
    
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(firebase.firestore, 'users', user.uid));
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
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { signOut } = await import('firebase/auth');
    await signOut(firebase.auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 認証状態の監視
export const onAuthStateChange = (callback: (user: UserInfo | null) => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const setupAuthListener = async () => {
    const firebase = await initializeFirebase();
    if (!firebase) return () => {};

    const { onAuthStateChanged } = await import('firebase/auth');
    const { getDoc, doc } = await import('firebase/firestore');

    return onAuthStateChanged(firebase.auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(firebase.firestore, 'users', firebaseUser.uid));
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

  setupAuthListener();
  return () => {};
};

// ユーザー設定の保存
export const saveUserSettings = async (uid: string, settings: Partial<UserInfo>) => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { updateDoc, doc } = await import('firebase/firestore');
    const userRef = doc(firebase.firestore, 'users', uid);
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
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { addDoc, collection } = await import('firebase/firestore');
    await addDoc(collection(firebase.firestore, 'users', uid, 'expenses'), {
      ...expense,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの取得
export const getExpenseData = async (uid: string, limitCount: number = 100): Promise<ExpenseData[]> => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { query, collection, getDocs, orderBy, limit } = await import('firebase/firestore');
    const expensesQuery = query(
      collection(firebase.firestore, 'users', uid, 'expenses'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
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

// 経費データの一括保存
export const saveExpenseDataBatch = async (uid: string, expenses: ExpenseData[]) => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { writeBatch, collection, doc } = await import('firebase/firestore');
    const batch = writeBatch(firebase.firestore);
    
    expenses.forEach(expense => {
      const expenseRef = doc(collection(firebase.firestore, 'users', uid, 'expenses'));
      batch.set(expenseRef, {
        ...expense,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// 経費データの更新
export const updateExpenseData = async (uid: string, expenseId: string, updates: Partial<ExpenseData>) => {
  try {
    const firebase = await initializeFirebase();
    if (!firebase) throw new Error('Firebase not initialized');

    const { runTransaction, doc } = await import('firebase/firestore');
    const expenseRef = doc(firebase.firestore, 'users', uid, 'expenses', expenseId);
    
    await runTransaction(firebase.firestore, async (transaction) => {
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
