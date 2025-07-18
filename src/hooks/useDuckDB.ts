import { useState, useEffect } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';
import { DatabaseConnection, QueryResult } from '../types';

export function useDuckDB() {
  const [db, setDb] = useState<DatabaseConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let connection: duckdb.AsyncDuckDBConnection | null = null;
    let database: duckdb.AsyncDuckDB | null = null;
    
    async function initializeDuckDB() {
      try {
        setLoading(true);
        setError(null);

        // Get DuckDB bundles
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        
        // Create worker and database
        const worker = await duckdb.createWorker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        database = new duckdb.AsyncDuckDB(logger, worker);
        
        await database.instantiate(bundle.mainModule);
        connection = await database.connect();

        const dbConnection: DatabaseConnection = {
          initialize: async () => {
            // Already initialized
          },
          execute: async (query: string): Promise<QueryResult> => {
            if (!connection) throw new Error('Database not connected');
            
            const startTime = performance.now();
            const result = await connection.query(query);
            const endTime = performance.now();
            
            const columns = result.schema.fields.map(field => field.name);
            const data: string[][] = [];
            
            // Convert Arrow result to string array
            const table = result.toArray();
            for (const row of table) {
              const rowData: string[] = [];
              for (const column of columns) {
                const value = row[column];
                rowData.push(value?.toString() || '');
              }
              data.push(rowData);
            }
            
            return {
              columns,
              data,
              rowCount: result.numRows,
              executionTime: endTime - startTime
            };
          },
          registerTable: async (name: string, data: any[]) => {
            if (!connection) throw new Error('Database not connected');
            
            if (data.length === 0) return;
            
            // Create table from array of objects
            // First, create the table structure
            const columns = Object.keys(data[0]);
            const columnDefs = columns.map(col => `"${col}" VARCHAR`).join(', ');
            
            await connection.query(`CREATE OR REPLACE TABLE "${name}" (${columnDefs})`);
            
            // Insert data in batches
            for (const row of data) {
              const values = columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) return 'NULL';
                return `'${String(value).replace(/'/g, "''")}'`;
              }).join(', ');
              
              await connection.query(`INSERT INTO "${name}" VALUES (${values})`);
            }
          },
          close: async () => {
            if (connection) {
              await connection.close();
            }
            if (database) {
              await database.terminate();
            }
          }
        };

        if (mounted) {
          setDb(dbConnection);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize DuckDB:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    initializeDuckDB();

    return () => {
      mounted = false;
      if (connection) {
        connection.close().catch(console.error);
      }
      if (database) {
        database.terminate().catch(console.error);
      }
    };
  }, []);

  return { db, loading, error };
}