import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, Card, CardMedia, Grid, Typography } from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import ErrorBoundary from './components/error-boundary';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';

import axios from 'axios';
import './App.css';
import AssessmentForm from './AssessmentForm';

const API_SERVER = import.meta.env.VITE_API_SERVER as string;

const request = axios.create({
  baseURL: API_SERVER,
  headers: {
    'Content-type': 'application/json',
  },
});

function App() {
  const containerName = `upload`;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const result = await request.get(`/api/list?container=${containerName}`);
      const { data } = result;
      setList(data.list);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
    if (!(target instanceof HTMLInputElement)) return;
    if (target?.files === null || target?.files?.length === 0 || target?.files[0] === null) return;

    setSelectedFile(target?.files[0]);
    setUploadStatus('');
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    const getUploadSasUrl = async () => {
      const permission = 'w'; //write
      const timerange = 5; //minutes
      try {
        const result = await request.post(`/api/sas?file=${encodeURIComponent(selectedFile.name)}&permission=${permission}&container=${containerName}&timerange=${timerange}`);
        return result.data.url;
      } catch (error) {
        console.error('Error getting SAS Token:', error);
        throw error;
      }
    };

    const uploadFileWithSas = async (sasUrl: string) => {
      const fileArrayBuffer = await convertFileToArrayBuffer(selectedFile);
      if (!fileArrayBuffer) throw new Error('File conversion failed or file is empty.');
      
      const blockBlobClient = new BlockBlobClient(sasUrl);
      await blockBlobClient.uploadData(fileArrayBuffer);
    };

    getUploadSasUrl()
      .then(uploadFileWithSas)
      .then(() => {
        setUploadStatus('Successfully finished upload');
        fetchImages(); // Fetch images again to update the list
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? `Failed to finish upload: ${error.message}` : "Upload failed.";
        setUploadStatus(errorMessage);
      });
  };

  return (
    <>
      <ErrorBoundary>
        <Box m={4}>
          <Typography variant="h4" gutterBottom>SKIRNIR</Typography>
          <Typography variant="h5" gutterBottom>wound assessment</Typography>

          <AssessmentForm />
          <Typography variant="body1" gutterBottom><b>Container: {containerName}</b></Typography>

          <Box display="block" justifyContent="left" alignItems="left" flexDirection="column" my={4}>
            <Button variant="contained" component="label">Select File
            <input type="file" hidden onChange={handleFileSelection} />
            </Button>
            {selectedFile && selectedFile.name && 
              <Box my={2}><Typography variant="body2">{selectedFile.name}</Typography></Box>
            }
            {selectedFile && (
              <Box display="block" justifyContent="left" alignItems="left" flexDirection="column" my={4}>
                <Button variant="contained" onClick={handleFileUpload}>Upload</Button>
                {uploadStatus && <Box my={2}><Typography variant="body2" gutterBottom>{uploadStatus}</Typography></Box>}
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            {list.map((item) => (
              <Grid item xs={6} sm={4} md={3} key={item}>
                <Card>
                  <CardMedia component="img" image={item} alt={item} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </ErrorBoundary>
    </>
  );
}

export default App;