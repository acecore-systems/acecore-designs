# Designs AI案内

既存3サイトの共通チャット（bot+AI起動、非modalパネル、会話、質問例、入力、閉じる）をDesignsにも適用する。テーマ色と9言語の案内だけをDesignsに合わせ、サービス・価格・作品・フォームは変更しない。日本語変換中のEnter/Escape、Shift+Enter、閉じた後のfocus復帰、短い画面とsafe area、メニュー/言語選択との重なりを共通契約として扱う。

質問・直近の会話を共通AIへ送る旨、個人・機密情報を入力しない旨と誤回答の可能性を送信前に表示する。会話はこのページのメモリ内で保持し、永続化しない。最大800文字、履歴8件/2400文字、25秒待機上限。回答のリンクは許可した公開originだけを表示する。

同originの`/api/ai-chat`は元bodyの12KiB上限・型・9locale・800文字・履歴上限を確認した後、固定`/ai-context/{locale}.json`を自身の`ASSETS`から読み、既存`ACECORE_CHAT` Service Bindingへ内部envelopeとして渡す。ブラウザ由来context・scope・URL・内部headerは破棄する。ブラウザにAPIキーは渡さず、新規キーを作らない。productionは`acecore-chat-worker`、Previewは`acecore-chat-worker-preview`。binding/ASSETSなしや通信失敗は利用不可となり、直接の公開APIへ切り替えない。

回答の根拠は正本catalog・UI・portfolioからbuild生成する`/ai-context/{locale}.json`。独立の手入力情報管理を増やさない。全13サービスの料金・条件・ハルシユ先頭の全5実績と法人相談URLを保持する。既存`catalog.json`契約は不変。

中央WorkerのDesigns対応PRが先行する。contextの全ID/9言語検証を中央側で行うため、サービス・作品IDを追加するときは許可一覧も同期し、実Previewの9言語context照合を公開前に行う。新しい納期・修正回数・権利保証等は作らない。

公開PagesをWorkerから直接fetchする案は実環境で522となった。公開fetch拡張フラグは将来本番にも及ぶネットワーク境界の緩和として自動承認レビューに拒否され、追加しなかった。代わりに承認されたASSETS→private Service Bindingを使用し、外部fetchや秘密値の追加を避けた。

2026-10-24の初回掲載撤回で公開実績を5件へ移行した。同日の追加指定でcentipedeも撤回し、既存ハルシユを正式実績の先頭へ昇格。現在はハルシユと既存4作品の5件で、featuredWorkへの二重収録をしない。イラストの実績sectionは0件なら表示せず、サービス内容・料金は保持する。撤回2作品の画像と9言語原稿は公開外archiveへ保存し、正確な旧画像URLだけ404/no-storeとする。中央を先行公開して旧featured形式も新work形式も1件へ正規化し、撤回2作品を常に根拠/リンクから除外する。

2026-10-24の初回実装ではAPI fixtureと公開Previewの一般質問で確認し、サイトPR7・中央Worker PR6をDraftとして提示した。その後のユーザー承認に基づく本番公開は、中央Workerを先にmerge・production deployし、次にサイトをmergeしてGitHub連携Pagesで公開する。実送信・本番への反映・問い合わせ配送は区別して記録し、公開後に日本語・英語の一般質問、根拠URL、既存3サイトの回帰を確認する。
