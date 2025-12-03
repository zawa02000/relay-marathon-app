# リレーマラソン記録用アプリ

複数人で同時にアクセス・記録できるリレーマラソンの記録アプリです。

## 機能

- 走者の事前登録と順番変更
- スタート/ラップ/ゴールボタンで自動計測
- ラップボタンの10秒クールダウン（誤操作防止）
- CSV形式での記録エクスポート
- パスワード保護によるアクセス制限
- リアルタイムでのデータ保存

## Vercelへのデプロイ手順

### 1. GitHubリポジトリの作成

1. [GitHub](https://github.com)にログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ名を入力（例：relay-marathon-app）
4. 「Public」を選択
5. 「Create repository」をクリック

### 2. コードのアップロード

ターミナル/コマンドプロンプトで以下を実行：

```bash
# プロジェクトフォルダに移動
cd relay-marathon-app

# Gitの初期化
git init

# ファイルをステージング
git add .

# コミット
git commit -m "Initial commit"

# GitHubリポジトリと連携（URLは自分のリポジトリに変更）
git remote add origin https://github.com/YOUR_USERNAME/relay-marathon-app.git

# プッシュ
git branch -M main
git push -u origin main
```

### 3. Vercelでデプロイ

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントと連携
3. ダッシュボードで「Add New...」→「Project」をクリック
4. GitHubから「relay-marathon-app」を選択
5. 「Deploy」ボタンをクリック

数分でデプロイが完了し、URLが発行されます！

## ローカルでの開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## 使い方

1. 初回アクセス時にパスワードを設定
2. 走者を順番に登録
3. 「スタート」で計測開始
4. 「ラップ」で次の走者に交代
5. 最後に「ゴール」
6. 「CSV出力」で記録をダウンロード

## 注意事項

- データはブラウザのlocalStorageに保存されます
- 各ユーザーのブラウザで個別にデータが管理されます
- 複数人で同時編集する場合は、1台のデバイスを共有するか、別途バックエンドの実装が必要です

## ライセンス

MIT