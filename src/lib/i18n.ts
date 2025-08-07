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
    reset: string;
    confirmReset: string;
    confirmDelete: string;
    edit: string;
    delete: string;
    download: string;
    actions: string;
    processing: string;
  };

  // 認証
  auth: {
    login: string;
    register: string;
    error: string;
    passwordPlaceholder: string;
    noAccount: string;
    hasAccount: string;
  };

  // ヘッダー
  header: {
    title: string;
  };

  // ナビゲーション
  navigation: {
    singleUpload: string;
    singleUploadDesc: string;
    batchUpload: string;
    batchUploadDesc: string;
    dataInput: string;
    dataInputDesc: string;
    dataEntry: string;
    expenseList: string;
    expenseListDesc: string;
    budgetOptimizer: string;
    budgetOptimizerDesc: string;
    menu: string;
  };

  // ウェルカムスクリーン
  welcome: {
    title: string;
    subtitle: string;
    description: string;
    officeSelection: string;
    offices: {
      singapore: string;
      japan: string;
      shanghai: string;
      hongkong: string;
      taiwan: string;
      indonesiaJakarta: string;
      indonesiaSurabaya: string;
      malaysia: string;
      philippines: string;
      thailand: string;
      vietnam: string;
      indiaBangalore: string;
      indiaGurgaon: string;
      indiaMumbai: string;
      indiaNewDelhi: string;
      uae: string;
      canada: string;
      usaNewYork: string;
      netherlands: string;
      france: string;
    };
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
    supportedFormats: string;
  };

  // データ入力
  dataInput: {
    title: string;
    description: string;
    date: string;
    amount: string;
    taxRate: string;
    currency: string;
    category: string;
    qualification: string;
    receiptNumber: string;
    save: string;
    clear: string;
    validation: {
      required: string;
      invalidAmount: string;
      invalidTaxRate: string;
      invalidEmail: string;
    };
    descriptionField: string;
    descriptionPlaceholder: string;
    companyName: string;
    companyNamePlaceholder: string;
    participantFromClient: string;
    participantFromCompany: string;
    isQualified: string;
    qualified: string;
    nonQualified: string;
    participantPlaceholder: string;
    totalAmount: string;
    selectCategory: string;
    receiptDate: string;
    cancel: string;
    saving: string;
    categories: {
      transport: string;
      food: string;
      accommodation: string;
      meeting: string;
      communication: string;
      other: string;
    };
  };

    // 経費フォーム
  expenseForm: {
    description: string;
    rechargedToClient: string;
    gstVatApplicable: string;
  };

  // 経費リスト
  expenseList: {
    title: string;
    description: string;
    noData: string;
    noDataDescription: string;
    noExpenses: string;
    addFirstExpense: string;
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
    editExpense: string;
    searchPlaceholder: string;
    noSearchResults: string;
    sort: {
      dateDesc: string;
      dateAsc: string;
      amountDesc: string;
      amountAsc: string;
      categoryAsc: string;
      categoryDesc: string;
    };
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

  // 残予算表示
  budgetDisplay: {
    remaining: string;
    budget: string;
    registered: string;
  };

  // 統計情報
  stats: {
    totalAmount: string;
    totalExpenses: string;
    qualifiedExpenses: string;
    selectedAmount: string;
  };

  // 統計情報
  statistics: {
    title: string;
    registeredExpenses: string;
    totalAmount: string;
    selected: string;
    selectedAmount: string;
    myBudget: string;
    budgetDifference: string;
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
      clearAllLogs: '全てのログをクリア',
      reset: '全データリセット',
      confirmReset: 'すべてのデータをリセットしますか？',
      confirmDelete: 'この項目を削除しますか？',
      edit: '編集',
      delete: '削除',
      download: 'ダウンロード',
      actions: '操作',
      processing: '処理中...',
    },
    auth: {
      login: 'ログイン',
      register: '新規登録',
      error: '認証エラーが発生しました',
      passwordPlaceholder: 'パスワードを入力してください',
      noAccount: 'アカウントをお持ちでない方はこちら',
      hasAccount: '既にアカウントをお持ちの方はこちら',
    },
    header: {
      title: 'Expenscan',
    },
    navigation: {
      singleUpload: '単一アップロード',
      singleUploadDesc: 'レシート画像を1枚ずつアップロードしてOCR処理',
      batchUpload: '一括アップロード',
      batchUploadDesc: '複数のレシート画像を同時にアップロードして一括処理',
      dataInput: 'データ入力',
      dataInputDesc: '経費情報を手動で入力・編集',
      dataEntry: 'データ入力',
      expenseList: '経費リスト',
      expenseListDesc: '登録済み経費の一覧表示と管理',
      budgetOptimizer: '予算最適化',
      budgetOptimizerDesc: '指定された予算に最も近い経費の組み合わせを自動提案',
      menu: 'メニュー',
    },
    welcome: {
      title: 'Welcome',
      subtitle: 'Expenscan',
      description: 'OCR技術による自動抽出・管理',
      officeSelection: 'オフィス選択',
      offices: {
        singapore: 'シンガポール',
        japan: '日本',
        shanghai: '上海',
        hongkong: '香港',
        taiwan: '台湾',
        indonesiaJakarta: 'インドネシア - ジャカルタ',
        indonesiaSurabaya: 'インドネシア - スラバヤ',
        malaysia: 'マレーシア',
        philippines: 'フィリピン',
        thailand: 'タイ',
        vietnam: 'ベトナム',
        indiaBangalore: 'インド - バンガロール',
        indiaGurgaon: 'インド - グルガオン',
        indiaMumbai: 'インド - ムンバイ',
        indiaNewDelhi: 'インド - ニューデリー',
        uae: 'アラブ首長国連邦',
        canada: 'カナダ',
        usaNewYork: 'アメリカ合衆国 - ニューヨーク',
        netherlands: 'オランダ',
        france: 'フランス',
      },
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
      supportedFormats: 'サポートされている形式：JPG / PNG / PDF',
    },
    dataInput: {
      title: 'データ入力',
      description: 'OCR結果を確認し、必要に応じて手動で修正してください。すべての項目を正確に入力することで、より良い分析が可能になります。',
      date: '日付',
      amount: '金額',
      taxRate: '税率',
      currency: '通貨',
      category: 'カテゴリ',
      qualification: '適格区分',
      receiptNumber: 'レシート番号',
      save: '保存',
      clear: 'クリア',
      validation: {
        required: 'この項目は必須です',
        invalidAmount: '有効な金額を入力してください',
        invalidTaxRate: '税率は0-100の間で入力してください',
        invalidEmail: '有効なメールアドレスを入力してください'
      },
      descriptionField: '説明',
      descriptionPlaceholder: '経費の詳細を入力してください',
      companyName: '会社名',
      companyNamePlaceholder: '会社名を入力してください',
      participantFromClient: 'クライアント参加人数',
      participantFromCompany: '社内参加人数',
      isQualified: '適格区分',
      qualified: '適格',
      nonQualified: '不適格',
      participantPlaceholder: '参加人数を入力してください',
      totalAmount: '合計金額',
      selectCategory: 'カテゴリを選択',
      receiptDate: '領収書日付',
      cancel: 'キャンセル',
      saving: '保存中...',
      categories: {
        transport: '交通費',
        food: '食費',
        accommodation: '宿泊費',
        meeting: '会議費',
        communication: '通信費',
        other: 'その他',
      },
    },
    expenseForm: {
      description: '経費情報を手動で入力・編集します。OCR結果の確認や新規データの入力に使用できます。',
      rechargedToClient: 'クライアント請求有無',
      gstVatApplicable: 'GST/VAT適用有無',
    },
    expenseList: {
      title: '経費リスト',
      description: '登録された経費データの一覧と管理',
      noData: '経費データがありません',
      noDataDescription: '画像をアップロードして経費データを追加してください',
      noExpenses: '経費データがありません',
      addFirstExpense: '最初の経費を追加してください',
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
      editExpense: '経費編集',
      searchPlaceholder: '経費を検索...',
      noSearchResults: '検索条件に一致する経費が見つかりません',
      sort: {
        dateDesc: '日付（新しい順）',
        dateAsc: '日付（古い順）',
        amountDesc: '金額（高い順）',
        amountAsc: '金額（低い順）',
        categoryAsc: 'カテゴリ（A-Z）',
        categoryDesc: 'カテゴリ（Z-A）',
      },
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
    budgetDisplay: {
      remaining: '残りの使用可能金額',
      budget: '予算',
      registered: '登録済',
    },
    stats: {
      totalAmount: '総金額',
      totalExpenses: '登録件数',
      qualifiedExpenses: '適格経費件数',
      selectedAmount: '選択金額',
    },
    statistics: {
      title: '統計情報',
      registeredExpenses: '登録済み経費',
      totalAmount: '総金額',
      selected: '選択済み',
      selectedAmount: '選択金額',
      myBudget: '私の予算',
      budgetDifference: '予算差額',
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
      clearAllLogs: 'Clear All Logs',
      reset: 'Reset All Data',
      confirmReset: 'Are you sure you want to reset all data?',
      confirmDelete: 'Are you sure you want to delete this item?',
      edit: 'Edit',
      delete: 'Delete',
      download: 'Download',
      actions: 'Actions',
      processing: 'Processing...',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      error: 'Authentication error occurred',
      passwordPlaceholder: 'Enter password',
      noAccount: 'Don\'t have an account? Click here',
      hasAccount: 'Already have an account? Click here',
    },
    header: {
      title: 'Expenscan',
    },
    navigation: {
      singleUpload: 'Single Upload',
      singleUploadDesc: 'Upload receipt images one by one for OCR processing',
      batchUpload: 'Batch Upload',
      batchUploadDesc: 'Upload multiple receipt images simultaneously for batch processing',
      dataInput: 'Data Input',
      dataInputDesc: 'Manually input and edit expense information',
      dataEntry: 'Data Entry',
      expenseList: 'Expense List',
      expenseListDesc: 'View and manage registered expenses',
      budgetOptimizer: 'Budget Optimizer',
      budgetOptimizerDesc: 'Automatically suggest expense combinations closest to specified budgets',
      menu: 'Menu',
    },
    welcome: {
      title: 'Welcome',
      subtitle: 'Expenscan',
      description: 'Automatic extraction and management with OCR technology',
      officeSelection: 'Office Selection',
      offices: {
        singapore: 'Singapore',
        japan: 'Japan',
        shanghai: 'Shanghai',
        hongkong: 'Hong Kong',
        taiwan: 'Taiwan',
        indonesiaJakarta: 'Indonesia - Jakarta',
        indonesiaSurabaya: 'Indonesia - Surabaya',
        malaysia: 'Malaysia',
        philippines: 'Philippines',
        thailand: 'Thailand',
        vietnam: 'Vietnam',
        indiaBangalore: 'India - Bangalore',
        indiaGurgaon: 'India - Gurgaon',
        indiaMumbai: 'India - Mumbai',
        indiaNewDelhi: 'India - New Delhi',
        uae: 'United Arab Emirates',
        canada: 'Canada',
        usaNewYork: 'United States - New York',
        netherlands: 'Netherlands',
        france: 'France',
      },
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
      supportedFormats: 'Supported formats: JPG / PNG / PDF',
    },
    dataInput: {
      title: 'Data Input',
      description: 'Review OCR results and manually correct as needed. Accurate input of all items enables better analysis.',
      date: 'Date',
      amount: 'Amount',
      taxRate: 'Tax Rate',
      currency: 'Currency',
      category: 'Category',
      qualification: 'Qualification',
      receiptNumber: 'Receipt Number',
      save: 'Save',
      clear: 'Clear',
      validation: {
        required: 'This field is required',
        invalidAmount: 'Please enter a valid amount',
        invalidTaxRate: 'Tax rate must be between 0-100',
        invalidEmail: 'Please enter a valid email address'
      },
      descriptionField: 'Description',
      descriptionPlaceholder: 'Enter expense details',
      companyName: 'Company Name',
      companyNamePlaceholder: 'Enter company name',
      participantFromClient: 'Client Participants',
      participantFromCompany: 'Company Participants',
      isQualified: 'Qualification',
      qualified: 'Qualified',
      nonQualified: 'Non-Qualified',
      participantPlaceholder: 'Enter number of participants',
      totalAmount: 'Total Amount',
      selectCategory: 'Select Category',
      receiptDate: 'Receipt Date',
      cancel: 'Cancel',
      saving: 'Saving...',
      categories: {
        transport: 'Transportation',
        food: 'Food',
        accommodation: 'Accommodation',
        meeting: 'Meeting',
        communication: 'Communication',
        other: 'Other',
      },
    },
    expenseForm: {
      description: 'Manually input and edit expense information. Used for reviewing OCR results or entering new data.',
      rechargedToClient: 'Recharged to Client',
      gstVatApplicable: 'GST/VAT Applicable',
    },
    expenseList: {
      title: 'Expense List',
      description: 'List and management of registered expense data',
      noData: 'No expense data available',
      noDataDescription: 'Upload images to add expense data',
      noExpenses: 'No expenses available',
      addFirstExpense: 'Add your first expense',
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
      editExpense: 'Edit Expense',
      searchPlaceholder: 'Search expenses...',
      noSearchResults: 'No expenses match your search criteria',
      sort: {
        dateDesc: 'Date (Newest First)',
        dateAsc: 'Date (Oldest First)',
        amountDesc: 'Amount (High to Low)',
        amountAsc: 'Amount (Low to High)',
        categoryAsc: 'Category (A-Z)',
        categoryDesc: 'Category (Z-A)',
      },
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
    budgetDisplay: {
      remaining: 'Remaining Budget',
      budget: 'Budget',
      registered: 'Registered',
    },
    stats: {
      totalAmount: 'Total Amount',
      totalExpenses: 'Total Expenses',
      qualifiedExpenses: 'Qualified Expenses',
      selectedAmount: 'Selected Amount',
    },
    statistics: {
      title: 'Statistics',
      registeredExpenses: 'Registered Expenses',
      totalAmount: 'Total Amount',
      selected: 'Selected',
      selectedAmount: 'Selected Amount',
      myBudget: 'My Budget',
      budgetDifference: 'Budget Difference',
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
export const t = (key: string, language: Language = getCurrentLanguage(), defaultValue?: string): string => {
  try {
    // languageがundefinedの場合はデフォルト言語を使用
    const currentLang = language || getCurrentLanguage();
    
    // translationsオブジェクトが存在しない場合の対策
    if (!translations || !translations[currentLang]) {
      console.warn(`Translation not found for language: ${currentLang}, key: ${key}`);
      return defaultValue || key;
    }
    
    const keys = key.split('.');
    let value: Translations | string | Record<string, any> = translations[currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, any>)[k];
      } else {
        console.warn(`Translation key not found: ${key} in language: ${currentLang}`);
        return defaultValue || key;
      }
    }
    
    return typeof value === 'string' ? value : (defaultValue || key);
  } catch (error) {
    console.error('Translation error:', error, 'key:', key, 'language:', language);
    return defaultValue || key;
  }
};

// 翻訳オブジェクトを取得
export const getTranslations = (language: Language = getCurrentLanguage()): Translations => {
  return translations[language];
}; 
