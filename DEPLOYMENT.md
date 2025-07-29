# Vercelデプロイ手順書

## 概要
Expenscanレシート経費管理システムをVercelにデプロイして、Webアプリケーションとして公開する手順です。

## 前提条件
- GitHubアカウント
- Vercelアカウント（GitHubアカウントで連携可能）

## デプロイ手順

### 1. GitHubリポジトリの準備

#### 1.1 新しいリポジトリを作成
1. GitHubにログイン
2. 「New repository」をクリック
3. リポジトリ名: `expenscan-receipt-manager`
4. 説明: `OCR技術を使用したレシート・領収書の経費管理システム`
5. Public/Privateを選択
6. 「Create repository」をクリック

#### 1.2 ローカルプロジェクトをGitHubにプッシュ
```bash
# プロジェクトディレクトリで実行
git init
git add .
git commit -m "Initial commit: Expenscan receipt manager"
git branch -M main
git remote add origin https://github.com/yourusername/expenscan-receipt-manager.git
git push -u origin main
```

### 2. Vercelでのデプロイ

#### 2.1 Vercelアカウントの準備
1. [Vercel](https://vercel.com)にアクセス
2. GitHubアカウントでログイン
3. 必要に応じてVercelアカウントを作成

#### 2.2 プロジェクトのインポート
1. Vercelダッシュボードで「New Project」をクリック
2. 「Import Git Repository」を選択
3. GitHubリポジトリ一覧から`expenscan-receipt-manager`を選択
4. 「Import」をクリック

#### 2.3 プロジェクト設定
1. **Project Name**: `expenscan-receipt-manager`
2. **Framework Preset**: Next.js（自動検出されるはず）
3. **Root Directory**: `./`（デフォルト）
4. **Build Command**: `npm run build`（デフォルト）
5. **Output Directory**: `.next`（デフォルト）
6. **Install Command**: `npm install`（デフォルト）

#### 2.4 環境変数の設定
現在、特別な環境変数は必要ありません。

#### 2.5 デプロイ実行
1. 「Deploy」をクリック
2. ビルドプロセスが開始されます（約2-3分）
3. デプロイが完了すると、本番URLが表示されます

### 3. デプロイ後の確認

#### 3.1 基本動作確認
- 本番URLにアクセス
- 初期設定画面が表示されることを確認
- 各機能が正常に動作することを確認

#### 3.2 機能テスト
1. **初期設定**
   - メールアドレス、対象月、部署、予算を入力
   - 設定保存が正常に動作することを確認

2. **OCR機能**
   - レシート画像をアップロード
   - OCR処理が正常に動作することを確認

3. **データ管理**
   - 経費データの入力・編集・削除
   - データが正常に保存されることを確認

4. **予算最適化**
   - 目標予算を設定
   - 最適化アルゴリズムが正常に動作することを確認

5. **Excel出力**
   - データのExcel出力が正常に動作することを確認

### 4. カスタムドメインの設定（オプション）

#### 4.1 ドメインの追加
1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」タブをクリック
3. 「Domains」セクションで「Add Domain」をクリック
4. カスタムドメインを入力（例：`expenscan.yourdomain.com`）

#### 4.2 DNS設定
1. ドメインプロバイダーのDNS設定で以下を追加：
   - Type: CNAME
   - Name: expenscan
   - Value: cname.vercel-dns.com

### 5. 自動デプロイの設定

#### 5.1 GitHub連携の確認
- GitHubリポジトリに変更をプッシュすると自動でデプロイされます
- プルリクエストを作成するとプレビューデプロイが作成されます

#### 5.2 ブランチ戦略
- `main`ブランチ: 本番環境
- `develop`ブランチ: 開発環境（オプション）
- フィーチャーブランチ: プレビュー環境

### 6. パフォーマンス最適化

#### 6.1 Vercel Analytics
1. Vercelダッシュボードで「Analytics」を有効化
2. パフォーマンス指標を監視

#### 6.2 画像最適化
- Next.js Image componentを使用
- WebP形式の自動変換

#### 6.3 キャッシュ戦略
- Vercel Edge Networkを活用
- 静的アセットのキャッシュ設定

### 7. セキュリティ設定

#### 7.1 HTTPS強制
- Vercelは自動でHTTPSを提供
- HTTPからHTTPSへの自動リダイレクト

#### 7.2 セキュリティヘッダー
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### 8. 監視・ログ

#### 8.1 Vercel Functions Logs
- サーバーレス関数のログを確認
- エラーの監視

#### 8.2 パフォーマンス監視
- Core Web Vitals
- ページロード時間
- エラー率

### 9. トラブルシューティング

#### 9.1 ビルドエラー
```bash
# ローカルでビルドテスト
npm run build
```

#### 9.2 依存関係エラー
```bash
# package.jsonの確認
npm install
npm run build
```

#### 9.3 環境変数エラー
- Vercelダッシュボードで環境変数を確認
- ローカル環境との差異を確認

### 10. 更新・メンテナンス

#### 10.1 コード更新
```bash
git add .
git commit -m "Update: 機能改善"
git push origin main
```

#### 10.2 依存関係更新
```bash
npm update
git add package.json package-lock.json
git commit -m "Update: 依存関係の更新"
git push origin main
```

## デプロイ完了後のURL例
- 本番環境: `https://expenscan-receipt-manager.vercel.app`
- プレビュー環境: `https://expenscan-receipt-manager-git-feature-branch.vercel.app`

## 注意事項
- 無料プランでは月間100GBの帯域幅制限があります
- サーバーレス関数の実行時間制限は10秒です
- ファイルサイズ制限は50MBです

## サポート
- Vercelドキュメント: https://vercel.com/docs
- Next.jsドキュメント: https://nextjs.org/docs
- GitHub Issues: プロジェクト固有の問題 
