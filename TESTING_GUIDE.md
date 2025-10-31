# Testing Guide - DVLA NSS Portal

## 🔑 Administrator Login Credentials

**Email:** `admin@dvla.gov.gh`  
**Password:** `admin123`

⚠️ **Note:** Change this password immediately in production!

---

## 📋 Testing Workflow

### Step 1: Register as an Applicant

1. Navigate to: `http://localhost:3000/register`
2. Fill in the registration form:
   - **Full Name:** (e.g., "John Doe")
   - **Email:** (e.g., "john.doe@example.com")
   - **Password:** (minimum 8 characters)
   - **Confirm Password:** (same as password)
   - **Phone Number:** (e.g., "0501234567")
   - **Middle Name:** (optional)
   - **Gender:** Select from dropdown
   - **School:** (e.g., "University of Ghana")
   - **Course:** (e.g., "Computer Science")
   - **Address:** (your address)
   - **Branch:** (DVLA branch you're posted to)
3. Upload files (optional for testing):
   - **Passport Picture:** (image file)
   - **Appointment Letter:** (PDF or image)
   - **CV:** (PDF file)
4. Click **"Continue"** or **"Submit"**
5. You'll be redirected to the success page

### Step 2: Submit Application

1. After registration, you should be redirected to the dashboard
2. If not logged in, login with your credentials:
   - Go to: `http://localhost:3000/login`
   - Enter your email and password
3. From the dashboard:
   - Click **"Start Application"** or navigate to `/dashboard/apply`
4. Fill in the application form:
   - **Personal Information:**
     - First Name, Last Name, Middle Name
     - Date of Birth
     - Gender, Nationality
     - Phone Number, Email
   - **Address Information:**
     - Residential Address
     - Region, District
   - **Educational Information:**
     - Institution Name
     - Course/Program
     - Year of Completion
   - **NSS Assignment Details:**
     - Service Year
     - Posting Region (optional)
     - Posting District (optional)
5. Click **"Submit Application"**
6. You'll see a success message

### Step 3: Login as Administrator

1. Navigate to: `http://localhost:3000/login`
2. Enter admin credentials:
   - **Email:** `admin@dvla.gov.gh`
   - **Password:** `admin123`
3. Click **"Sign In"**
4. You'll be redirected to: `/admin/dashboard`

### Step 4: View Applications as Admin

1. On the admin dashboard, you'll see:
   - **Stats Cards:** Total, Pending, Under Review, Approved, Rejected
   - **Filter Tabs:** All, Pending, Under Review, Approved, Rejected
   - **Applications Table:** List of all applications

2. To view application details:
   - Click the **"View"** button next to any application
   - A modal will open showing:
     - **Personal Information**
     - **Address Information**
     - **Educational Information**
     - **NSS Assignment Details**
     - **Uploaded Documents** (if files were uploaded)
     - **Review Section** (with Approve/Reject buttons)

3. To view uploaded documents:
   - In the modal, scroll to **"Uploaded Documents"** section
   - Click **"View"** button next to any document
   - Document will open in a new tab

### Step 5: Approve/Reject Application

1. In the application modal:
2. Fill in review details:
   - **Review Notes:** (optional notes)
   - **Posting Station:** (required for approval, e.g., "Head Office")
   - **Posting Department:** (required for approval, e.g., "IT Department")
3. Click either:
   - **"Approve"** button (green) - Application will be approved
   - **"Reject"** button (red) - Application will be rejected
4. You'll see a success message
5. The modal closes and the table refreshes

### Step 6: Check Applicant Dashboard (After Approval)

1. Logout from admin account
2. Login as the applicant you created
3. Go to: `http://localhost:3000/dashboard`
4. You should see:
   - **Status:** "Application Successful!" (if approved)
   - **Posting Details:** Station and Department (if approved)
   - **Download Posting Letter** button (if approved)
5. Click **"Download Letter"** to generate and print the PDF

---

## 🧪 Test Cases

### Test Case 1: Registration
- ✅ Can register with valid email
- ✅ Password validation (minimum 8 characters)
- ✅ Email uniqueness check
- ✅ Redirects to success page

### Test Case 2: Application Submission
- ✅ Can submit application with all required fields
- ✅ File uploads work (passport, appointment, CV)
- ✅ File paths stored in database
- ✅ Application status is "pending"

### Test Case 3: Admin Login
- ✅ Can login with admin credentials
- ✅ Redirects to admin dashboard
- ✅ Can see all applications

### Test Case 4: Admin View Application
- ✅ Modal opens with all application details
- ✅ Can see uploaded documents
- ✅ Can view documents in new tab

### Test Case 5: Admin Approval
- ✅ Can approve application with station/department
- ✅ Application status changes to "approved"
- ✅ Station and department saved to database

### Test Case 6: Admin Rejection
- ✅ Can reject application
- ✅ Application status changes to "rejected"

### Test Case 7: Applicant View Status
- ✅ Can see application status on dashboard
- ✅ Approved applications show success message
- ✅ Can download posting letter (if approved)

---

## 🐛 Troubleshooting

### Can't Login as Admin
- Check if admin user exists in database:
  ```sql
  SELECT * FROM users WHERE email = 'admin@dvla.gov.gh';
  ```
- If not, run the schema.sql file again

### Files Not Uploading
- Check `uploads/` folder permissions (Windows: right-click → Properties → Security)
- Check PHP upload settings in `php.ini`:
  - `upload_max_filesize = 5M`
  - `post_max_size = 5M`

### Application Not Showing in Admin Dashboard
- Check if application was submitted successfully
- Verify application status in database:
  ```sql
  SELECT id, first_name, last_name, status FROM nss_applications;
  ```

### Can't View Documents
- Check if file path is correct in database
- Verify file exists in `uploads/` directory
- Check API authentication (token must be valid)

---

## 📊 Database Queries for Testing

### Check Admin User
```sql
USE dvla_nss_portal;
SELECT id, email, role, full_name FROM users WHERE role = 'admin';
```

### Check All Applications
```sql
USE dvla_nss_portal;
SELECT 
    a.id,
    a.first_name,
    a.last_name,
    a.email,
    a.status,
    u.full_name as user_name
FROM nss_applications a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

### Check File Uploads
```sql
USE dvla_nss_portal;
SELECT 
    id,
    first_name,
    last_name,
    passport_photo,
    appointment_letter,
    certificates
FROM nss_applications
WHERE passport_photo IS NOT NULL 
   OR appointment_letter IS NOT NULL 
   OR certificates IS NOT NULL;
```

### Check Approved Applications
```sql
USE dvla_nss_portal;
SELECT 
    id,
    first_name,
    last_name,
    posting_station,
    posting_department,
    status
FROM nss_applications
WHERE status = 'approved';
```

---

## ✅ Quick Test Checklist

- [ ] Can register new applicant account
- [ ] Can login as applicant
- [ ] Can submit application
- [ ] Can upload files (passport, appointment, CV)
- [ ] Can login as admin (`admin@dvla.gov.gh` / `admin123`)
- [ ] Can see applications in admin dashboard
- [ ] Can view application details in modal
- [ ] Can view uploaded documents
- [ ] Can approve application with station/department
- [ ] Can reject application
- [ ] Applicant can see status change
- [ ] Approved applicant can download PDF

---

## 🎯 Expected Results

1. **After Registration:** User can login and see dashboard
2. **After Application Submission:** Application appears in admin dashboard with "pending" status
3. **After Admin Approval:** 
   - Application status changes to "approved"
   - Applicant dashboard shows "Application Successful!"
   - Applicant can download posting letter PDF
4. **After Admin Rejection:**
   - Application status changes to "rejected"
   - Applicant dashboard shows "Application Rejected"

---

Happy Testing! 🚀

