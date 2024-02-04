import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, Card, CardMedia, Grid, Typography } from '@mui/material';
import { ChangeEvent, useState } from 'react';
import ErrorBoundary from './components/error-boundary';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';

import axios, { AxiosResponse } from 'axios';
import './App.css';

// Environment variable for the API server URL
const API_SERVER = import.meta.env.VITE_API_SERVER as string;

const request = axios.create({
  baseURL: API_SERVER,
  headers: {
    'Content-type': 'application/json'
  }
});

type SasResponse = {
  url: string;
};
type ListResponse = {
  list: string[];
};

function App() {
  const containerName = `upload`;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [list, setList] = useState<string[]>([]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;

    if (!(target instanceof HTMLInputElement)) return;
    if (
      target?.files === null ||
      target?.files?.length === 0 ||
      target?.files[0] === null
    )
      return;

    setSelectedFile(target?.files[0]);
    // Reset the upload status whenever a new file is selected
    setUploadStatus('');
  };

  const getFileSasToken = async (fileName: string): Promise<string> => {
    const permission = 'w'; // Write permission
    const timerange = 5; // Valid time range in minutes
    
    try {
      const response = await request.post<SasResponse>(
        `/api/sas?file=${encodeURIComponent(
          fileName
        )}&permission=${permission}&container=${containerName}&timerange=${timerange}`
      );
      
      return response.data.url;
    } catch (error) {
      // Error handling
      if (error instanceof Error) {
        console.error(`Error getting SAS token: ${error.message}`);
      } else {
        console.error(`Unknown error getting SAS token.`);
      }
      throw error; // Rethrow to handle it in the calling function
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      const sasTokenUrl = await getFileSasToken(selectedFile.name);
      const fileArrayBuffer = await convertFileToArrayBuffer(selectedFile);
      
      if (fileArrayBuffer === null || fileArrayBuffer.byteLength < 1) {
        setUploadStatus('File is empty or too large');
        return;
      }

      const blockBlobClient = new BlockBlobClient(sasTokenUrl);
      await blockBlobClient.uploadData(fileArrayBuffer);
      setUploadStatus('Successfully finished upload');

      const result = await request.get<ListResponse>(`/api/list?container=${containerName}`);
      setList(result.data.list);
    } catch (error) {
      if (error instanceof Error) {
        setUploadStatus(`Upload failed: ${error.message}`);
      } else {
        setUploadStatus('Upload failed with an unknown error.');
      }
    }
  };

  return (
    <>
      <ErrorBoundary>
        <Box m={4}>
          {/* App Title and other UI components remain unchanged */}
          {/* Only changes are in the JavaScript logic, particularly in the file upload flow */}
          {/* [UI Components same as before] */}

          {/* File Upload Section */}
          {selectedFile && (
            <Box
              display="block"
              justifyContent="left"
              alignItems="left"
              flexDirection="column"
              my={4}
            >
              <Button variant="contained" onClick={handleFileUpload}>
                Upload
              </Button>
              {uploadStatus && (
                <Box my={2}>
                  <Typography variant="body2" gutterBottom>
                    {uploadStatus}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Uploaded Files Display and the rest of the UI components are unchanged */}
          {/* [UI Components same as before] */}
        </Box>
      </ErrorBoundary>
    </>
  );
}

export default App;