# CSV Analyzer

A standalone desktop application for analyzing large CSV and Excel files with SQL capabilities.

## Features

- **File Support**: CSV (.csv) and Excel (.xlsx, .xls) files
- **Large Data Handling**: Process files with up to 2,000 columns × 3,000 rows × 4 files
- **SQL Interface**: Execute SQL queries on your data using DuckDB-Wasm
- **GUI Query Builder**: Build queries visually without writing SQL
- **Virtual Scrolling**: Smooth performance with large datasets
- **Data Export**: Export results to CSV or Excel format
- **Standalone**: No external dependencies or internet connection required

## Installation

### Download Prebuilt Binaries

1. Go to the [Releases](https://github.com/your-username/csv-analyzer/releases) page
2. Download the appropriate version for your platform:
   - Windows: `csv-analyzer_windows.exe`
   - macOS: `csv-analyzer_macos.dmg`
   - Linux: `csv-analyzer_linux.AppImage`

### Building from Source

#### Prerequisites

- Node.js 20+
- Rust 1.78+
- Platform-specific dependencies:
  - **Linux**: `sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf`
  - **Windows**: Visual Studio Build Tools or Visual Studio Community
  - **macOS**: Xcode Command Line Tools

#### Build Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/csv-analyzer.git
   cd csv-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run tauri build
   ```

## Usage

### Basic Workflow

1. **Launch the application** by double-clicking the executable
2. **Load data files** using the file uploader in the sidebar
3. **View data** in the Data tab with virtual scrolling
4. **Query data** using either:
   - SQL Editor: Write custom SQL queries
   - Query Builder: Visual query construction
5. **Export results** to CSV or Excel format

### SQL Examples

```sql
-- View all data
SELECT * FROM your_file LIMIT 100;

-- Count rows
SELECT COUNT(*) as total_rows FROM your_file;

-- Group by column
SELECT category, COUNT(*) as count 
FROM your_file 
GROUP BY category 
ORDER BY count DESC;

-- Filter data
SELECT * FROM your_file 
WHERE amount > 1000 
AND status = 'active';
```

## Configuration

The application uses `config/default.json` for settings:

```json
{
  "memory": {
    "maxHeapSize": 4096,
    "warningThreshold": 0.8
  },
  "display": {
    "pageSize": 100,
    "maxColumnsPreview": 20
  },
  "export": {
    "csv": {
      "delimiter": ",",
      "header": true
    }
  }
}
```

## Technical Architecture

- **Frontend**: React 18 + TypeScript + TanStack Table
- **Backend**: Tauri 2.x + Rust
- **Database**: DuckDB-Wasm for in-memory SQL processing
- **Bundling**: Single executable with embedded WebView

## Development

### Development Server

```bash
npm run tauri dev
```

### Testing

```bash
npm test              # Frontend tests
cargo test            # Rust tests
npm run lint          # Linting
npm run typecheck     # Type checking
```

### Project Structure

```
csv-analyzer/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # React hooks
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── Cargo.toml         # Rust dependencies
├── config/                # Configuration files
├── data/                  # Data directories
│   ├── input/             # Input files
│   └── output/            # Export destination
└── .github/workflows/     # CI/CD pipelines
```

## Performance

- **Memory Usage**: Optimized for 16GB RAM systems
- **Load Time**: ~20 seconds for maximum dataset size
- **File Size**: 
  - Windows: ~30MB executable
  - macOS: ~40MB DMG
  - Linux: ~35MB AppImage

## Security

- **Offline Operation**: No network access required or allowed
- **Sandboxed**: Tauri security model with CSP restrictions
- **Code Signing**: Automated signing for Windows and macOS releases

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## Support

- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/your-username/csv-analyzer/issues)
- **Discussions**: General questions on [GitHub Discussions](https://github.com/your-username/csv-analyzer/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.