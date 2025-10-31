# File Upload System Guide

## Overview

The file upload system stores uploaded files (passport photos, appointment letters, CVs) in the `uploads/` directory instead of as BLOBs in MySQL. Only file paths are stored in the database.

## Directory Structure

```
uploads/
├── .htaccess          # Security: Prevents direct access
├── .gitkeep           # Git tracking
├── passport/          # Passport photos
│   └── {user_id}/     # User-specific subdirectories
├── appointment/       # Appointment letters
│   └── {user_id}/
├── cv/               # CV/Resume files
│   └── {user_id}/
└── id_card/          # ID card copies
    └── {user_id}/
```

## Database Schema

Files are stored with these database fields:
- `passport_photo` VARCHAR(255) - Path to passport photo
- `id_card_copy` VARCHAR(255) - Path to ID card copy
- `appointment_letter` VARCHAR(255) - Path to appointment letter
- `certificates` VARCHAR(500) - Path to CV/certificates (used for CV)

## API Endpoints

### 1. Upload File
**POST** `/api/upload.php?action=upload`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `file`: The file to upload
- `file_type`: One of `'passport'`, `'appointment'`, `'cv'`, `'id_card'`

**Response:**
```json
{
  "success": true,
  "file_path": "passport/1/1234567890_filename.jpg",
  "file_name": "original_filename.jpg",
  "file_size": 245678,
  "mime_type": "image/jpeg"
}
```

### 2. Serve File (View/Download)
**GET** `/api/upload.php?action=serve&path={file_path}`

**Headers:**
- `Authorization: Bearer {token}` (Required for admin/applicant access)

**Response:**
- File content with appropriate MIME type headers
- Opens in browser for images/PDFs

## Frontend Usage

### Uploading Files

```typescript
import { uploadFile } from '@/lib/file-upload';

// In your form submission handler
const handleFileUpload = async (file: File, fileType: 'passport' | 'appointment' | 'cv') => {
  const token = localStorage.getItem('token');
  
  try {
    const result = await uploadFile(file, fileType, token!);
    // Store result.file_path in formData
    setFormData(prev => ({
      ...prev,
      [fileType === 'passport' ? 'passport_photo' : 
       fileType === 'appointment' ? 'appointment_letter' : 
       'certificates']: result.file_path
    }));
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Displaying Files in Admin View

Files are automatically displayed in the admin modal with "View" buttons that open files in a new tab.

### Getting File URLs

```typescript
import { getFileViewUrl } from '@/lib/file-upload';

const fileUrl = getFileViewUrl(application.passport_photo);
// Returns: http://localhost/api/upload.php?action=serve&path=passport/1/filename.jpg
```

## File Validation

### Allowed File Types:
- **Passport**: JPEG, JPG, PNG, WEBP
- **Appointment Letter**: JPEG, JPG, PNG, PDF
- **CV**: PDF only
- **ID Card**: JPEG, JPG, PNG, PDF

### File Size Limit:
- Maximum: 5MB per file

### Security Features:
1. File type validation using MIME type detection
2. File size limits
3. Sanitized filenames (special characters replaced)
4. User-specific subdirectories
5. Direct access prevention via .htaccess
6. Path traversal prevention
7. Authorization required for viewing files

## Setting Up

1. **Create uploads directory structure:**
   ```bash
   mkdir -p uploads/{passport,appointment,cv,id_card}
   chmod 755 uploads uploads/*
   ```

2. **Add appointment_letter column to database** (if not already done):
   ```sql
   USE dvla_nss_portal;
   ALTER TABLE nss_applications 
   ADD COLUMN appointment_letter VARCHAR(255) NULL AFTER id_card_copy;
   ```

3. **Ensure PHP has write permissions:**
   ```bash
   chmod -R 755 uploads/
   chown -R www-data:www-data uploads/  # For Apache/Nginx
   ```

## Integration Steps

### For Registration/Application Form:

1. Update form to upload files before submission
2. Store returned file paths in formData
3. Submit file paths along with application data
4. API stores paths in database

### For Admin Dashboard:

1. Files are automatically displayed in modal
2. "View" buttons open files in new tab
3. Files are served securely through API

## Testing

1. Upload a test file via the upload endpoint
2. Verify file is saved in correct directory
3. Verify path is stored in database
4. Test file viewing through serve endpoint
5. Verify authorization works (only authenticated users can view)

## Troubleshooting

**Issue**: "Failed to save file"
- Check uploads directory permissions (755)
- Check PHP upload_max_filesize and post_max_size in php.ini
- Verify directory exists

**Issue**: "Invalid file type"
- Check file MIME type
- Ensure file extension matches content

**Issue**: "File not found" when viewing
- Verify file path in database is correct
- Check file actually exists in uploads directory
- Verify path encoding in URL

**Issue**: "Access denied" when viewing
- Ensure Authorization header is sent
- Verify token is valid
- Check user has permission to view (admin or file owner)

