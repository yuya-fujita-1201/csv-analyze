import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/api/dialog';

interface FileUploaderProps {
  onFilesLoaded: (files: File[]) => void;
}

export function FileUploader({ onFilesLoaded }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Data Files',
            extensions: ['csv', 'xlsx', 'xls']
          }
        ]
      });

      if (selected && Array.isArray(selected)) {
        const files = selected.map(path => ({
          name: path.split('/').pop() || path,
          path: path
        } as File));
        onFilesLoaded(files);
      } else if (selected) {
        const file = {
          name: selected.split('/').pop() || selected,
          path: selected
        } as File;
        onFilesLoaded([file]);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  }, [onFilesLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls')
    );
    
    if (files.length > 0) {
      onFilesLoaded(files);
    }
  }, [onFilesLoaded]);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drop CSV or Excel files here, or{' '}
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              onClick={handleFileSelect}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Supports .csv, .xlsx, .xls files
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleFileSelect}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Select Files
      </button>
    </div>
  );
}