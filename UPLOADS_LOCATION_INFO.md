# Uploads Folder Location

## Where Files Are Saved

When applicants upload documents (passport photo, appointment letter, CV), they are saved to:

**Location:** `C:\xampp\htdocs\uploads\`

## Folder Structure

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

## Example Path

If user with ID `5` uploads a passport photo:
- **Full Path:** `C:\xampp\htdocs\uploads\passport\5\1698765432_passport.jpg`
- **Stored in DB:** `passport/5/1698765432_passport.jpg`

## Accessing Files

### Via File System
Yes, you can see the uploaded files by:
1. Opening File Explorer
2. Navigating to: `C:\xampp\htdocs\uploads\`
3. Opening the subfolder (`passport`, `appointment`, `cv`, or `id_card`)
4. Opening the user ID folder
5. You'll see the actual uploaded files

### Via Browser/API
Files are served securely through:
- **URL:** `http://localhost/api/upload.php?action=serve&path=passport/5/1698765432_passport.jpg`
- **Authentication:** Requires valid token (admin or the file owner)

## Important Notes

1. **Files are physically stored** on your server's hard drive
2. **You can browse them directly** in File Explorer
3. **File names include timestamps** to prevent conflicts
4. **User-specific folders** keep files organized
5. **Only accessible via API** for security (direct file access is blocked by `.htaccess`)

## Verify Uploads Are Working

1. Complete a registration and upload a document
2. Check: `C:\xampp\htdocs\uploads\passport\[user_id]\`
3. You should see the uploaded file!

## Troubleshooting

If files aren't appearing:
- Check Apache is running
- Verify folder permissions (should be writable)
- Check `C:\xampp\htdocs\uploads\` exists
- Look for PHP errors in upload logs

