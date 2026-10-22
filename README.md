# Acecore Designs

デザイン・3D・文章・音声制作を案内する Acecore の専用サイトです。
Astro の静的出力で、日本語と8翻訳に対応します。

- 公開URL: <https://designs.acecore.net/>
- 運営: 株式会社Acecore — <https://acecore.net/>
- リポジトリ: `acecore-systems/acecore-designs`

## 開発・検証

Node.js は `.node-version` の 24.22.1 を使用します。

```sh
npm ci
npm run dev
```

```sh
npm run format:check
npm run validate:content
npm run build
git diff --check
```

`npm run build` は共有画像生成、静的サイトのビルド、出力検証を実行します。
出力検証では13サービス×9言語の料金と文言、問い合わせURL、公開JSON、内部リンク・アセット、canonical・hreflang・OG、sitemap、404を確認します。
GitHub Actions も同じコマンドを実行します。公開済み外部サイトへの問い合わせ送信は行いません。

```sh
npm run preview -- --host 127.0.0.1 --port 4324
```

## サービス内容の更新

正本は `src/content/catalog/{locale}.json` です。`ja`、`en`、`zh-cn`、`es`、`pt`、`fr`、`ko`、`de`、`ru` の9ファイルを管理します。
初回移行は `acecore-net` の確定コミット `aad03f5` の日本語 `src/i18n/source/ja/pages/designs.json` と各翻訳の `pages.designs` を、本文・料金・条件を変えずに移しています。

1. 変更内容の承認を確認し、日本語の正本を更新します。
2. キー・サービスID・数値料金を揃えて8翻訳を更新します。金額はすべて円建ての税込開始料金です。
3. 料金・対象言語を承認に基づいて変更した場合は `tests/approved-services.mjs` も更新します。IDを変える場合は会社サイトの問い合わせ名マップとの整合も確認します。
4. 検証して branch / draft PR へ反映します。desktop / mobile の表示・言語選択・メニュー・問い合わせ先も確認します。

サイト共通UIと404文言は `src/content/ui/{locale}.json` で管理します。
制作カタログの編集はこのリポジトリへ集約し、会社サイトのCMSには重複する編集画面を置きません。このサイトはCMS認証や問い合わせフォームを新設しません。
`public/favicon.svg` は既存の Acecore ブランドロゴです。OG画像は同じロゴとサイト名だけを `scripts/generate-og.mjs` で生成し、架空の制作実績は掲載しません。

## 公開カタログの契約

`GET /catalog.json` は静的ファイルとして出力されます。

```json
{
  "schemaVersion": 1,
  "sourceUrl": "https://designs.acecore.net/",
  "locales": {
    "ja": {},
    "en": {},
    "zh-cn": {},
    "es": {},
    "pt": {},
    "fr": {},
    "ko": {},
    "de": {},
    "ru": {}
  }
}
```

上記の `{}` には各言語の正本オブジェクト全体（`title`、`priceLabel`、`groups`、条件文など）がそのまま入ります。
画面と構造化データも同じ正本を使用します。会社サイトのAI案内はこの公開JSONを取得して利用できます。
破壊的な構造変更には schemaVersion の更新と利用側との調整が必要です。`public/_headers` は公開JSONのCORSを許可します。

問い合わせ先は `https://acecore.net/{locale-prefix}contact/?category=service&service=acecore-design&offering=<id>#contact-form` です。
日本語だけ locale prefix を付けません。研修・制作支援は <https://schools.acecore.net/learning/#creative-services> へ案内します。

## ルートとSEO

- 日本語: `/`、各翻訳: `/en/`、`/zh-cn/`、`/es/`、`/pt/`、`/fr/`、`/ko/`、`/de/`、`/ru/`
- 正規URLと hreflang / x-default は専用ドメインを参照します。
- sitemap: `/sitemap-index.xml`、robots: `/robots.txt`
- 404: `/404.html` と各翻訳の `/{locale}/404/`。すべて noindex、canonical / hreflang は付けません。Cloudflare Pages が未知のURLへ返す既定404はルートの日本語版で、言語選択から各言語へ戻れます。

## Cloudflare Pages

本番は GitHub repository 連携で作成します。Direct Upload は使用しません。

| 設定                   | 値                                |
| ---------------------- | --------------------------------- |
| Project name           | `acecore-designs`                 |
| Git provider           | GitHub                            |
| Source repository      | `acecore-systems/acecore-designs` |
| Production branch      | `main`                            |
| Build command          | `npm run build`                   |
| Build output directory | `dist`                            |
| Root directory         | リポジトリルート                  |
| Node.js                | `24.22.1`（`.node-version`）      |
| Custom domain          | `designs.acecore.net`             |

本番完了時は Git Provider: Yes、source repository、`github:push` による production deploy 成功、custom domain の active をそれぞれ確認します。
PRとローカル確認は本番公開の完了を意味しません。
