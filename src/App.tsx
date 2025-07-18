import { useState, useEffect } from 'react'
import { DataTable } from './components/DataTable'
import { QueryBuilder } from './components/QueryBuilder'
import { FileUploader } from './components/FileUploader'
import { SqlEditor } from './components/SqlEditor'
import { useDuckDB } from './hooks/useDuckDB'
import { useDataStore } from './hooks/useDataStore'

function App() {
  const [activeTab, setActiveTab] = useState<'data' | 'query' | 'sql'>('data')
  const { db, loading: dbLoading, error: dbError } = useDuckDB()
  const { tables, currentData, loadFiles } = useDataStore(db)

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CSV Analyzer
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Memory: 2.1GB / 16GB
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Export Results
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Data Sources
            </h2>
            <FileUploader onFilesLoaded={loadFiles} />
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loaded Tables
              </h3>
              <ul className="space-y-1">
                {tables.map((table) => (
                  <li
                    key={table.name}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {table.name} ({table.rowCount} rows)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {(['data', 'query', 'sql'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'sql' ? 'SQL Editor' : tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {dbError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                Error initializing database: {dbError}
              </div>
            )}
            
            {dbLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-gray-400">
                  Initializing database...
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'data' && <DataTable data={currentData} />}
                {activeTab === 'query' && <QueryBuilder tables={tables} />}
                {activeTab === 'sql' && <SqlEditor db={db} />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App