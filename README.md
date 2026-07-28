# 降りつぶし

`降りつぶし.md` のフェーズ1設計に沿った Next.js + Supabase 実装です。

## セットアップ

1. `.env.example` を元に `.env.local` を作成
2. `NEXT_PUBLIC_SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を設定
3. 依存関係をインストール
4. `npm run dev`

## 実装範囲

- 現在地周辺の駅表示
- 会社種別 -> 会社 -> 路線 の記録導線
- 路線詳細兼記録画面
- 駅記録画面
- 区間記録画面

## 注意

- Supabase へのアクセスはサーバー側から行います
- 履歴テーブルは `is_deleted = false` を現行版として扱っています
