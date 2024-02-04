import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, CardMedia, Grid, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import ErrorBoundary from './components/error-boundary';

import axios from 'axios';
import './App.css';
// Import or define SelectedOptions and OptionScores types based on your AssessmentForm
import AssessmentForm, { SelectedOptions, OptionScores } from './AssessmentForm';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';



const API_SERVER = import.meta.env.VITE_API_SERVER;

const request = axios.create({
  baseURL: API_SERVER,
  headers: {
    'Content-Type': 'application/json',
  },
});

function App() {
  const containerName = 'upload';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [list, setList] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false); 
  const [dialogContent, setDialogContent] = useState<{type: 'image' | 'csv', content: string, totalScore?: number} | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const result = await request.get(`/api/list?container=${containerName}`);
      setList(result.data.list);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const parseCsvContent = (csvText: string) => {
    return csvText.split('\n').map(row => row.split(','));
  };


  const getUploadSasUrl = async (filename: string) => {
    const permission = 'w'; // write
    const timerange = 5; // minutes
    try {
      const result = await request.post(`/api/sas?file=${encodeURIComponent(filename)}&permission=${permission}&container=${containerName}&timerange=${timerange}`);
      return result.data.url;
    } catch (error) {
      console.error('Error getting SAS Token:', error);
      throw error;
    }
  };

  // Updated to accept an optional file parameter
  const handleFileUpload = async (file?: File) => {
    const uploadFile = file || selectedFile;
    if (!uploadFile) return;

    const originalName = file?.name || selectedFile?.name || "unnamed";
    const dateTimeSuffix = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const filename = `${originalName}_${dateTimeSuffix}`; // Date is now at the end
    const sasUrl = await getUploadSasUrl(filename);
    const blockBlobClient = new BlockBlobClient(sasUrl);
  


    blockBlobClient.uploadData(uploadFile, { onProgress: (progress) => console.log(progress.loadedBytes) })
      .then(() => {
        setUploadStatus('Successfully finished upload');
        fetchImages(); // Fetch images and CSVs again to update the list
      })
      .catch((error) => {
        console.error('Upload failed:', error);
        setUploadStatus('Upload failed');
      });

    if (!file) { // Clear selected file only if it's coming from the file input
      setSelectedFile(null);
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setSelectedFile(event.target.files[0]);
    setUploadStatus('');
  };
  const handleItemClick = async (item: string) => {
    if (item.endsWith('.csv')) {
      const response = await fetch(item);
      const csvText = await response.text();
      const totalScore = calculateTotalScore(csvText);
      // Now including totalScore correctly within dialogContent state
      setDialogContent({type: 'csv', content: csvText, totalScore});
    } else {
      setDialogContent({type: 'image', content: item});
    }
    setOpenDialog(true);
  };

  const calculateTotalScore = (csvContent: string): number => {
    if (!csvContent) return 0;
    const lines = csvContent.split('\n').slice(1);
    const scores = lines.map((line: string) => {
      const columns = line.split(',');
      return parseInt(columns[columns.length - 1], 10) || 0;
    });
    return scores.reduce((acc: number, score: number) => acc + score, 0);
  };

  // Adapted function to be used with the AssessmentForm submission
  const onFormSubmit = async (selectedOptions: SelectedOptions, selectedScores: OptionScores, totalScore: number) => {
    let csvContent = "Category,Selected Option,Score\n";
    Object.entries(selectedScores).forEach(([category, score]) => {
      const option = selectedOptions[category];
      csvContent += `${category},${option},${score}\n`;
    });

    const csvFileName = `${totalScore}_${new Date().toISOString().replace(/:/g, '-')}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvFile = new File([blob], csvFileName, { type: 'text/csv;charset=utf-8;' });
  
    handleFileUpload(csvFile);
  };


// App.tsx component

return (
  <ErrorBoundary>
    <Box m={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ textAlign: 'center' }}>
        SKIRNIR
      </Typography>
      <Typography variant="h5" gutterBottom component="h2" sx={{ textAlign: 'center' }}>
        Log
      </Typography>

      <AssessmentForm onSubmit={onFormSubmit} />

      <Typography variant="body1" gutterBottom component="p" sx={{ textAlign: 'center', margin: '20px 0' }}>
        <strong>Image: {containerName}</strong>
      </Typography>
      <Box sx={{ '& > *': { margin: '10px' } }}>
        <Button variant="contained" component="label" sx={{ bgcolor: '#00ACC1', '&:hover': { bgcolor: '#0097A7' }, mt: 2 }} fullWidth>
          Select File
          <input type="file" hidden onChange={handleFileSelection} />
        </Button>

        {selectedFile && selectedFile.name && <Typography variant="body2" my={2} sx={{ textAlign: 'center' }}>{selectedFile.name}</Typography>}
        <Button variant="contained" sx={{ bgcolor: '#00ACC1', '&:hover': { bgcolor: '#0097A7' }, mt: 2 }} fullWidth onClick={() => handleFileUpload()} disabled={!selectedFile}>Upload</Button>
      </Box>
      {uploadStatus && <Typography variant="body2" gutterBottom my={2} sx={{ textAlign: 'center' }}>{uploadStatus}</Typography>}

      <Grid container spacing={2} my={4} sx={{ justifyContent: 'center', maxWidth: '100%' }}>
        {list.map((item, index) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box 
              sx={{ 
                width: 145, 
                height: 145, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                overflow: 'hidden', 
                position: 'relative',
                border: '1px solid #ddd',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                bgcolor: item.endsWith('.csv') ? '#f0f0f0' : '',
                '&:before': item.endsWith('.csv') ? undefined : {
                  content: "''",
                  display: 'block',
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: '20%',
                  backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                },
                '& p': {
                  position: 'absolute',
                  bottom: 5,
                  width: '100%',
                  textAlign: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  bgcolor: item.endsWith('.csv') ? '' : 'rgba(0, 0, 0, 0.6)',
                }
              }} 
              onClick={() => handleItemClick(item)}
            >
              {item.endsWith('.csv') ? (
                <>
                  <Typography variant="caption" sx={{ textAlign: 'center', color:"black", padding:"8px" }}>
                    {`csv file: ${item.substring(0,10)}...`}
                  </Typography>
                </>
              ) : (
                <CardMedia 
                  component="img" 
                  image={item} 
                  alt="Gallery Item"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <Typography sx={{ color: item.endsWith('.csv') ? 'black' : 'white'}}>{item.substring(item.length - 14)}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Dialog onClose={() => setOpenDialog(false)} open={openDialog} fullWidth maxWidth="md">
        <DialogTitle>
          View Content
          <IconButton onClick={() => setOpenDialog(false)} style={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogContent?.type === 'image' ? (
            <Box
              component="img"
              sx={{
                maxHeight: '80vh',
                maxWidth: '100%',
              }}
              src={dialogContent.content}
              alt="Selected"
            />
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableBody>
                  {parseCsvContent(dialogContent?.content || '').map((row, rowIndex) => (
                    <TableRow
                      key={rowIndex}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                    >
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  </ErrorBoundary>
);
}

export default App;