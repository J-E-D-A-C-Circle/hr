# Uploads Folder Location

## Important Note

**Files are NOT stored in the project's `uploads` folder.** They are stored in the XAMPP `htdocs` directory.

## Actual Storage Location

Uploaded files are stored at:
```
C:\xampp\htdocs\uploads\
```

This is because the `api/upload.php` file uses:
```php
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
```

Since the API files are at `C:\xampp\htdocs\api\`, the uploads directory is at `C:\xampp\htdocs\uploads\`.

## Folder Structure

```
C:\xampp\htdocs\uploads\
├── passport\
│   └── [user_id]\
│       └── [filename]
├── appointment\
│   └── [user_id]\
│       └── [filename]
├── cv\
│   └── [user_id]\
│       └── [filename]
└── id_card\
    └── [user_id]\
        └── [filename]
```

## Why You Can't See Files in Project Folder

The `uploads` folder in your project (`C:\Users\cae\Desktop\nssportal\uploads\`) is only used as a placeholder. Actual uploaded files are stored in `C:\xampp\htdocs\uploads\`.

## Accessing Uploaded Files

1. **Via Browser**: Files are served through the API endpoint:
   ```
   http://localhost/api/upload.php?action=serve&path=[file_path]&token=[token]
   ```

2. **Direct File Access**: You can navigate to:
   ```
   C:\xampp\htdocs\uploads\
   ```
   in Windows File Explorer to see the actual files.

## Viewing Files in Admin Dashboard

The admin dashboard now includes proper file viewing links that:
- Include authentication tokens
- Open files in new tabs
- Work with the updated upload.php API

Make sure your XAMPP server is running and the `uploads` directory exists in `htdocs`.

