# DVLA NSS Portal - Setup Guide

## Quick Start

### Step 1: Database Setup (phpMyAdmin)

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on "SQL" tab
3. Copy and paste the contents of `database/schema.sql`
4. Click "Go" to execute
5. Verify the database `dvla_nss_portal` is created with tables `users` and `nss_applications`

### Step 2: Configure Database Connection

Edit `api/config.php` and update these lines if your MySQL credentials are different:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // Your MySQL username
define('DB_PASS', '');          // Your MySQL password
define('DB_NAME', 'dvla_nss_portal');
```

### Step 3: Set Up PHP API

**Option A: Using XAMPP/WAMP/MAMP**
- Copy the entire project folder to:
  - XAMPP: `C:\xampp\htdocs\` or `/Applications/XAMPP/htdocs/`
  - WAMP: `C:\wamp64\www\`
  - MAMP: `/Applications/MAMP/htdocs/`

**Option B: Using PHP Built-in Server**
```bash
cd api
php -S localhost:8080
```
Then update API URLs in the frontend to `http://localhost:8080/`

### Step 4: Install Next.js Dependencies

```bash
npm install
```

### Step 5: Start Next.js Development Server

```bash
npm run dev
```

### Step 6: Access the Portal

- Frontend: `http://localhost:3000`
- API: `http://localhost/api/` (if using XAMPP/WAMP/MAMP)

## Default Login Credentials

### Admin Account
- Email: `admin@dvla.gov.gh`
- Password: `admin123`

⚠️ **Change this password immediately in production!**

## Testing the Portal

1. **Register a new NSS personnel account:**
   - Go to `http://localhost:3000/login`
   - Click "Register" tab
   - Fill in your details and create an account

2. **Submit an application:**
   - After logging in, click "Submit Application"
   - Fill in all required fields
   - Submit the form

3. **Admin review:**
   - Log in as admin using the default credentials
   - View all applications in the admin dashboard
   - Click on an application to review it
   - Approve or reject with review notes

## Troubleshooting

### API not connecting?
1. Check if PHP is running
2. Verify database credentials in `api/config.php`
3. Check browser console for CORS errors
4. Make sure API URL in frontend matches your PHP server

### Database connection errors?
1. Verify MySQL is running
2. Check database name, username, and password
3. Ensure the database and tables exist (run schema.sql again)

### CORS errors?
- Update `api/config.php` to include your exact frontend URL
- Make sure both servers are running

## File Structure

```
nssportal/
├── app/                          # Next.js frontend
│   ├── admin/                   # Admin pages
│   │   ├── dashboard/          # Admin dashboard
│   │   └── applications/[id]/  # View/review application
│   ├── dashboard/               # User dashboard
│   │   ├── apply/              # Submit application
│   │   └── view-application/   # View own application
│   ├── login/                   # Login/Register page
│   └── page.tsx                 # Home (redirects to login/dashboard)
├── api/                         # PHP backend
│   ├── auth.php                # Authentication API
│   ├── applications.php        # Applications API
│   ├── config.php              # Database config
│   └── index.php               # API router
├── database/
│   └── schema.sql              # Database schema
└── public/                     # Static files
```

## API Endpoints

### Authentication
- `POST /api/auth.php?action=register` - Register
- `POST /api/auth.php?action=login` - Login
- `GET /api/auth.php?action=me` - Get current user

### Applications
- `POST /api/applications.php?action=submit` - Submit application
- `GET /api/applications.php?action=my-application` - Get user's application
- `GET /api/applications.php?action=all` - Get all (admin)
- `GET /api/applications.php?action=view&id={id}` - View specific (admin)
- `PUT /api/applications.php?action=review` - Review application (admin)

## Next Steps

1. Customize the design to match DVLA branding
2. Add file upload functionality for documents
3. Implement email notifications
4. Add password reset functionality
5. Enhance security measures
6. Add pagination for large application lists
7. Export functionality for reports

