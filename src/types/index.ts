export interface FileReadResult {
  columns: string[];
  row_count: number;
  data_preview: string[][];
  file_name: string;
}

export interface TableSchema {
  column_name: string;
  data_type: string;
  nullable: boolean;
}

export interface SystemInfo {
  total_memory: number;
  available_memory: number;
  cpu_count: number;
}

export interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
  filePath: string;
}

export interface QueryResult {
  columns: string[];
  data: string[][];
  rowCount: number;
  executionTime: number;
}

export interface DatabaseConnection {
  initialize: () => Promise<void>;
  execute: (query: string) => Promise<QueryResult>;
  registerTable: (name: string, data: any[]) => Promise<void>;
  close: () => Promise<void>;
}

export interface AppConfig {
  dataFolders: {
    input: string;
    output: string;
  };
  memory: {
    maxHeapSize: number;
    warningThreshold: number;
  };
  encoding: {
    defaultInput: string;
    defaultOutput: string;
  };
  display: {
    pageSize: number;
    maxColumnsPreview: number;
    theme: string;
  };
  export: {
    csv: {
      delimiter: string;
      quote: string;
      escape: string;
      header: boolean;
    };
    excel: {
      sheetName: string;
      autoFilter: boolean;
      freezeHeader: boolean;
    };
  };
  logging: {
    level: string;
    maxFiles: number;
    maxSize: string;
  };
}

export type FileType = 'csv' | 'excel';
export type ExportFormat = 'csv' | 'excel';
export type Theme = 'light' | 'dark' | 'auto';