// frontend/src/components/common/FileUpload.jsx
import React, { useCallback, useState } from 'react';
import { Box, Typography, Button, LinearProgress, Alert } from '@mui/material';
import { CloudUpload, Image, PictureAsPdf, InsertDriveFile } from '@mui/icons-material';

const FileUpload = ({ 
  label = 'Sélectionner un fichier',
  accept = '*/*',
  onFileSelect,
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  multiple = false,
  helperText
}) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validation taille
    if (selectedFile.size > maxSize) {
      setError(`Fichier trop volumineux. Maximum: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  }, [maxSize, onFileSelect]);

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image color="primary" />;
    if (fileType === 'application/pdf') return <PictureAsPdf color="error" />;
    return <InsertDriveFile color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <input
        accept={accept}
        style={{ display: 'none' }}
        id={`file-upload-${label.replace(/\s/g, '-')}`}
        type="file"
        multiple={multiple}
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      <label htmlFor={`file-upload-${label.replace(/\s/g, '-')}`}>
        <Button
          component="span"
          variant="outlined"
          startIcon={<CloudUpload />}
          fullWidth
          disabled={uploading}
        >
          {label}
        </Button>
      </label>
      
      {helperText && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {helperText}
        </Typography>
      )}

      {file && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getFileIcon(file.type)}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            <Button 
              size="small" 
              color="error" 
              onClick={() => {
                setFile(null);
                if (onFileSelect) onFileSelect(null);
              }}
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {uploading && <LinearProgress sx={{ mt: 1 }} />}
    </Box>
  );
};

export default FileUpload;