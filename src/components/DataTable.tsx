import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useState, useRef } from 'react';

interface DataTableProps {
  data: {
    columns: string[];
    data: string[][];
    rowCount: number;
  };
}

type RowData = Record<string, string>;

const columnHelper = createColumnHelper<RowData>();

export function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    return data.columns.map((col, index) =>
      columnHelper.accessor(col, {
        header: col,
        cell: (info) => info.getValue(),
        enableSorting: true,
        enableColumnFilter: true,
      })
    );
  }, [data.columns]);

  const tableData = useMemo(() => {
    return data.data.map((row) => {
      const rowObj: RowData = {};
      data.columns.forEach((col, index) => {
        rowObj[col] = row[index] || '';
      });
      return rowObj;
    });
  }, [data.data, data.columns]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 20,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: columns.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 150,
    overscan: 5,
  });

  if (data.columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No data loaded
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload some CSV or Excel files to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {rows.length} of {data.rowCount} rows
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Filter all columns..."
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            onChange={(e) => {
              table.setGlobalFilter(e.target.value);
            }}
          />
        </div>
      </div>

      <div
        ref={tableContainerRef}
        className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: `${columnVirtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            style={{
              transform: `translateX(${-columnVirtualizer.getVirtualItems()[0]?.start ?? 0}px)`,
            }}
          >
            {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
              const header = table.getHeaderGroups()[0].headers[virtualColumn.index];
              return (
                <div
                  key={header.id}
                  className="absolute top-0 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  style={{
                    left: `${virtualColumn.start}px`,
                    width: `${virtualColumn.size}px`,
                    height: '40px',
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center space-x-1">
                    <span className="truncate">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    <span className="flex-shrink-0">
                      {{
                        asc: '↑',
                        desc: '↓',
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className={`absolute flex ${
                  virtualRow.index % 2 === 0
                    ? 'bg-white dark:bg-gray-900'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
                style={{
                  top: `${virtualRow.start}px`,
                  height: `${virtualRow.size}px`,
                  width: '100%',
                }}
              >
                {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
                  const cell = row.getVisibleCells()[virtualColumn.index];
                  return (
                    <div
                      key={cell.id}
                      className="absolute px-3 py-2 text-sm text-gray-900 dark:text-gray-100 truncate"
                      style={{
                        left: `${virtualColumn.start}px`,
                        width: `${virtualColumn.size}px`,
                      }}
                      title={cell.getValue() as string}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}