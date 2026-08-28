# 筋トレログ

React + Vite + Recharts + Tailwind CSS で作った筋トレ記録アプリです。

## ローカル起動

```bash
npm install
npm run dev
```

## Vercel公開

GitHubへこのフォルダをリポジトリとしてpushし、Vercelで「Add New Project」→ GitHubリポジトリをImport → Deploy。

## データ保存について

記録はブラウザの `localStorage` に保存します。同じブラウザ・同じ端末では、ページを閉じても記録が残ります。

別のスマホやPCと自動同期する仕様ではありません。
