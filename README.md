# Habit Grid

毎日の習慣を GitHub の contribution graph 風のグリッドで記録するトラッカー。
データはブラウザの `localStorage` にのみ保存され、サーバーには送信されません。

## 機能

- 習慣の追加・削除（名前 + 5 色から選択）
- 今日の達成をワンクリックで記録／取り消し
- 過去 27 週間のヒートマップ
  - 「すべて」タブ: その日に達成した習慣の割合を 5 段階の濃さで表示（閲覧のみ）
  - 習慣ごとのタブ: セルをクリックして過去の記録を後から編集できる
- 継続日数（現在／最長）、合計日数、直近 30 日の達成率
- JSON でのエクスポート／インポート（バックアップ・端末移行用）
- PWA 対応（ホーム画面に追加してスタンドアロン起動）

## 開発

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm test     # vitest
pnpm lint
pnpm build
pnpm icons    # アイコン PNG を再生成（scripts/generate-icons.mjs）
```

## 構成

| パス | 役割 |
| --- | --- |
| `app/page.tsx` | Server Component。ページの外枠のみ |
| `app/components/HabitApp.tsx` | 状態を束ねるクライアントのルート |
| `app/components/HabitGrid.tsx` | ヒートマップの描画 |
| `app/lib/date.ts` | `YYYY-MM-DD` キーとグリッド生成（すべてローカル時刻） |
| `app/lib/habits.ts` | 習慣モデルと継続日数などの純粋なロジック |
| `app/lib/storage.ts` | `localStorage` の読み書きと入力値の検証 |
| `app/lib/habitStore.ts` | `useSyncExternalStore` による localStorage の購読 |
| `app/lib/clock.ts` | 「今日」の外部ストア。深夜 0 時とタブ復帰で更新 |
| `app/lib/backup.ts` | JSON の書き出し・読み込み |
| `scripts/generate-icons.mjs` | アイコン PNG の生成（依存ライブラリなし） |

### 設計メモ

- 日付はすべて**ローカル時刻**の `YYYY-MM-DD` 文字列で扱う。`toISOString()` は UTC に変換され
  日本時間では日付がずれるため使わない。
- `localStorage` は外部ストアとして `useSyncExternalStore` で読む。effect で state に写して
  いないので、初回ロード時の再レンダリングのカスケードが発生しない。
- 「今日」はクライアントの時計に依存するため、hydration が完了するまで `null` にして
  サーバー／クライアントの不一致を避けている。
- 保存データはユーザーが編集できるので、読み込み時に形式を検証し不正な値は捨てる。
  インポートしたファイルも同じ検証を通す。
- 「今日」はタイマーだけに頼らない。スリープ中は `setTimeout` が発火しないことがあるため、
  タブが再表示されたときにも時計を読み直す。
- localStorage はオリジンごとに分かれるので、`localhost` と本番 URL で記録は共有されない。
  端末やドメインをまたぐときはエクスポート／インポートを使う。
