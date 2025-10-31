// File upload utility for handling file uploads to the API
import axios from 'axios';

const API_BASE_URL = 'http://localhost/api';

export interface UploadResponse {
  success: boolean;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export async function uploadFile(
  file: File,
  fileType: 'passport' | 'appointment' | 'cv' | 'id_card',
  token: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/upload.php?action=upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Validate response is JSON
    if (response.data && typeof response.data === 'object' && response.data.success) {
      return response.data;
    }
    
    throw new Error('Invalid response from server');
  } catch (error: any) {
    // Handle different error types
    if (error.response) {
      const contentType = error.response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        throw new Error(error.response.data?.error || 'File upload failed');
      } else {
        // HTML error response (PHP error)
        throw new Error('Server error occurred. Please check file size and format.');
      }
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'File upload failed');
    }
  }
}

export function getFileViewUrl(filePath: string): string {
  return `${API_BASE_URL}/upload.php?action=serve&path=${encodeURIComponent(filePath)}`;
}

