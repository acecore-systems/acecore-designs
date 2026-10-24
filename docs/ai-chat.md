# Designs AI案内

既存3サイトの共通チャット（bot+AI起動、非modalパネル、会話、質問例、入力、閉じる）をDesignsにも適用する。テーマ色と9言語の案内だけをDesignsに合わせ、サービス・価格・作品・フォームは変更しない。日本語変換中のEnter/Escape、Shift+Enter、閉じた後のfocus復帰、短い画面とsafe area、メニュー/言語選択との重なりを共通契約として扱う。

質問・直近の会話を共通AIへ送る旨、個人・機密情報を入力しない旨と誤回答の可能性を送信前に表示する。会話はこのページのメモリ内で保持し、永続化しない。最大800文字、履歴8件/2400文字、25秒待機上限。回答のリンクは許可した公開originだけを表示する。

同originの`/api/ai-chat`は既存`ACECORE_CHAT` Service Bindingへ接続する。ブラウザにAPIキーは渡さず、新規キーを作らない。productionは`acecore-chat-worker`、Previewは`acecore-chat-worker-preview`。bindingなしや通信失敗は利用不可となり、直接の公開APIへ切り替えない。

回答の根拠は正本catalog・UI・portfolioからbuild生成する`/ai-context/{locale}.json`。独立の手入力情報管理を増やさない。全13サービスの料金・条件・全6実績・選択済みハルシユと法人相談URLを保持する。既存`catalog.json`契約は不変。

中央WorkerのDesigns対応PRが先行する。contextの全ID/9言語検証を中央側で行うため、サービス・作品IDを追加するときは許可一覧も同期し、実Previewの9言語context照合を公開前に行う。新しい納期・修正回数・権利保証等は作らない。

ローカルUIはAPI fixtureで検証し、実送信・本番への反映・問い合わせ配送とは区別する。公開Previewでの一般質問による回答確認を行い、どちらのPRもこの作業ではDraftのままとする。
