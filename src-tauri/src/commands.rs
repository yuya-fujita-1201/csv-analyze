use serde::{Deserialize, Serialize};
use std::path::Path;
use std::fs::File;
use std::io::BufReader;
use anyhow::Result;
use csv::ReaderBuilder;
use calamine::{Reader, Xlsx, open_workbook};
use encoding_rs::Encoding;
use crate::utils;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileReadResult {
    pub columns: Vec<String>,
    pub row_count: usize,
    pub data_preview: Vec<Vec<String>>,
    pub file_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableSchema {
    pub column_name: String,
    pub data_type: String,
    pub nullable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub total_memory: u64,
    pub available_memory: u64,
    pub cpu_count: usize,
}

#[tauri::command]
pub async fn read_csv_file(path: String) -> Result<FileReadResult, String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }
    
    // Detect encoding
    let encoding = utils::detect_encoding(&path)
        .map_err(|e| format!("Failed to detect encoding: {}", e))?;
    
    // Read file with detected encoding
    let file_content = std::fs::read(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let (decoded, _, _) = encoding.decode(&file_content);
    let decoded_string = decoded.to_string();
    
    // Parse CSV
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_reader(decoded_string.as_bytes());
    
    // Get headers
    let headers = reader.headers()
        .map_err(|e| format!("Failed to read headers: {}", e))?
        .iter()
        .map(|h| h.to_string())
        .collect::<Vec<_>>();
    
    // Read preview rows
    let mut data_preview = Vec::new();
    let mut row_count = 0;
    
    for (i, result) in reader.records().enumerate() {
        let record = result.map_err(|e| format!("Failed to read row {}: {}", i, e))?;
        
        if i < 100 {  // Preview first 100 rows
            data_preview.push(record.iter().map(|f| f.to_string()).collect());
        }
        row_count += 1;
    }
    
    Ok(FileReadResult {
        columns: headers,
        row_count,
        data_preview,
        file_name: file_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
    })
}

#[tauri::command]
pub async fn read_excel_file(path: String) -> Result<FileReadResult, String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File not found: {}", path));
    }
    
    // Open Excel file
    let mut workbook: Xlsx<_> = open_workbook(&path)
        .map_err(|e| format!("Failed to open Excel file: {}", e))?;
    
    // Get the first sheet
    let sheet_names = workbook.sheet_names();
    if sheet_names.is_empty() {
        return Err("No sheets found in Excel file".to_string());
    }
    
    let first_sheet = &sheet_names[0];
    
    // Read data from the first sheet
    if let Ok(range) = workbook.worksheet_range(first_sheet) {
        let mut columns = Vec::new();
        let mut data_preview = Vec::new();
        let mut row_count = 0;
        
        // Get dimensions
        let (height, width) = range.get_size();
        
        // Extract headers from first row
        if height > 0 {
            for col in 0..width {
                let value = range.get_value((0, col))
                    .map(|v| v.to_string())
                    .unwrap_or_else(|| format!("Column_{}", col + 1));
                columns.push(value);
            }
        }
        
        // Extract data rows
        for row in 1..height {
            let mut row_data = Vec::new();
            for col in 0..width {
                let value = range.get_value((row, col))
                    .map(|v| v.to_string())
                    .unwrap_or_default();
                row_data.push(value);
            }
            
            if row <= 100 {  // Preview first 100 rows
                data_preview.push(row_data);
            }
            row_count += 1;
        }
        
        Ok(FileReadResult {
            columns,
            row_count,
            data_preview,
            file_name: file_path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
        })
    } else {
        Err(format!("Failed to read sheet: {}", first_sheet))
    }
}

#[tauri::command]
pub async fn execute_sql(query: String) -> Result<Vec<Vec<String>>, String> {
    // TODO: This will be handled by DuckDB-Wasm on the frontend
    Ok(vec![vec!["Results will be processed in frontend".to_string()]])
}

#[tauri::command]
pub async fn export_to_csv(data: Vec<Vec<String>>, path: String, headers: Vec<String>) -> Result<(), String> {
    use std::io::Write;
    use csv::Writer;
    
    let file = File::create(&path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    let mut writer = Writer::from_writer(file);
    
    // Write headers
    writer.write_record(&headers)
        .map_err(|e| format!("Failed to write headers: {}", e))?;
    
    // Write data
    for row in data {
        writer.write_record(&row)
            .map_err(|e| format!("Failed to write row: {}", e))?;
    }
    
    writer.flush()
        .map_err(|e| format!("Failed to flush writer: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn export_to_excel(data: Vec<Vec<String>>, path: String, headers: Vec<String>) -> Result<(), String> {
    // For now, we'll export as CSV with .xlsx extension warning
    // Full Excel export would require additional crates like xlsxwriter or rust_xlsxwriter
    return Err("Excel export not yet implemented. Please use CSV format.".to_string());
}

#[tauri::command]
pub async fn get_table_schema(table_name: String) -> Result<Vec<TableSchema>, String> {
    // TODO: Return schema information
    Ok(vec![])
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        total_memory: 16_000_000_000, // 16GB
        available_memory: 8_000_000_000, // 8GB
        cpu_count: num_cpus::get(),
    })
}