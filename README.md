# DVLA NSS Portal

A portal for National Service Scheme (NSS) personnel to submit their details to DVLA for acceptance. Built with Next.js frontend and PHP/MySQL backend.

## Features

- **User Registration & Login**: NSS personnel can register and log in to the portal
- **Application Submission**: Submit detailed personal, educational, and NSS assignment information
- **Admin Dashboard**: Administrators can review, approve, or reject applications
- **Application Status Tracking**: View application status in real-time
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PHP (v7.4 or higher)
- MySQL (v5.7 or higher)
- XAMPP/WAMP/MAMP or similar local server
- phpMyAdmin for database management

### Database Setup

1. Open phpMyAdmin in your browser (usually `http://localhost/phpmyadmin`)
2. Create a new database or use an existing MySQL server
3. Import the schema file from `database/schema.sql`
4. Update database credentials in `api/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'dvla_nss_portal');
   ```

### Backend Setup (PHP)

1. The PHP API files are in the `api/` directory
2. If using XAMPP, copy the project to `htdocs/` folder
3. Ensure PHP is configured to handle JSON and CORS
4. The API will be accessible at `http://localhost/api/`

### Frontend Setup (Next.js)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Admin Credentials

- Email: `admin@dvla.gov.gh`
- Password: `admin123`

⚠️ **Important**: Change the default admin password in production!

### API Endpoints

#### Authentication
- `POST /api/auth.php?action=register` - Register new user
- `POST /api/auth.php?action=login` - Login user
- `GET /api/auth.php?action=me` - Get current user info

#### Applications
- `POST /api/applications.php?action=submit` - Submit application
- `GET /api/applications.php?action=my-application` - Get user's application
- `GET /api/applications.php?action=all` - Get all applications (admin)
- `GET /api/applications.php?action=view&id={id}` - View specific application (admin)
- `PUT /api/applications.php?action=review` - Review application (admin)

## Project Structure

```
nssportal/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── splash/            # Splash screen
│   └── layout.tsx         # Root layout
├── api/                   # PHP API backend
│   ├── auth.php          # Authentication endpoints
│   ├── applications.php  # Application endpoints
│   ├── config.php        # Database config & helpers
│   └── index.php         # API router
├── database/
│   └── schema.sql        # Database schema
└── public/               # Static files
```

## Technologies Used

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: PHP 7.4+, MySQL
- **Authentication**: Token-based authentication

## Development

- Frontend runs on: `http://localhost:3000`
- Backend API runs on: `http://localhost/api/`

## Production Deployment

1. Build the Next.js app:
   ```bash
   npm run build
   ```

2. Deploy PHP files to your web server
3. Configure MySQL database on production server
4. Update API URLs in the frontend if needed
5. Set proper CORS headers for production domain
6. Configure environment variables and secure admin credentials

## License

This project is for educational/demonstration purposes.
