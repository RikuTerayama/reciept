# クラウド同期設計案

## 概要
現在のローカルストレージベースの同期機能を、クラウドベースの同期システムに移行する設計案です。

## 推奨技術スタック

### 1. Supabase (推奨)
**理由**: 
- PostgreSQLベースで堅牢
- リアルタイム同期機能
- 認証機能が組み込み
- 無料枠が充実
- TypeScript対応が優れている

### 2. Firebase
**理由**:
- Googleの信頼性
- リアルタイム同期
- 認証機能が充実
- スケーラビリティが高い

### 3. Vercel Edge Functions + Supabase
**理由**:
- 既存のVercelデプロイと統合しやすい
- サーバーレスでコスト効率が良い
- リアルタイム同期が可能

## データベース設計

### テーブル構造

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 設定テーブル
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  currency VARCHAR(10) DEFAULT 'JPY',
  target_month VARCHAR(7) NOT NULL,
  budget DECIMAL(15,2) NOT NULL,
  language VARCHAR(10) DEFAULT 'ja',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 経費テーブル
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'JPY',
  category VARCHAR(255) NOT NULL,
  description TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 10.0,
  company_name VARCHAR(255),
  participant_from_client INTEGER DEFAULT 0,
  participant_from_company INTEGER DEFAULT 0,
  is_qualified VARCHAR(100) DEFAULT 'Not Qualified',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OCR結果テーブル
CREATE TABLE ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  ocr_text TEXT,
  confidence_score DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 最適化結果テーブル
CREATE TABLE optimization_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_budget DECIMAL(15,2) NOT NULL,
  selected_expenses JSONB,
  total_amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 実装手順

### Phase 1: 認証システムの導入
1. Supabase Auth の設定
2. メールアドレスベースのログイン機能
3. セッション管理

### Phase 2: データ同期の実装
1. ローカルストレージとクラウドDBの同期
2. オフライン対応（PWA機能）
3. 競合解決ロジック

### Phase 3: リアルタイム同期
1. Supabase Realtime の導入
2. 複数デバイス間のリアルタイム同期
3. プッシュ通知機能

## 移行戦略

### 段階的移行
1. **Phase 1**: 既存のローカルストレージ機能を維持しながら、クラウド同期を並行実装
2. **Phase 2**: ユーザーが選択できるように、ローカル/クラウドの切り替え機能を提供
3. **Phase 3**: クラウド同期をデフォルトに設定し、ローカルストレージをフォールバックとして維持

### データ移行
1. 既存ユーザーのローカルデータをクラウドに移行
2. データ整合性の検証
3. 移行完了後のローカルデータクリーンアップ

## セキュリティ考慮事項

### データ保護
- すべてのデータはユーザーIDで分離
- RLS (Row Level Security) の実装
- データ暗号化（転送時・保存時）

### 認証・認可
- JWT トークンベースの認証
- セッション管理
- アクセス制御

## パフォーマンス最適化

### キャッシュ戦略
- ローカルキャッシュの活用
- 必要なデータのみを同期
- バッチ処理による効率化

### オフライン対応
- Service Worker によるオフライン機能
- データの差分同期
- 競合解決アルゴリズム

## コスト予測

### Supabase の場合
- 無料枠: 500MB DB, 50MB ファイル, 2GB 転送
- 有料枠: $25/月から（大規模利用時）

### Firebase の場合
- 無料枠: 1GB DB, 10GB 転送
- 有料枠: 従量課金（小規模利用時は無料で十分）

## 実装優先度

### 高優先度
1. ユーザー認証システム
2. 基本的なCRUD操作
3. データ同期機能

### 中優先度
1. リアルタイム同期
2. オフライン対応
3. プッシュ通知

### 低優先度
1. 高度な分析機能
2. データエクスポート機能
3. バックアップ機能 
