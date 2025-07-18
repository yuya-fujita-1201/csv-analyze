import { useState, useCallback } from 'react';
import { DatabaseConnection, QueryResult } from '../types';

interface SqlEditorProps {
  db: DatabaseConnection | null;
}

export function SqlEditor({ db }: SqlEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM table1 LIMIT 100;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!db || !query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await db.execute(query);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  }, [db, query]);

  const sampleQueries = [
    {
      name: 'View all data',
      sql: 'SELECT * FROM table1 LIMIT 100;'
    },
    {
      name: 'Count rows',
      sql: 'SELECT COUNT(*) as row_count FROM table1;'
    },
    {
      name: 'Unique values',
      sql: 'SELECT DISTINCT column1 FROM table1;'
    },
    {
      name: 'Group by example',
      sql: 'SELECT column1, COUNT(*) as count FROM table1 GROUP BY column1 ORDER BY count DESC;'
    }
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          SQL Editor
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setQuery('')}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={executeQuery}
            disabled={!db || loading || !query.trim()}
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1">
        <div className="col-span-3 flex flex-col space-y-4">
          <div className="flex-1">
            <label htmlFor="sql-query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SQL Query
            </label>
            <textarea
              id="sql-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your SQL query here..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <h4 className="font-medium">Query Error:</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 dark:text-white">Query Results</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {result.rowCount} rows • {result.executionTime.toFixed(2)}ms
                  </div>
                </div>
              </div>
              
              <div className="overflow-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {result.columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {result.data.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate"
                            title={cell}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sample Queries
            </h3>
            <div className="space-y-2">
              {sampleQueries.map((sample, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sample.sql)}
                  className="w-full text-left px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SQL Help
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• Use table names from the Data Sources panel</p>
              <p>• DuckDB supports most SQL features</p>
              <p>• Use LIMIT for large datasets</p>
              <p>• Press Ctrl+Enter to execute</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}