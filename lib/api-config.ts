// API Configuration
// Update this if your PHP API is running on a different URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth.php?action=register`,
    login: `${API_BASE_URL}/auth.php?action=login`,
    me: `${API_BASE_URL}/auth.php?action=me`,
  },
  applications: {
    submit: `${API_BASE_URL}/applications.php?action=submit`,
    myApplication: `${API_BASE_URL}/applications.php?action=my-application`,
    all: `${API_BASE_URL}/applications.php?action=all`,
    view: (id: string | number) => `${API_BASE_URL}/applications.php?action=view&id=${id}`,
    review: `${API_BASE_URL}/applications.php?action=review`,
  },
};

