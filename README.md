# レシート経費管理システム

OCR技術を使用したレシート・領収書の経費管理システムです。画像から経費情報を自動抽出し、データ管理・Excel出力・予算最適化機能を提供します。

## 🎯 主な機能

### 1. 画像からのOCR抽出
- **Tesseract.js**を使用した日本語・英語対応OCR
- 自動抽出項目：
  - 日付（YYYY-MM-DD形式）
  - 合計金額（税込み）
  - 税率（10%、8%、0%）
  - 適格請求書判定（Tから始まる番号の有無）

### 2. 経費データ管理
- 手動入力・編集機能
- ドロップダウン選択項目：
  - 通貨（35種類対応）
  - 経費カテゴリ（19種類）
  - 税率（10%、8%、0%）
  - 所属部署（9部署）
  - 適格/非適格区分（4種類）

### 3. 予算最適化エンジン
- 動的計画法による最適化
- 予算選択：10万円、15万円、20万円
- 指定予算に最も近い経費の組み合わせを自動提案

### 4. Excel出力機能
- 全経費データの出力
- 選択済み経費の出力
- 最適化結果の出力
- 複数シート対応（データ、サマリー、集計）

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **状態管理**: Zustand
- **OCR**: Tesseract.js
- **Excel出力**: SheetJS (xlsx)
- **UIアイコン**: Lucide React
- **ファイルアップロード**: React Dropzone

## 📦 セットアップ

### 前提条件
- Node.js 18.0.0以上
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd receipt-expense-manager
```

2. 依存関係をインストール
```bash
npm install
# または
yarn install
```

3. 開発サーバーを起動
```bash
npm run dev
# または
yarn dev
```

4. ブラウザでアクセス
```
http://localhost:3000
```

## 🚀 使用方法

### 1. 画像アップロード
1. 「画像アップロード」タブを選択
2. レシート画像をドラッグ&ドロップまたはクリックして選択
3. OCR処理が自動実行され、結果が表示されます

### 2. データ入力・編集
1. 「データ入力」タブを選択
2. OCR結果を確認し、必要に応じて手動で修正
3. 必須項目（日付、金額、カテゴリ、部署）を入力
4. 「追加」ボタンで経費データを登録

### 3. 経費リスト管理
1. 「経費リスト」タブを選択
2. 登録された経費データを確認
3. チェックボックスで経費を選択
4. 削除ボタンで不要なデータを削除

### 4. 予算最適化
1. 「予算最適化」タブを選択
2. 目標予算を選択（10万円、15万円、20万円）
3. 「最適化実行」ボタンをクリック
4. 最適な組み合わせが提案されます

### 5. Excel出力
- ヘッダーの「全件出力」で全経費データを出力
- 経費を選択後「選択出力」で選択済みデータを出力
- 最適化結果画面で「Excel出力」で最適化結果を出力

## 📁 プロジェクト構造

```
receipt-expense-manager/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ImageUpload.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   └── BudgetOptimizer.tsx
│   ├── lib/
│   │   ├── store.ts
│   │   ├── ocr.ts
│   │   ├── optimizer.ts
│   │   └── excel.ts
│   └── types/
│       └── index.ts
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔧 設定

### 環境変数
現在、特別な環境変数は必要ありません。

### OCR設定
- Tesseract.jsの言語設定：日本語（jpn）+ 英語（eng）
- 対応画像形式：JPEG, PNG, GIF, BMP

### 予算設定
`src/types/index.ts`で予算オプションを変更可能：
```typescript
export const BUDGET_OPTIONS: BudgetOption[] = [
  { id: '100000', amount: 100000, label: '10万円' },
  { id: '150000', amount: 150000, label: '15万円' },
  { id: '200000', amount: 200000, label: '20万円' }
];
```

## 🧪 テスト

### テスト用レシート画像
`public/sample-receipts/`ディレクトリにテスト用画像を配置することを推奨します。

### 手動テスト項目
1. 画像アップロード機能
2. OCR抽出精度
3. データ入力・編集
4. 予算最適化アルゴリズム
5. Excel出力機能

## 🚀 デプロイ

### Vercel（推奨）
1. GitHubリポジトリと連携
2. Vercelでプロジェクトをインポート
3. 自動デプロイが設定されます

### その他のプラットフォーム
- Netlify
- AWS Amplify
- Google Cloud Run

## 🤝 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🐛 既知の問題

- 一部の複雑なレシートレイアウトではOCR精度が低下する可能性があります
- 大規模なデータセット（100件以上）での最適化処理に時間がかかる場合があります

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページで報告してください。

---

**開発者**: Receipt Expense Manager Team  
**最終更新**: 2024年 