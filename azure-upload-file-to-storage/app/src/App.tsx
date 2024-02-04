import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, Card, CardMedia, Grid, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import ErrorBoundary from './components/error-boundary';

import axios from 'axios';
import './App.css';
// Import or define SelectedOptions and OptionScores types based on your AssessmentForm
import AssessmentForm, { SelectedOptions, OptionScores } from './AssessmentForm';



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

    const sasUrl = await getUploadSasUrl(uploadFile.name);
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

  // Adapted function to be used with the AssessmentForm submission
  const onFormSubmit = async (selectedOptions: SelectedOptions, selectedScores: OptionScores) => {
    // Construct CSV content
    let csvContent = "Category,Selected Option,Score\n";
    Object.entries(selectedScores).forEach(([category, score]) => {
      const option = selectedOptions[category];
      csvContent += `${category},${option},${score}\n`;
    });
    
    // Now, create a File object for the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvFileName = `assessment_${new Date().toISOString().replace(/:/g, '-')}.csv`;
    const csvFile = new File([blob], csvFileName, { type: 'text/csv;charset=utf-8;' });
  
    // Use the generic upload handler
    handleFileUpload(csvFile);
  };

  return (
    <ErrorBoundary>
      <Box m={4}>
        <Typography variant="h4" gutterBottom>SKIRNIR</Typography>
        <Typography variant="h5" gutterBottom>wound assessment</Typography>

        <AssessmentForm onSubmit={onFormSubmit} />

        <Typography variant="body1" gutterBottom><b>Container: {containerName}</b></Typography>
        <Button variant="contained" component="label">Select File
          <input type="file" hidden onChange={handleFileSelection} />
        </Button>
        {selectedFile && selectedFile.name && <Typography variant="body2" my={2}>{selectedFile.name}</Typography>}
        <Button variant="contained" onClick={() => handleFileUpload()} disabled={!selectedFile}>Upload</Button>
        {uploadStatus && <Typography variant="body2" gutterBottom my={2}>{uploadStatus}</Typography>}

        <Grid container spacing={2} my={4}>
          {list.map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item}>
              <Card>
                {item.endsWith('.csv') ? (
                  <Box p={2}>
                    <Typography variant="body2">{item}</Typography>
                    {/* Future extension: Add download or view functionality */}
                  </Box>
                ) : (
                  <CardMedia component="img" image={item} alt={item}/>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </ErrorBoundary>
  );
}

export default App;