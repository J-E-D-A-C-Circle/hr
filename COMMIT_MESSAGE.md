feat: Major UI/UX improvements and bug fixes for NSS Portal

## Features Added

### File Management
- Enhanced upload folder structure with user name integration
  - Upload folders now include user names (e.g., `passport/3-constance/`)
  - Maintains backward compatibility with old format (e.g., `passport/3/`)
  - Improved file organization and identification

### Admin Dashboard Enhancements
- Complete mobile responsive redesign
  - Responsive stats cards with adaptive sizing
  - Mobile-optimized table with hidden columns on smaller screens
  - Responsive filter tabs with horizontal scroll
  - Mobile header with logout functionality
- Modern and aesthetically pleasing UI updates
  - Redesigned stats cards with gradients, icons, and hover effects
  - Enhanced table design with avatar circles and modern styling
  - Improved modal design with gradient header and sectioned content
  - Beautiful notification toast system replacing system alerts

### Application Letter PDF
- Professional PDF redesign with DVLA branding
  - Added logo (oop.png) at the top of appointment letters
  - Beautiful gradient styling and professional typography
  - Enhanced posting assignment details section
  - Improved layout with proper spacing and visual hierarchy
  - Added signature section and professional footer

### User Experience Improvements
- Password visibility toggle on login page
  - Eye icon to show/hide password
  - Improved user experience for password entry
- Toast notifications replacing system alerts
  - Success and error notifications with gradients
  - Auto-dismiss after 4 seconds with manual close option
  - Responsive design for mobile and desktop

## Bug Fixes

### File Serving
- Fixed black screen issue when viewing uploaded documents
  - Improved output buffering handling
  - Windows path separator normalization
  - Enhanced MIME type detection with fallback
  - Better error handling for file access

### Modal Issues
- Fixed black screen when clicking "View" in admin dashboard
  - Increased z-index and fixed modal structure
  - Improved event propagation handling
  - Better overlay opacity and backdrop blur

### Data Display
- Fixed district field display issues
  - Proper fallback from posting_district to district
  - Prevents showing "0" or empty values
  - District now properly displayed in both modal and PDF

### Status Management
- Removed unused "under_review" status from UI
  - Streamlined workflow from pending → approved/rejected
  - Updated stats cards and filter tabs accordingly

## Technical Improvements

- Improved error handling throughout the application
- Enhanced file upload compatibility (old and new formats)
- Better responsive design patterns
- Improved accessibility with proper ARIA attributes
- Enhanced security for file serving

## Files Modified

- `app/admin/dashboard/page.tsx` - Complete UI redesign and mobile responsiveness
- `app/dashboard/page.tsx` - PDF redesign with logo and professional styling
- `app/login/page.tsx` - Added password visibility toggle
- `api/upload.php` - Enhanced file serving and folder structure
- `api/applications.php` - Improved data handling for PDF generation
- `api/reset-user-password.php` - Password reset utility
- `api/get-user-password.php` - User lookup utility
- `api/test-password.php` - Password verification testing tool

## Database
- Maintains backward compatibility with existing file paths
- Enhanced folder naming with user identification

