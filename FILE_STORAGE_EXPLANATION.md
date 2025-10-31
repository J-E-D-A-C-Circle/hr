# File Storage Location - Important Information

## Where Files Are Actually Stored

**Files are NOT stored in your project folder (`C:\Users\cae\Desktop\nssportal\uploads\`).**

Files are stored in:
```
C:\xampp\htdocs\uploads\
```

## Why?

The `api/upload.php` file defines the upload directory as:
```php
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
```

Since the API files are located at `C:\xampp\htdocs\api\`, the `__DIR__` resolves to that path. Going up one directory (`..`) and then into `uploads/` gives us:
```
C:\xampp\htdocs\uploads\
```

## File Structure

When you upload a file, it's stored like this:
```
C:\xampp\htdocs\uploads\
├── passport\
│   └── [user_id]\
│       └── [timestamp]_[filename]
├── appointment\
│   └── [user_id]\
│       └── [timestamp]_[filename]
├── cv\
│   └── [user_id]\
│       └── [timestamp]_[filename]
└── id_card\
    └── [user_id]\
        └── [timestamp]_[filename]
```

## Database Storage

The database stores the **relative path** from the uploads directory:
- Example: `passport/3/1761907833_Screenshot_2025-10-21_165830.png`

This path is relative to `C:\xampp\htdocs\uploads\`, so the full path is:
- `C:\xampp\htdocs\uploads\passport\3\1761907833_Screenshot_2025-10-21_165830.png`

## How to View Your Files

### Option 1: Windows File Explorer
Navigate to:
```
C:\xampp\htdocs\uploads\
```

### Option 2: Via Browser
Files are served through:
```
http://localhost/api/upload.php?action=serve&path=[relative_path]&token=[your_token]
```

Example:
```
http://localhost/api/upload.php?action=serve&path=passport/3/1761907833_Screenshot_2025-10-21_165830.png&token=[token]
```

### Option 3: Via Admin Dashboard
The admin dashboard has "View" buttons that automatically generate the correct URLs with authentication tokens.

## Verification

To verify files are being saved correctly:

1. Upload a file through the application form
2. Check `C:\xampp\htdocs\uploads\[type]\[user_id]\` for the uploaded file
3. The database will have the relative path stored in the appropriate column

## Troubleshooting

If you can't find files:
1. Make sure XAMPP is running
2. Check that `C:\xampp\htdocs\uploads\` exists and has write permissions
3. Verify the API is running from `C:\xampp\htdocs\api\`
4. Check PHP error logs if files aren't uploading

