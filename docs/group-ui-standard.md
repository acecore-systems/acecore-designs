# Acecoreグループの共通UI適用

本書は過去の実装・検証記録です。配色・ロゴの現行仕様は [ブランドカラーガイド](brand-color-guidelines.md) とリンク先の承認見本を優先し、ここに記載した旧色・単色テーマを現行仕様として再採用しません。情報保全と検証の記録は引き続き有効です。

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

## 2026年10月23日追補: テーマ色とロゴ

最新のユーザー指示に合わせ、見出し・中立本文をcharcoal `#20252b`、主張する色面・CTA・ナビ・検索/AIを各事業のテーマ濃淡へ揃えた。以前の共通navy大面積方針はこの追補で置き換える。Systems/コーポレートはblue `#0656d9` と濃色 `#0446b5`、Schoolsはgreen `#087d62` / `#065f4b`、Designsはpurple `#7140c4` / `#58309c`。コーポレート内の3事業カラーは保持した。

ロゴは既存SVGの中央pathのfill1属性だけを変更し、34ノードの外形・clipPath・座標・その他fillは基点と一致。Schoolsは同形のローカルfaviconを追加し、header/About/footer/favicon（404を含む）へ使う。暗いfooterでは全白filterを廃止し、小さい白い下地で外形とテーマ色の丸を両立する。Designsのコード生成OGは、同じ文字・位置・外形のまま背景gradient/補助色と中央ロゴをpurpleへ同期した。許可差分はテーマSVG中央fill、SchoolsローカルSVG追加、DesignsのOG装飾色のみ。写真・作品・Cast原画像/登録・説明・価格は変更していない。

配色QAは全52ページ種別の1440/390px、計104画面で実施。h1のcomputedは全てcharcoal、footerのcomputedは各濃色に一致。横溢れ・壊れた画像・pageerror0。大型色面のDOM色監査で他テーマの候補は0。logo、menu/language、検索結果、AI応答のopen状態をモックで確認。本文/リンク/title/id/画像src・ALTの803HTML比較は、許可したSchools Aboutのロゴsrcだけが意図差分、その他0。学校footerのelement撮影に映ったsticky header/skip linkは、通常viewport撮影で再確認し、非focus skip linkの矩形bottom<=0を確認した（コード変更なし）。

白とaccentはblue6.29/green5.10/purple6.50:1、白と濃色footerは全て4.5:1以上。全サイトのWCAG適合認定を意味しない。警告/エラー/成功など意味のある状態色は保持し、図の文章・構造・画像は保ったままCSS装飾色を同期した。

検証は `npm run build`、各repoで必要なcontent/企業/SEO検証、変更対象Prettier check、`git diff --check`。実機・実API回答・本番フォーム送信は未実施。Browser inventoryにIABが無く、既存Edgeの無関係タブのみだったため管理Chromiumを使用。今回の画像はvisualizations `group-theme/`、色値は `contrast.json`、比較は `*-theme-html-comparison.json`。既存機能QAを再利用し、APIはモック、Pagefindは生成済みindexを使用した。
