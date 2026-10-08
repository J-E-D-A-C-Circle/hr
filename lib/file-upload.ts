// File upload utility for handling file uploads to the API
import axios from 'axios';

export interface UploadResponse {
  success: boolean;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export async function uploadFile(
  file: File,
  fileType: 'passport' | 'appointment' | 'cv' | 'id_card' | 'certificate',
  token: string
): Promise<UploadResponse> {
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 20MB limit. Please upload a smaller file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);

  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.success) {
      return response.data;
    }
    
    throw new Error('Invalid response from server');
  } catch (error: any) {
    if (error.response?.status === 413 || error.message?.includes('413')) {
      throw new Error('File size is too large (exceeds 20MB). Please compress the file and try again.');
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'File upload failed');
  }
}

export function getFileViewUrl(filePath: string, token?: string): string {
  const t = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '');
  return `/api/upload/serve?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(t || '')}`;
}


