import '@testing-library/jest-dom'

// Mock Tauri API
const mockTauri = {
  invoke: vi.fn(),
  dialog: {
    open: vi.fn()
  }
}

Object.defineProperty(window, '__TAURI__', {
  value: mockTauri
})

// Mock DuckDB-Wasm
vi.mock('@duckdb/duckdb-wasm', () => ({
  getJsDelivrBundles: vi.fn(() => ({})),
  selectBundle: vi.fn(() => Promise.resolve({
    mainWorker: 'worker.js',
    mainModule: 'module.wasm'
  })),
  createWorker: vi.fn(() => Promise.resolve({})),
  ConsoleLogger: vi.fn(() => ({})),
  AsyncDuckDB: vi.fn(() => ({
    instantiate: vi.fn(),
    connect: vi.fn(() => Promise.resolve({
      query: vi.fn(() => Promise.resolve({
        schema: { fields: [] },
        numRows: 0,
        numCols: 0,
        toArray: () => []
      })),
      close: vi.fn()
    })),
    terminate: vi.fn()
  }))
}))

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))