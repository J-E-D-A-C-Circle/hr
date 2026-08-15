// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
  },
  applications: {
    submit: `${API_BASE_URL}/applications/submit`,
    myApplication: `${API_BASE_URL}/applications/my-application`,
    all: `${API_BASE_URL}/applications/all`,
    view: (id: string | number) => `${API_BASE_URL}/applications/view/${id}`,
    review: `${API_BASE_URL}/applications/review`,
    generatePdf: `${API_BASE_URL}/applications/generate-pdf`,
  },
  upload: {
    upload: `${API_BASE_URL}/upload`,
    serve: `${API_BASE_URL}/upload/serve`,
  },
};


