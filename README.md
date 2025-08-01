# Expenscan - レシート経費管理システム

## 概要
OCR技術を使用したレシート・領収書の経費管理システムです。WebアプリケーションとしてVercelにデプロイされ、誰でもブラウザからアクセスできます。

## 🌐 ライブデモ
[Expenscan](https://expenscan-receipt-manager.vercel.app) - 実際にアプリケーションをお試しください

## 主な機能
- **OCR処理**: レシート画像から自動で経費情報を抽出
- **データ管理**: 経費データの入力・編集・削除
- **予算最適化**: 指定予算内での最適な経費組み合わせを提案
- **Excel出力**: 経費データをExcelファイルとして出力
- **レスポンシブデザイン**: スマートフォン・タブレット・PCに対応

## 🚀 デプロイ方法

### Vercelでのデプロイ（推奨）

1. **GitHubリポジトリの準備**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/expenscan.git
   git push -u origin main
   ```

2. **Vercelでのデプロイ**
   - [Vercel](https://vercel.com)にアクセス
   - GitHubアカウントでログイン
   - 「New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクト名を設定（例：expenscan-receipt-manager）
   - 「Deploy」をクリック

3. **自動デプロイの設定**
   - GitHubリポジトリに変更をプッシュすると自動でデプロイされます
   - 本番環境のURLが提供されます

### 手動デプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# プロジェクトディレクトリで実行
vercel

# 本番環境にデプロイ
vercel --prod
```

## 🛠️ ローカル開発

### 必要な環境
- Node.js 18.0.0以上
- npm または yarn

### セットアップ
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### アクセス
ブラウザで http://localhost:3000 にアクセス

## 📱 使用方法

### 1. 初期設定
初回アクセス時に以下の情報を入力：
- メールアドレス
- 対象月
- 部署
- 予算

### 2. レシート処理
1. **単一アップロード**: 1枚ずつレシート画像をアップロード
2. **一括アップロード**: 複数画像を一度にアップロード
3. **OCR処理**: 自動で経費情報を抽出
4. **データ確認**: 抽出結果を確認・編集

### 3. データ管理
- 経費データの一覧表示
- 手動でのデータ入力・編集
- データの削除

### 4. 予算最適化
- 目標予算を設定
- 最適な経費の組み合わせを自動提案
- 予算内での効率的な経費管理

### 5. データ出力
- 全経費データのExcel出力
- 選択済みデータのExcel出力
- 最適化結果のExcel出力

## 🏗️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **状態管理**: Zustand
- **OCR**: Tesseract.js
- **Excel出力**: SheetJS (xlsx)
- **UIアイコン**: Lucide React
- **ファイルアップロード**: React Dropzone
- **デプロイ**: Vercel

## 🔧 設定

### 環境変数
Firebase認証機能を使用する場合は、以下の環境変数を設定してください：

```bash
# .env.local ファイルを作成
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

### Firebase設定手順
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication でメール/パスワード認証を有効化
3. Firestore Database を作成
4. プロジェクト設定から設定値を取得し、環境変数に設定

### カスタマイズ
- `src/types/index.ts`: 予算オプションの変更
- `src/lib/ocr.ts`: OCR設定の調整
- `src/lib/optimizer.ts`: 最適化アルゴリズムの調整

## 📊 対応機能

### OCR対応項目
- 日付（YYYY-MM-DD形式）
- 合計金額（税込み）
- 税率（10%、8%、0%）
- 適格請求書判定

### 経費カテゴリ
- 交通費、通信費、会議費
- 接待費、研修費、消耗品費
- その他19種類のカテゴリ

### 通貨対応
- 日本円（¥）
- 米ドル（$）
- ユーロ（€）
- その他35種類の通貨

## 🚀 パフォーマンス最適化

- **画像最適化**: Next.js Image component使用
- **コード分割**: 動的インポートでバンドルサイズ削減
- **キャッシュ戦略**: Vercel Edge Network活用
- **SEO最適化**: メタデータと構造化データ対応

## 🔒 セキュリティ

- **クライアントサイド処理**: 機密データはブラウザ内で処理
- **ファイル検証**: アップロードファイルの形式・サイズチェック
- **XSS対策**: Reactの自動エスケープ機能
- **CSRF対策**: Next.jsの組み込みセキュリティ機能

## 📈 監視・分析

### Vercel Analytics
- ページビュー
- パフォーマンス指標
- エラー監視

### カスタム分析
- ユーザー行動の追跡
- 機能使用率の測定
- パフォーマンスボトルネックの特定

## 🤝 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

- **GitHub Issues**: バグ報告・機能要望
- **ドキュメント**: 詳細な使用方法
- **コミュニティ**: ユーザー同士のサポート

---

**開発者**: Expenscan Team  
**最終更新**: 2024年  
**ライブデモ**: [https://expenscan-receipt-manager.vercel.app](https://expenscan-receipt-manager.vercel.app) 
