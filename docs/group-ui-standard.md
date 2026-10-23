# Acecoreグループの共通UI適用

2026-10-23。基点は既存PR3 `feat/hatt-portfolio` の `8899e73e5b8b620e443c838217028903be0aab32`。このPRはPR3の上に積む。既存の8ページ、Hattの実作品6件、13制作サービス、料金、図、旧hash導線、9言語を保ち、コーポレートと共通の見出し・余白・操作・footerへ揃える。新規画像は生成しない。マージ・本番公開は未実施。

## 変更と保全

- 共通の白/ink `#071f3e`、Designsのaccent `#7140c4` / hover `#58309c` / wash `#f5f0fc`。元ロゴ・Hatt作品・元図解・画像の構図を保持する。
- 白いHeroと大きい主題、最大1296px前後の内容幅、64〜112pxの章間、矩形CTA、細い罫線、navy footer。作品と工程を主役にし、同形カードの反復をサービス行へ整理する。
- 制作分野の一覧はタイトル/説明/詳細を横に読む行、個別サービスは内容/税込開始料金/法人相談を並べる行。mobileは縦にして全情報を保つ。価格表の構造と開始料金の条件は変更しない。
- 全8ページ×9言語と404に共有スタイルを適用。Headerの現在地は詳細ページでもサービスにlocationを示し、長い翻訳では1400px未満をmenuへ切り替える。menu/言語のEscape・focusを保持する。
- 工程ページは同じflowBodyがページ見出し直下と工程章に2回あった。前者だけを省略し、工程章とHomeの説明、meta descriptionは保持。source JSON自体を変更しない。

## 表示内容の比較

基点をbuildして81 HTMLのtitle、main本文、mainの全href、画像src/ALT、IDを保存し、実装後と比較した。リンク・画像・ID・titleの差分0。本文は工程ページ9言語の同じ導入1回の省略だけを許可し、その正確な文字列1件を除いた結果の完全一致を確認した。その他の本文差分は0。

既存の出力validatorでも72通常ページ・9言語、13サービス/税込料金、6実作品、図、法人相談URL、catalog.json API、全内部リンク、SEO/sitemap、404、旧hash333件とno-JS案内を確認する。カタログ、UI翻訳、画像・public資産を変更しない。

## 検証

Node24.22.1をPATH先頭にし、同梱npm CLIを直接実行した。

```text
npm ci --ignore-scripts
npm run format:check
npm run validate:content
npm run build
node node_modules/prettier/bin/prettier.cjs <変更対象> --write
git diff --check
node <証拠フォルダ>/group-html-preservation.mjs <worktree> <baseline> compare <intentional-differences>
node <証拠フォルダ>/group-designs-qa.mjs
```

UIはJA全9家族の1440px/390px、英独露のHome/文章音声/Works/料金390px、計30画面で確認する。作品画像は各位置までスクロールしdecodeを待ち、naturalWidthで読み込みを確認する。短い390×667のmenu/言語のEscapeとfocus、全9言語への到達、desktop復帰、現在地も確認する。単なるネットワーク未描画を画像欠落と断定しない。

Browser/IABは利用できず、Playwright管理Chromiumの専用contextで確認する。実機・Safari/Firefox、外部の本物の問い合わせ送信は未実施。元の画像/本文/サービス条件を変えず、外部送信は追加しない。CI/Pages Previewと今回SHAはDraft PRへ記録する。専用ブラウザとpreviewを終了し、Draftのworktree/branchを保持する。
