/**
 * 国際化（i18n）設定
 */

export type Language = 'ja' | 'en';

export interface Translations {
  // 共通
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    export: string;
    select: string;
    items: string;
    email: string;
    targetMonth: string;
    budget: string;
    user: string;
    version: string;
    settings: string;
    personalSettingEditable: string;
    personalSettings: string;
    clearAllLogs: string;
  };

  // ヘッダー
  header: {
  };

  // ナビゲーション
  navigation: {
    singleUpload: string;
    batchUpload: string;
    dataInput: string;
    expenseList: string;
    budgetOptimizer: string;
    menu: string;
  };

  // ウェルカムスクリーン
  welcome: {
    title: string;
    subtitle: string;
    description: string;
  };

  // 画像アップロード
  imageUpload: {
    title: string;
    description: string;
    dragDropText: string;
    cameraCapture: string;
    selectImage: string;
    receiptDetection: string;
    processing: string;
    detectingReceipt: string;
    compressingImage: string;
    ocrProcessing: string;
    processingComplete: string;
    uploadComplete: string;
    moveToDataInput: string;
    supportedFormats: string;
    receiptDetectionDescription: string;
    error: string;
    receiptDetectionFailed: string;
    usingOriginalImage: string;
  };

  // 一括アップロード
  batchUpload: {
    title: string;
    description: string;
    dragDropText: string;
    processing: string;
    completed: string;
    failed: string;
    remove: string;
    clearAll: string;
    startProcessing: string;
    processingStatus: string;
  };

  // データ入力
  dataInput: {
    title: string;
    date: string;
    amount: string;
    taxRate: string;
    currency: string;
    category: string;
    qualification: string;
    save: string;
    clear: string;
    validation: {
      required: string;
      invalidAmount: string;
      invalidTaxRate: string;
    };
    description: string;
    descriptionPlaceholder: string;
    companyName: string;
    companyNamePlaceholder: string;
    participantFromClient: string;
    participantFromCompany: string;
  };

  // 経費リスト
  expenseList: {
    title: string;
    description: string;
    noData: string;
    noDataDescription: string;
    expenseCount: string;
    selectedCount: string;
    exportSelected: string;
    downloadSelectedImages: string;
    date: string;
    amount: string;
    category: string;
    department: string;
    taxRate: string;
    qualification: string;
    receiptNumber: string;
    actions: string;
    totalAmount: string;
    selectedAmount: string;
    qualifiedExpenses: string;
  };

  // 予算最適化
  budgetOptimizer: {
    title: string;
    description: string;
    targetBudget: string;
    optimize: string;
    results: string;
    noResults: string;
    totalAmount: string;
    difference: string;
    selectedExpenses: string;
    availableExpenses: string;
    noExpenses: string;
  };

  // 統計情報
  statistics: {
    title: string;
    registeredExpenses: string;
    totalAmount: string;
    selected: string;
    selectedAmount: string;
  };

  // フッター
  footer: {
    copyright: string;
    builtWith: string;
  };

  // カテゴリ
  categories: {
    salariesExpense: string;
    intervieweeFee: string;
    telephoneAllowance: string;
    staffWelfare: string;
    staffTraining: string;
    recruitmentExpenses: string;
    employmentResidency: string;
    travelPerDiem: string;
    travelMeal: string;
    travelTransportation: string;
    travelOthers: string;
    travelAccommodation: string;
    entertainmentGifts: string;
    meetingsConferences: string;
    marketingAdvertising: string;
    marketResearch: string;
    rentalOthers: string;
    officeCleaning: string;
    repairMaintenance: string;
    insuranceCorporate: string;
    subscriptions: string;
    administrativeCourier: string;
    printingStationery: string;
    officeSupplies: string;
    sundryAdministrative: string;
    businessRegistration: string;
    finesPenalties: string;
    bankCharges: string;
    others: string;
    houseAllowance: string;
  };

  // 部署
  departments: {
    msd: string;
    dxd: string;
    isd: string;
    ssd: string;
    opd: string;
    fin: string;
    ia: string;
    eo: string;
    hdopd: string;
  };

  // 適格区分
  qualifications: {
    qualifiedInvoice: string;
    qualifiedPublicTransport: string;
    qualifiedBusinessTrip: string;
    notQualified: string;
  };

  // 通貨
  currencies: {
    php: string;
    thb: string;
    hkd: string;
    idr: string;
    try: string;
    cny: string;
    aud: string;
    nok: string;
    inr: string;
    huf: string;
    chf: string;
    mxn: string;
    rub: string;
    cad: string;
    krw: string;
    twd: string;
    kwd: string;
    eur: string;
    zar: string;
    nzd: string;
    sar: string;
    pln: string;
    pgk: string;
    myr: string;
    bhd: string;
    sgd: string;
    sek: string;
    jpy: string;
    gbp: string;
    czk: string;
    aed: string;
    dkk: string;
    usd: string;
    vnd: string;
    mmk: string;
    lbp: string;
  };
}

const translations: Record<Language, Translations> = {
  ja: {
    common: {
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      success: '成功しました',
      cancel: 'キャンセル',
      save: '保存',
      export: 'エクスポート',
      select: '選択してください',
      items: '件',
      email: 'メールアドレス',
      targetMonth: '対象月',
      budget: '予算金額',
      user: 'ユーザー',
      version: 'バージョン',
      settings: '設定',
      personalSettingEditable: '個人設定を編集可能',
      personalSettings: '個人設定',
      clearAllLogs: '全てのログをクリア'
    },
          header: {
      },
    navigation: {
      singleUpload: '単一アップロード',
      batchUpload: '一括アップロード',
      dataInput: 'データ入力',
      expenseList: '経費リスト',
      budgetOptimizer: '予算最適化',
      menu: 'メニュー',
    },
    welcome: {
      title: 'Welcome',
      subtitle: 'Expenscan',
      description: 'OCR技術による自動抽出・管理',
    },
    imageUpload: {
      title: 'レシート画像をアップロード',
      description: 'OCR技術を使用して画像から経費情報を自動抽出します。レシート自動検出機能により、背景を除去して精度を向上させます。',
      dragDropText: 'ドラッグ&ドロップまたはクリックして画像を選択',
      cameraCapture: 'カメラで撮影',
      selectImage: '画像を選択',
      receiptDetection: 'レシート自動検出',
      processing: '画像を処理中...',
      detectingReceipt: 'レシートを検出中...',
      compressingImage: '画像を圧縮中...',
      ocrProcessing: 'OCR処理中...',
      processingComplete: '処理完了！',
      uploadComplete: 'アップロード完了',
      moveToDataInput: '画像が正常に処理されました。データ入力画面に移動してください。',
      supportedFormats: 'サポートされている形式',
      receiptDetectionDescription: 'JPEG, PNG, GIF, BMP形式の画像ファイル。レシート自動検出機能により、背景を除去して精度を向上させます。',
      error: 'エラーが発生しました。',
      receiptDetectionFailed: 'レシート検出に失敗しました。元画像を使用します。',
      usingOriginalImage: 'レシート検出に失敗しました。元画像を使用します。',
    },
    batchUpload: {
      title: '一括アップロード',
      description: '複数のレシート画像を同時にアップロードして一括処理できます。レシート自動検出とOCR処理を効率的に実行します。',
      dragDropText: 'ドラッグ&ドロップまたはクリックして画像を選択',
      processing: '処理中',
      completed: '完了',
      failed: '失敗',
      remove: '削除',
      clearAll: 'すべてクリア',
      startProcessing: '処理開始',
      processingStatus: '処理状況',
    },
    dataInput: {
      title: 'データ入力',
      description: 'OCR結果を確認し、必要に応じて手動で修正してください。すべての項目を正確に入力することで、より良い分析が可能になります。',
      date: '日付',
      amount: '金額',
      taxRate: '税率',
      currency: '通貨',
      category: 'カテゴリ',
      department: '部署',
      qualification: '適格区分',
      receiptNumber: 'レシート番号',
      save: '保存',
      clear: 'クリア',
      validation: {
        required: 'この項目は必須です',
        invalidDate: '有効な日付を入力してください',
        invalidAmount: '有効な金額を入力してください',
        invalidTaxRate: '税率は0-100の間で入力してください'
      },
      description: '説明',
      descriptionPlaceholder: '経費の詳細を入力してください',
      companyName: '会社名',
      companyNamePlaceholder: '会社名を入力してください',
      participantFromClient: 'クライアント参加人数',
      participantFromCompany: '社内参加人数',
    },
    expenseList: {
      title: '経費リスト',
      description: '登録された経費データの一覧と管理',
      noData: '経費データがありません',
      noDataDescription: '画像をアップロードして経費データを追加してください',
      expenseCount: '件の経費データ',
      selectedCount: '件選択中',
      exportSelected: '選択した経費をエクスポート',
      downloadSelectedImages: '画像一括ダウンロード',
      date: '日付',
      amount: '金額',
      category: 'カテゴリ',
      department: '部署',
      taxRate: '税率',
      qualification: '適格区分',
      receiptNumber: 'レシート番号',
      actions: '操作',
      totalAmount: '総金額',
      selectedAmount: '選択金額',
      qualifiedExpenses: '適格経費',
    },
    budgetOptimizer: {
      title: '予算最適化',
      description: '指定された予算に最も近い経費の組み合わせを自動提案します。効率的な予算管理にお役立てください。',
      targetBudget: '目標予算',
      optimize: '最適化実行',
      results: '最適化結果',
      noResults: '最適化結果がありません',
      totalAmount: '総金額',
      difference: '予算差額',
      selectedExpenses: '選択された経費',
      availableExpenses: '利用可能な経費',
      noExpenses: '経費データがありません',
    },
    statistics: {
      title: '統計情報',
      registeredExpenses: '登録済み経費',
      totalAmount: '総金額',
      selected: '選択済み',
      selectedAmount: '選択金額',
    },
    footer: {
      copyright: '© 2025 Expenscan. Developed by RT. All rights reserved.',
      builtWith: 'Next.js + Tesseract.js + TailwindCSS で構築',
    },
    categories: {
      salariesExpense: '給与費 - 臨時・パートタイム',
      intervieweeFee: '面接者費用',
      telephoneAllowance: '電話手当',
      staffWelfare: '従業員福利厚生費',
      staffTraining: '従業員研修',
      recruitmentExpenses: '採用費用',
      employmentResidency: '就労・在留ビザ',
      travelPerDiem: '旅費・日当',
      travelMeal: '旅費・食事',
      travelTransportation: '旅費・交通費',
      travelOthers: '旅費・その他',
      travelAccommodation: '旅費・宿泊費',
      entertainmentGifts: '接待・贈答費',
      meetingsConferences: '会議・研修費',
      marketingAdvertising: 'マーケティング・広告費',
      marketResearch: '市場調査費',
      rentalOthers: '賃借料・その他',
      officeCleaning: 'オフィス清掃費',
      repairMaintenance: '修繕・維持費',
      insuranceCorporate: '保険料・法人',
      subscriptions: 'サブスクリプション',
      administrativeCourier: '管理・配送費',
      printingStationery: '印刷・文具費',
      officeSupplies: '事務用品費',
      sundryAdministrative: '雑費・管理費',
      businessRegistration: '事業登録・許可更新',
      finesPenalties: '罰金・違約金・その他',
      bankCharges: '銀行手数料',
      others: 'その他',
      houseAllowance: '住宅手当',
    },
    departments: {
      msd: 'MSD',
      dxd: 'DXD',
      isd: 'ISD',
      ssd: 'SSD',
      opd: 'OPD',
      fin: 'FIN',
      ia: 'IA',
      eo: 'EO',
      hdopd: 'HDOPD',
    },
    qualifications: {
      qualifiedInvoice: '適格請求書・領収書',
      qualifiedPublicTransport: '適格（公共交通機関の例外）',
      qualifiedBusinessTrip: '適格（出張・手当の例外）',
      notQualified: '不適格',
    },
    currencies: {
      php: 'PHP',
      thb: 'THB',
      hkd: 'HKD',
      idr: 'IDR',
      try: 'TRY',
      cny: 'CNY',
      aud: 'AUD',
      nok: 'NOK',
      inr: 'INR',
      huf: 'HUF',
      chf: 'CHF',
      mxn: 'MXN',
      rub: 'RUB',
      cad: 'CAD',
      krw: 'KRW',
      twd: 'TWD',
      kwd: 'KWD',
      eur: 'EUR',
      zar: 'ZAR',
      nzd: 'NZD',
      sar: 'SAR',
      pln: 'PLN',
      pgk: 'PGK',
      myr: 'MYR',
      bhd: 'BHD',
      sgd: 'SGD',
      sek: 'SEK',
      jpy: 'JPY',
      gbp: 'GBP',
      czk: 'CZK',
      aed: 'AED',
      dkk: 'DKK',
      usd: 'USD',
      vnd: 'VND',
      mmk: 'MMK',
      lbp: 'LBP',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      export: 'Export',
      select: 'Please select',
      items: 'items',
      email: 'Email Address',
      targetMonth: 'Target Month',
      budget: 'Budget Amount',
      user: 'User',
      version: 'Version',
      settings: 'Settings',
      personalSettingEditable: 'Edit personal settings',
      personalSettings: 'Personal Settings',
      clearAllLogs: 'Clear All Logs'
    },
          header: {
      },
    navigation: {
      singleUpload: 'Single Upload',
      batchUpload: 'Batch Upload',
      dataInput: 'Data Input',
      expenseList: 'Expense List',
      budgetOptimizer: 'Budget Optimizer',
      menu: 'Menu',
    },
    welcome: {
      title: 'Welcome',
      subtitle: 'Expenscan',
      description: 'Automatic extraction and management with OCR technology',
    },
    imageUpload: {
      title: 'Upload Receipt Image',
      description: 'Automatically extract expense information from images using OCR technology. Receipt auto-detection removes backgrounds to improve accuracy.',
      dragDropText: 'Drag & drop or click to select image',
      cameraCapture: 'Camera Capture',
      selectImage: 'Select Image',
      receiptDetection: 'Receipt Auto-Detection',
      processing: 'Processing image...',
      detectingReceipt: 'Detecting receipt...',
      compressingImage: 'Compressing image...',
      ocrProcessing: 'OCR processing...',
      processingComplete: 'Processing complete!',
      uploadComplete: 'Upload Complete',
      moveToDataInput: 'Image processed successfully. Please move to the data input screen.',
      supportedFormats: 'Supported Formats',
      receiptDetectionDescription: 'JPEG, PNG, GIF, BMP image files. Receipt auto-detection removes backgrounds to improve accuracy.',
      error: 'An error occurred.',
      receiptDetectionFailed: 'Receipt detection failed. Using original image.',
      usingOriginalImage: 'Receipt detection failed. Using original image.',
    },
    batchUpload: {
      title: 'Batch Upload',
      description: 'Upload multiple receipt images simultaneously for batch processing. Efficiently execute receipt detection and OCR processing.',
      dragDropText: 'Drag & drop or click to select images',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      remove: 'Remove',
      clearAll: 'Clear All',
      startProcessing: 'Start Processing',
      processingStatus: 'Processing Status',
    },
    dataInput: {
      title: 'Data Input',
      description: 'Review OCR results and manually correct as needed. Accurate input of all items enables better analysis.',
      date: 'Date',
      amount: 'Amount',
      taxRate: 'Tax Rate',
      currency: 'Currency',
      category: 'Category',
      department: 'Department',
      qualification: 'Qualification',
      receiptNumber: 'Receipt Number',
      save: 'Save',
      clear: 'Clear',
      validation: {
        required: 'This field is required',
        invalidAmount: 'Please enter a valid amount',
        invalidTaxRate: 'Tax rate must be between 0-100'
      },
      description: 'Description',
      descriptionPlaceholder: 'Enter expense details',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Enter company name',
      participantFromClient: 'Client Participants',
      participantFromCompany: 'Company Participants',
    },
    expenseList: {
      title: 'Expense List',
      description: 'List and management of registered expense data',
      noData: 'No expense data available',
      noDataDescription: 'Upload images to add expense data',
      expenseCount: 'expense items',
      selectedCount: 'selected',
      exportSelected: 'Export Selected Expenses',
      downloadSelectedImages: 'Download Selected Images',
      date: 'Date',
      amount: 'Amount',
      category: 'Category',
      department: 'Department',
      taxRate: 'Tax Rate',
      qualification: 'Qualification',
      receiptNumber: 'Receipt Number',
      actions: 'Actions',
      totalAmount: 'Total Amount',
      selectedAmount: 'Selected Amount',
      qualifiedExpenses: 'Qualified Expenses',
    },
    budgetOptimizer: {
      title: 'Budget Optimization',
      description: 'Automatically suggest expense combinations closest to specified budgets. Use for efficient budget management.',
      targetBudget: 'Target Budget',
      optimize: 'Run Optimization',
      results: 'Optimization Results',
      noResults: 'No optimization results available',
      totalAmount: 'Total Amount',
      difference: 'Budget Difference',
      selectedExpenses: 'Selected Expenses',
      availableExpenses: 'Available Expenses',
      noExpenses: 'No expense data available',
    },
    statistics: {
      title: 'Statistics',
      registeredExpenses: 'Registered Expenses',
      totalAmount: 'Total Amount',
      selected: 'Selected',
      selectedAmount: 'Selected Amount',
    },
    footer: {
      copyright: '© 2025 Expenscan. Developed by RT. All rights reserved.',
      builtWith: 'Built with Next.js + Tesseract.js + TailwindCSS',
    },
    categories: {
      salariesExpense: 'Salaries Expense - Temporary/Part-Time',
      intervieweeFee: 'Interviewee Fee',
      telephoneAllowance: 'Telephone Allowance',
      staffWelfare: 'Staff Welfare Expenses',
      staffTraining: 'Staff Training',
      recruitmentExpenses: 'Recruitment Expenses',
      employmentResidency: 'Employment Residency/Visa',
      travelPerDiem: 'Travel & Expenses - Per Diem',
      travelMeal: 'Travel & Expenses - Meal',
      travelTransportation: 'Travel & Expenses - Transportation',
      travelOthers: 'Travel & Expenses - Others',
      travelAccommodation: 'Travel & Expenses - Accommodation',
      entertainmentGifts: 'Entertainment & Gifts',
      meetingsConferences: 'Meetings & Conferences',
      marketingAdvertising: 'Marketing & Advertising',
      marketResearch: 'Market Research',
      rentalOthers: 'Rental - Others',
      officeCleaning: 'Office Cleaning',
      repairMaintenance: 'Repair & Maintenance',
      insuranceCorporate: 'Insurance Expense - Corporate',
      subscriptions: 'Subscriptions',
      administrativeCourier: 'Administrative Courier',
      printingStationery: 'Printing & Stationery',
      officeSupplies: 'Office Supplies',
      sundryAdministrative: 'Sundry Administrative Expenses',
      businessRegistration: 'Business Registration & License Renewal',
      finesPenalties: 'Fines & Penalties - Other',
      bankCharges: 'Bank Charges',
      others: 'Others',
      houseAllowance: 'House Allowance',
    },
    departments: {
      msd: 'MSD',
      dxd: 'DXD',
      isd: 'ISD',
      ssd: 'SSD',
      opd: 'OPD',
      fin: 'FIN',
      ia: 'IA',
      eo: 'EO',
      hdopd: 'HDOPD',
    },
    qualifications: {
      qualifiedInvoice: 'Qualified invoice/receipt',
      qualifiedPublicTransport: 'Qualified(by public transportation exception)',
      qualifiedBusinessTrip: 'Qualified(by business trip/allowance exception)',
      notQualified: 'Not Qualified',
    },
    currencies: {
      php: 'PHP',
      thb: 'THB',
      hkd: 'HKD',
      idr: 'IDR',
      try: 'TRY',
      cny: 'CNY',
      aud: 'AUD',
      nok: 'NOK',
      inr: 'INR',
      huf: 'HUF',
      chf: 'CHF',
      mxn: 'MXN',
      rub: 'RUB',
      cad: 'CAD',
      krw: 'KRW',
      twd: 'TWD',
      kwd: 'KWD',
      eur: 'EUR',
      zar: 'ZAR',
      nzd: 'NZD',
      sar: 'SAR',
      pln: 'PLN',
      pgk: 'PGK',
      myr: 'MYR',
      bhd: 'BHD',
      sgd: 'SGD',
      sek: 'SEK',
      jpy: 'JPY',
      gbp: 'GBP',
      czk: 'CZK',
      aed: 'AED',
      dkk: 'DKK',
      usd: 'USD',
      vnd: 'VND',
      mmk: 'MMK',
      lbp: 'LBP',
    },
  },
};

// 現在の言語を取得
export const getCurrentLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ja';
  return (localStorage.getItem('language') as Language) || 'ja';
};

// 言語を設定
export const setLanguage = (language: Language): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('language', language);
};

// 翻訳を取得
export const t = (key: string, language: Language = getCurrentLanguage()): string => {
  const keys = key.split('.');
  let value: Translations | string | Record<string, any> = translations[language];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, any>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
};

// 翻訳オブジェクトを取得
export const getTranslations = (language: Language = getCurrentLanguage()): Translations => {
  return translations[language];
}; 
