# CSV Analyzer - 要件定義書

## 1. プロジェクト概要

### 1.1 背景
- 補助金申請データ（2,000列 × 3,000行 × 4ファイルまで）をローカルで分析したい
- **利用者は技術知識ゼロでも OK**：配布された `csv-analyzer.exe` をダブルクリックすれば GUI が起動
- インターネット非接続の PC でも動作する "スタンドアロン" ツールが必要
- 外部 DB ソフトは一切インストールさせない（DuckDB-Wasm 等をバイナリに同梱）

### 1.2 目的
- 複数 CSV/Excel を直接ストリーム読み込み → メモリ上 (Arrow) に統合
- SQL クエリまたは GUI 操作で検索・集計・加工
- 結果を CSV/Excel で再出力
- GUI 表示（仮想スクロール対応）で数千列でも快適
- **配布形態**  
  - Windows: 単体 `.exe`  
  - macOS: `.dmg`（Gatekeeper 公証手順込み）  
  - Linux: `.AppImage` または `.deb`
  - 追加 DLL / Node ランタイム等は不要。実行ファイル 1 つで完結

## 2. 技術スタック

### 2.1 フロントエンド
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **UI Components**: TanStack Table v8 (仮想スクロール対応)
- **Styling**: Tailwind CSS 3.5
- **State Management**: React Hooks (useState, useEffect, useCallback)

### 2.2 バックエンド・データエンジン
- **Desktop Framework**: Tauri 2.x
- **Backend Language**: Rust 1.78+
- **Data Engine**: DuckDB-Wasm 1.29+ (SQL99 対応・高速)
- **File Processing**: 
  - CSV: csv crate + encoding_rs (文字コード自動判定)
  - Excel: calamine crate
- **Data Format**: Apache Arrow (メモリ効率)

### 2.3 ビルド・配布
- **Bundler**: Tauri bundler
- **Target Platforms**: 
  - Windows (x64): WebView2 バンドル
  - macOS (Universal): WKWebView バンドル
  - Linux (x64): WebKitGTK バンドル
- **CI/CD**: GitHub Actions (3OS 並列ビルド)

## 3. 機能要件

### 3.1 データ取込機能
- **対応フォーマット**: CSV (.csv), Excel (.xlsx, .xls)
- **文字コード**: 自動判定 (UTF-8, Shift_JIS)
- **ファイル選択**: ドラッグ&ドロップ + ファイルダイアログ
- **データ統合**: 共通主キー `record_id` で横結合
- **列名競合**: `file_column` 形式で自動リネーム
- **プレビュー**: 先頭100行をGUI表示
- **メモリ登録**: Arrow RecordBatch → DuckDB-Wasm テーブル

### 3.2 クエリ機能
#### 3.2.1 SQL モード
- **エディタ**: マルチライン テキストボックス
- **実行**: Execute ボタン / Ctrl+Enter
- **サンプルクエリ**: プリセット提供
- **エラーハンドリング**: 構文エラー表示

#### 3.2.2 GUI ビルダー
- **SELECT**: 列選択・集約関数・エイリアス
- **WHERE**: 条件フィルタ (AND/OR 対応)
- **GROUP BY**: グルーピング
- **ORDER BY**: ソート (ASC/DESC)
- **LIMIT**: 結果行数制限
- **プレビュー**: リアルタイム SQL 生成表示

### 3.3 データ表示機能
- **Virtual Scrolling**: TanStack Table + react-virtual
- **列固定**: ヘッダー固定・左端列固定
- **ソート**: 列ヘッダークリック
- **フィルタ**: 列ごとフィルタ + グローバル検索
- **コピー**: セル・行・範囲選択コピー
- **ページング**: 100行単位 (設定可能)

### 3.4 データ加工機能
- **列操作**: 追加・削除・リネーム・並び替え
- **データクリーニング**: null 一括置換・トリミング
- **正規表現**: パターンマッチ・置換
- **ピボット**: 行→列変換
- **アンピボット**: 列→行変換
- **計算列**: 式による新規列生成

### 3.5 出力機能
- **エクスポート形式**: CSV, Excel (xlsx)
- **文字コード**: UTF-8, Shift_JIS 選択可
- **区切り文字**: カンマ・タブ・セミコロン
- **ヘッダー**: 有無選択可
- **保存先**: ファイルダイアログ指定

## 4. 非機能要件

### 4.1 性能要件
- **データサイズ**: 2,000列 × 3,000行 × 4ファイル
- **メモリ**: 16GB RAM 環境での動作
- **ロード時間**: 最大データセットで 20秒以内
- **レスポンス**: GUI操作は 500ms 以内
- **スクロール**: 60fps 滑らか表示

### 4.2 バイナリサイズ
- **Windows .exe**: ≤ 30MB
- **macOS .dmg**: ≤ 40MB  
- **Linux .AppImage**: ≤ 35MB

### 4.3 セキュリティ要件
- **ネットワーク**: 外部通信完全禁止
- **CSP**: Tauri セキュリティポリシー適用
- **サンドボックス**: OS標準サンドボックス内で動作
- **署名**: Windows/macOS 自動署名 (CI)

### 4.4 ユーザビリティ
- **起動手順**: 
  1. USB等で実行ファイルをコピー
  2. ダブルクリック → GUI起動
  3. 初回のみ「Windows保護」→「詳細情報→実行」
- **操作習得**: ITリテラシー不要・直感的操作
- **エラー処理**: 分かりやすいエラーメッセージ
- **ヘルプ**: GUI内サンプルクエリ・ツールチップ

## 5. システム設計

### 5.1 アーキテクチャ
```
┌─────────────────┐    ┌──────────────────┐
│   React Frontend │    │  Tauri Backend   │
│  ┌─────────────┐ │    │ ┌──────────────┐ │
│  │  TanStack   │ │    │ │   File I/O   │ │
│  │   Table     │ │    │ │   (Rust)     │ │
│  └─────────────┘ │    │ └──────────────┘ │
│  ┌─────────────┐ │    │ ┌──────────────┐ │
│  │ DuckDB-Wasm │ │    │ │   Encoding   │ │
│  │   Engine    │ │    │ │  Detection   │ │
│  └─────────────┘ │    │ └──────────────┘ │
└─────────────────┘    └──────────────────┘
         │                        │
         └──── Tauri IPC ──────────┘
```

### 5.2 データフロー
1. **ファイル選択** → Tauri ファイルダイアログ
2. **ファイル読込** → Rust backend (CSV/Excel parser)
3. **エンコーディング検出** → encoding_rs
4. **データ変換** → Arrow RecordBatch
5. **DB登録** → DuckDB-Wasm テーブル作成
6. **クエリ実行** → SQL → Arrow結果
7. **GUI表示** → Virtual scrolling
8. **エクスポート** → Rust backend書き出し

### 5.3 ディレクトリ構造
```
csv-analyzer/
├── src/                     # React フロントエンド
│   ├── components/          # UI コンポーネント
│   │   ├── DataTable.tsx    # 仮想スクロールテーブル
│   │   ├── SqlEditor.tsx    # SQLエディタ
│   │   ├── QueryBuilder.tsx # GUIクエリビルダー
│   │   └── FileUploader.tsx # ファイルアップロード
│   ├── hooks/               # React Hooks
│   │   ├── useDuckDB.ts     # DuckDB-Wasm管理
│   │   └── useDataStore.ts  # データ状態管理
│   ├── types/               # TypeScript型定義
│   │   └── index.ts         # 共通型
│   └── utils/               # ユーティリティ
├── src-tauri/               # Rust バックエンド
│   ├── src/
│   │   ├── main.rs          # エントリポイント
│   │   ├── commands.rs      # Tauri コマンド
│   │   └── utils.rs         # ファイル処理ユーティリティ
│   ├── Cargo.toml           # Rust依存関係
│   └── tauri.conf.json      # Tauri設定
├── config/                  # 設定ファイル
│   └── default.json         # デフォルト設定
├── data/                    # データディレクトリ
│   ├── input/               # 入力ファイル置き場
│   └── output/              # 出力ファイル置き場
├── .github/workflows/       # CI/CD
│   ├── build.yml            # ビルド・リリース
│   └── security.yml         # セキュリティスキャン
└── tests/                   # テストファイル
```

## 6. 設定仕様

### 6.1 設定ファイル (config/default.json)
```json
{
  "dataFolders": {
    "input": "./data/input",
    "output": "./data/output"
  },
  "memory": {
    "maxHeapSize": 4096,        // MB
    "warningThreshold": 0.8     // 80%で警告
  },
  "encoding": {
    "defaultInput": "auto",     // auto | utf-8 | shift_jis
    "defaultOutput": "utf-8"
  },
  "display": {
    "pageSize": 100,            // 1ページ行数
    "maxColumnsPreview": 20,    // プレビュー列数上限
    "theme": "auto"             // auto | light | dark
  },
  "export": {
    "csv": {
      "delimiter": ",",
      "quote": "\"",
      "escape": "\"",
      "header": true
    },
    "excel": {
      "sheetName": "Data",
      "autoFilter": true,
      "freezeHeader": true
    }
  },
  "logging": {
    "level": "info",            // error | warn | info | debug
    "maxFiles": 10,
    "maxSize": "10MB"
  }
}
```

## 7. API仕様

### 7.1 Tauri コマンド (Rust ↔ React)
```rust
// ファイル読み込み
read_csv_file(path: String) -> Result<FileReadResult, String>
read_excel_file(path: String) -> Result<FileReadResult, String>

// データエクスポート  
export_to_csv(data: Vec<Vec<String>>, path: String, headers: Vec<String>) -> Result<(), String>
export_to_excel(data: Vec<Vec<String>>, path: String, headers: Vec<String>) -> Result<(), String>

// システム情報
get_system_info() -> Result<SystemInfo, String>
get_table_schema(table_name: String) -> Result<Vec<TableSchema>, String>
```

### 7.2 データ型定義
```typescript
interface FileReadResult {
  columns: string[];           // 列名配列
  row_count: number;          // 総行数
  data_preview: string[][];   // プレビューデータ（先頭100行）
  file_name: string;          // ファイル名
}

interface QueryResult {
  columns: string[];          // 結果列名
  data: string[][];          // 結果データ
  rowCount: number;          // 結果行数
  executionTime: number;     // 実行時間(ms)
}

interface TableInfo {
  name: string;              // テーブル名
  columns: string[];         // 列名配列
  rowCount: number;          // 行数
  filePath: string;          // ファイルパス
}
```

## 8. 品質要件

### 8.1 テスト要件
- **カバレッジ**: 70% 以上
- **単体テスト**: Vitest (React) + Rust built-in test
- **結合テスト**: Tauri IPC 通信テスト
- **E2Eテスト**: ファイル読み込み→クエリ→エクスポート

### 8.2 コード品質
- **Linting**: ESLint (TypeScript) + Clippy (Rust)
- **Formatting**: Prettier (TypeScript) + rustfmt
- **型安全**: strict TypeScript + Rust ownership
- **エラーハンドリング**: Result型による安全なエラー処理

### 8.3 CI/CD
- **ビルド**: 3OS並列ビルド (Windows/macOS/Linux)
- **テスト**: プルリクエスト時自動実行
- **セキュリティ**: 依存関係脆弱性スキャン
- **リリース**: タグ時自動バイナリ配布

## 9. 運用要件

### 9.1 デプロイメント
- **配布方法**: GitHub Releases
- **ファイル形式**: 
  - `csv-analyzer-windows.exe` (署名済み)
  - `csv-analyzer-macos.dmg` (公証済み)  
  - `csv-analyzer-linux.AppImage`
- **チェックサム**: SHA256ハッシュ提供

### 9.2 サポート
- **ドキュメント**: README.md + 使用方法動画
- **Issue管理**: GitHub Issues
- **バージョン管理**: Semantic Versioning (semver)
- **更新通知**: アプリ内更新チェック (オプション)

### 9.3 ライセンス
- **ソフトウェア**: MIT License または Apache 2.0
- **依存関係**: 各ライブラリのライセンス準拠
- **商用利用**: 制限なし

## 10. 制約事項

### 10.1 技術制約
- **メモリ**: 全データをメモリ上で処理 (ディスク非使用)
- **ネットワーク**: 完全オフライン動作
- **OS依存**: WebView バージョンに依存
- **ファイルサイズ**: 実用的な範囲での制限あり

### 10.2 機能制約
- **同時ユーザー**: 単一ユーザー使用想定
- **データ永続化**: セッション終了でメモリクリア
- **リアルタイム**: ファイル変更の自動検知なし
- **国際化**: 日本語・英語のみ対応

### 10.3 サポート制約
- **OS**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **ハードウェア**: x64アーキテクチャのみ
- **メモリ**: 最低8GB、推奨16GB以上
- **ストレージ**: 一時的に入力ファイルの3倍容量必要

---

この要件定義書に基づいて、技術知識ゼロのユーザーでも簡単に使える、高性能なCSV分析ツールを構築できます。