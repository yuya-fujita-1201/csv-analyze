use encoding_rs::{UTF_8, SHIFT_JIS};
use std::fs::File;
use std::io::Read;
use anyhow::Result;

pub fn detect_encoding(file_path: &str) -> Result<&'static encoding_rs::Encoding> {
    let mut file = File::open(file_path)?;
    let mut buffer = vec![0; 8192]; // Read first 8KB
    let bytes_read = file.read(&mut buffer)?;
    buffer.truncate(bytes_read);
    
    // Simple encoding detection - can be improved
    if buffer.windows(3).any(|w| w == b"\xEF\xBB\xBF") {
        Ok(UTF_8)
    } else if buffer.iter().any(|&b| b >= 0x80) {
        // Check if it's valid UTF-8
        if std::str::from_utf8(&buffer).is_ok() {
            Ok(UTF_8)
        } else {
            Ok(SHIFT_JIS)
        }
    } else {
        Ok(UTF_8)
    }
}

pub fn sanitize_column_name(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '_' { c } else { '_' })
        .collect()
}

pub fn generate_unique_column_names(columns: Vec<String>, file_prefix: &str) -> Vec<String> {
    let mut unique_names = Vec::new();
    let mut name_counts = std::collections::HashMap::new();
    
    for col in columns {
        let base_name = format!("{}_{}", file_prefix, sanitize_column_name(&col));
        let count = name_counts.entry(base_name.clone()).or_insert(0);
        
        let unique_name = if *count == 0 {
            base_name.clone()
        } else {
            format!("{}_{}", base_name, count)
        };
        
        *count += 1;
        unique_names.push(unique_name);
    }
    
    unique_names
}