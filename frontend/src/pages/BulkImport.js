import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  CloudUpload,
  Download,
  CheckCircle,
  Error,
  Info,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const BulkImport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { admin } = useAuth();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (validTypes.includes(selectedFile.type) || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
        setSuccess(null);
        setResults(null);
      } else {
        setError('Please select a valid Excel file (.xlsx, .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

             const response = await fetch('/api/bulk-import/users', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
         },
         body: formData,
       });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        setSuccess(data.message);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
             const response = await fetch('/api/bulk-import/template', {
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
         },
       });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bulk_import_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download template');
      }
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleClearResults = () => {
    setResults(null);
    setSuccess(null);
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bulk Import Users
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload an Excel file to import multiple users at once. The file should contain columns for user_id, referred_by_user_id, balance, and user_name.
      </Typography>

      {/* Instructions Card */}
      <Card sx={{ mb: 3, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Import Instructions
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>user_id</strong>: Unique identifier for each user (required)
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>referred_by_user_id</strong>: ID of the user who referred this user (optional)
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>balance</strong>: Token balance amount (required)
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>user_name</strong>: Display name for the user (required)
          </Typography>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<Download />}
            onClick={handleDownloadTemplate}
            variant="outlined"
            color="primary"
          >
            Download Template
          </Button>
        </CardActions>
      </Card>

      {/* File Upload Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload Excel File
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ minWidth: 200 }}
              >
                Choose File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload & Import'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Results Section */}
      {results && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Import Results
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={handleClearResults}
              variant="outlined"
              size="small"
            >
              Clear Results
            </Button>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Typography variant="h4" color="info.main">
                    {results.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {results.success}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully Imported
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography variant="h4" color="error.main">
                    {results.failed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed to Import
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Error Details */}
          {results.errors && results.errors.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="error">
                Import Errors
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Error Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Error color="error" sx={{ mr: 1 }} />
                            {error}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default BulkImport;
