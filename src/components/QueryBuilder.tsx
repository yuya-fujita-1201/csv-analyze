import { useState, useCallback } from 'react';
import { TableInfo } from '../types';

interface QueryBuilderProps {
  tables: TableInfo[];
}

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface SelectColumn {
  table: string;
  column: string;
  alias?: string;
  aggregation?: string;
}

const operators = [
  { value: '=', label: 'Equals' },
  { value: '!=', label: 'Not equals' },
  { value: '>', label: 'Greater than' },
  { value: '<', label: 'Less than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '<=', label: 'Less than or equal' },
  { value: 'LIKE', label: 'Contains' },
  { value: 'NOT LIKE', label: 'Does not contain' },
  { value: 'IS NULL', label: 'Is empty' },
  { value: 'IS NOT NULL', label: 'Is not empty' },
];

const aggregations = [
  { value: '', label: 'None' },
  { value: 'COUNT', label: 'Count' },
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Average' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
];

export function QueryBuilder({ tables }: QueryBuilderProps) {
  const [selectedColumns, setSelectedColumns] = useState<SelectColumn[]>([]);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState<{ column: string; direction: 'ASC' | 'DESC' }[]>([]);
  const [limit, setLimit] = useState<number>(100);

  const addColumn = useCallback(() => {
    if (tables.length > 0) {
      setSelectedColumns(prev => [...prev, {
        table: tables[0].name,
        column: tables[0].columns[0] || '',
      }]);
    }
  }, [tables]);

  const removeColumn = useCallback((index: number) => {
    setSelectedColumns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateColumn = useCallback((index: number, field: keyof SelectColumn, value: string) => {
    setSelectedColumns(prev => prev.map((col, i) => 
      i === index ? { ...col, [field]: value } : col
    ));
  }, []);

  const addFilter = useCallback(() => {
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      column: tables[0]?.columns[0] || '',
      operator: '=',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined,
    };
    setFilters(prev => [...prev, newFilter]);
  }, [tables, filters.length]);

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFilter = useCallback((id: string, field: keyof FilterCondition, value: string) => {
    setFilters(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  }, []);

  const generateSQL = useCallback(() => {
    if (selectedColumns.length === 0) return '';

    // SELECT clause
    const selectParts = selectedColumns.map(col => {
      let part = `${col.table}.${col.column}`;
      if (col.aggregation) {
        part = `${col.aggregation}(${part})`;
      }
      if (col.alias) {
        part += ` AS ${col.alias}`;
      }
      return part;
    });

    let sql = `SELECT ${selectParts.join(', ')}`;

    // FROM clause (assume single table for now)
    const uniqueTables = [...new Set(selectedColumns.map(col => col.table))];
    sql += `\nFROM ${uniqueTables[0]}`;

    // WHERE clause
    if (filters.length > 0) {
      const whereParts = filters.map((filter, index) => {
        let part = '';
        if (index > 0 && filter.logicalOperator) {
          part += `${filter.logicalOperator} `;
        }
        
        if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
          part += `${filter.column} ${filter.operator}`;
        } else if (filter.operator === 'LIKE' || filter.operator === 'NOT LIKE') {
          part += `${filter.column} ${filter.operator} '%${filter.value}%'`;
        } else {
          part += `${filter.column} ${filter.operator} '${filter.value}'`;
        }
        
        return part;
      });
      sql += `\nWHERE ${whereParts.join(' ')}`;
    }

    // GROUP BY clause
    if (groupBy.length > 0) {
      sql += `\nGROUP BY ${groupBy.join(', ')}`;
    }

    // ORDER BY clause
    if (orderBy.length > 0) {
      const orderParts = orderBy.map(order => `${order.column} ${order.direction}`);
      sql += `\nORDER BY ${orderParts.join(', ')}`;
    }

    // LIMIT clause
    if (limit > 0) {
      sql += `\nLIMIT ${limit}`;
    }

    return sql;
  }, [selectedColumns, filters, groupBy, orderBy, limit]);

  const getAllColumns = useCallback(() => {
    return tables.flatMap(table => 
      table.columns.map(column => ({ table: table.name, column }))
    );
  }, [tables]);

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Load some data files to start building queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Query Builder
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="space-y-6">
          {/* SELECT Columns */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Columns
              </h3>
              <button
                onClick={addColumn}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Column
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedColumns.map((col, index) => (
                <div key={index} className="flex space-x-2 items-center">
                  <select
                    value={col.table}
                    onChange={(e) => updateColumn(index, 'table', e.target.value)}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {tables.map(table => (
                      <option key={table.name} value={table.name}>{table.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={col.column}
                    onChange={(e) => updateColumn(index, 'column', e.target.value)}
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {tables.find(t => t.name === col.table)?.columns.map(column => (
                      <option key={column} value={column}>{column}</option>
                    ))}
                  </select>
                  
                  <select
                    value={col.aggregation || ''}
                    onChange={(e) => updateColumn(index, 'aggregation', e.target.value)}
                    className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {aggregations.map(agg => (
                      <option key={agg.value} value={agg.value}>{agg.label}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => removeColumn(index)}
                    className="text-red-600 hover:text-red-800 px-2 py-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* WHERE Filters */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters
              </h3>
              <button
                onClick={addFilter}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Filter
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filters.map((filter, index) => (
                <div key={filter.id} className="space-y-2">
                  {index > 0 && (
                    <select
                      value={filter.logicalOperator || 'AND'}
                      onChange={(e) => updateFilter(filter.id, 'logicalOperator', e.target.value as 'AND' | 'OR')}
                      className="w-20 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  
                  <div className="flex space-x-2 items-center">
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                      className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {getAllColumns().map((col, i) => (
                        <option key={i} value={col.column}>{col.table}.{col.column}</option>
                      ))}
                    </select>
                    
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                      className="w-32 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    
                    {!['IS NULL', 'IS NOT NULL'].includes(filter.operator) && (
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="Value"
                      />
                    )}
                    
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LIMIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
              className="w-24 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              min="0"
            />
          </div>
        </div>

        {/* Generated SQL */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Generated SQL
          </h3>
          <div className="h-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
              {generateSQL() || 'Add some columns to generate SQL...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}