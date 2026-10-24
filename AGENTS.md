# Repository Guidelines

Acecore Designs の Astro 静的サイトです。

- 作業前に git status と worktree を確認し、専用 branch / worktree で変更する。
- 日本語・8翻訳のサービス内容の正本は `src/content/catalog/{locale}.json`。全13サービスの名称、税込開始料金、制作範囲を承認なく追加・変更しない。
- 料金は税込開始料金であり、一律料金・支払い受付として表示しない。Acecore の法人窓口から見積もる。
- 問い合わせ先は Acecore 公式サイトの locale 別 contact とし、`category=service&service=acecore-design&offering=<id>#contact-form` を保持する。
- `catalog.json` はこの正本をそのまま公開するAPI。`schemaVersion: 1` / `sourceUrl` / `locales` の契約を維持する。
- コーポレートサイトの CMS に同じ制作カタログを重複して持たせない。新しいCMS認証を作らない。
- UI は承認済みブランドカラー基準と既存ブランドロゴを維持する。未提供の制作実績や画像を追加しない。
- `npm run format:check`、`npm run validate:content`、`npm run build`、`git diff --check` を実行し、UI変更は可能な範囲でdesktop/mobileを確認する。
- GitHub の PR 文章は日本語とし、検証と未実施事項を記載して draft PR まで進める。明示がなければ merge しない。
- Cloudflare Pages は GitHub repository 連携を使い、Direct Upload を本番完了にしない。

## 承認済みブランドカラー

UI・ロゴ・配色の変更前に [ブランドカラーガイド](docs/brand-color-guidelines.md) と、リンク先のAcecore共通正本・承認見本を読む。共通ガイドの最新採用版を基準とし、旧球状仕様・単色テーマ・青の面積比率を再採用しない。写真・Hatt・実作品・本文・料金・翻訳・既存機能は保全する。
