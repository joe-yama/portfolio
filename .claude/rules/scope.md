# スコープのルール

- 実装するのは OpenSpec の change（`openspec/changes/<name>/`）にある `tasks.md` の項目だけ。
- spec に書かれていない機能・オプション・「あると便利」な改善は追加しない。気づいたら tasks の末尾や PO への報告に「提案」として書く。
- スコープを変えたい場合は実装ではなく `/opsx:propose` で新しい change を起こし、PO の承認を得る。
- 実装中に spec の矛盾や不足を見つけたら、勝手に解釈せず PO に質問する（ブロッカー扱い）。
- brainstorming と proposal の承認前にアプリケーションコードを書かない。
- 既存コードのリファクタリングは、対象 change のタスクに含まれる範囲に限る。
