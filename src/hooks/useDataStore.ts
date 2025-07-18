import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { FileReadResult, TableInfo, DatabaseConnection } from '../types';

export function useDataStore(db?: DatabaseConnection | null) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [currentData, setCurrentData] = useState<{
    columns: string[];
    data: string[][];
    rowCount: number;
  }>({ columns: [], data: [], rowCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (files: File[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const newTables: TableInfo[] = [];
      
      for (const file of files) {
        let result: FileReadResult;
        
        if (file.name.endsWith('.csv')) {
          result = await invoke<FileReadResult>('read_csv_file', { 
            path: file.path || file.name 
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          result = await invoke<FileReadResult>('read_excel_file', { 
            path: file.path || file.name 
          });
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }
        
        const tableName = result.file_name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
        
        const tableInfo: TableInfo = {
          name: tableName,
          columns: result.columns,
          rowCount: result.row_count,
          filePath: file.path || file.name
        };
        
        newTables.push(tableInfo);
        
        // Register table in DuckDB if available
        if (db && result.data_preview.length > 0) {
          try {
            // Convert preview data to objects for DuckDB
            const tableData = result.data_preview.map(row => {
              const obj: Record<string, any> = {};
              result.columns.forEach((col, index) => {
                obj[col] = row[index] || null;
              });
              return obj;
            });
            
            await db.registerTable(tableName, tableData);
          } catch (dbError) {
            console.warn(`Failed to register table ${tableName} in DuckDB:`, dbError);
          }
        }
        
        // Set current data to the first loaded file
        if (newTables.length === 1) {
          setCurrentData({
            columns: result.columns,
            data: result.data_preview,
            rowCount: result.row_count
          });
        }
      }
      
      setTables(prev => [...prev, ...newTables]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectTable = useCallback(async (tableName: string) => {
    const table = tables.find(t => t.name === tableName);
    if (!table) return;
    
    try {
      let result: FileReadResult;
      
      if (table.filePath.endsWith('.csv')) {
        result = await invoke<FileReadResult>('read_csv_file', { 
          path: table.filePath 
        });
      } else {
        result = await invoke<FileReadResult>('read_excel_file', { 
          path: table.filePath 
        });
      }
      
      setCurrentData({
        columns: result.columns,
        data: result.data_preview,
        rowCount: result.row_count
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table');
    }
  }, [tables]);

  const exportData = useCallback(async (
    data: string[][], 
    columns: string[], 
    filePath: string,
    format: 'csv' | 'excel'
  ) => {
    try {
      if (format === 'csv') {
        await invoke('export_to_csv', { 
          data, 
          path: filePath, 
          headers: columns 
        });
      } else {
        await invoke('export_to_excel', { 
          data, 
          path: filePath, 
          headers: columns 
        });
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Export failed');
    }
  }, []);

  return {
    tables,
    currentData,
    loading,
    error,
    loadFiles,
    selectTable,
    exportData
  };
}