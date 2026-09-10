# Local Volunteer Registration & Verification System - Implementation Summary

## Overview
This document summarizes the implementation of the "Local Volunteer Registration & Verification System" feature for the Travya Tourist Safety Application.

## Files Created/Modified

### 1. Database Schema
**File:** `locals-schema.sql`

**Contents:**
- Creates `locals` table with fields:
  - `id` (UUID, PK)
  - `name` (TEXT)
  - `email` (TEXT, UNIQUE)
  - `phone` (TEXT)
  - `address` (TEXT)
  - `city` (TEXT)
  - `id_proof_url` (TEXT, optional)
  - `availability` (TEXT, optional)
  - `is_verified` (BOOLEAN, default FALSE)
  - `verified_by` (UUID, FK to tourists.id)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- Indexes for performance
- RLS policies for security:
  - Anyone can insert (register)
  - Anyone can view verified locals
  - Authenticated users can view all locals
  - Users can view their own record
  - Authenticated users can update/delete (frontend controls access)

### 2. Database Functions
**File:** `src/lib/db.js`

**Added Functions:**
- `listLocals()` - List all locals
- `listUnverifiedLocals()` - List unverified locals (for police dashboard)
- `registerLocal({ form, idProofFile })` - Register a new local volunteer
- `verifyLocalById(id, verifiedBy)` - Verify a local volunteer
- `rejectLocal(id)` - Reject/delete a local volunteer application

### 3. Local Registration Component
**File:** `src/pages/LocalRegistration.jsx`

**Features:**
- Registration form with fields:
  - Full Name
  - Email
  - Password
  - Phone Number
  - Address/Area
  - City
  - ID Proof (file upload, optional)
  - Availability (optional text)
- Creates Supabase Auth account with role 'local'
- Uploads ID proof to Supabase Storage (bucket: 'tourist-assets')
- Creates local record in database
- Auto-signs in after registration
- Redirects to home page after success

### 4. Home Page Update
**File:** `src/pages/home.jsx`

**Changes:**
- Added "Register Yourself as Local" button in hero section
- Links to `/local-register` route

### 5. App Routing
**File:** `src/App.jsx`

**Changes:**
- Added import for `LocalRegistration` component
- Added route: `/local-register` → `<LocalRegistration/>`

### 6. Police Dashboard Update
**File:** `src/pages/policedashboard.jsx`

**Changes:**
- Added "Locals Verification" tab
- Added state for locals list and loading
- Added `useEffect` to fetch unverified locals when tab is active
- Added tab content displaying:
  - List of unverified locals
  - Name, Email, Phone, Address, City
  - Availability (if provided)
  - ID Proof link (if uploaded)
  - Registration date
  - Approve/Reject buttons
- Approve functionality:
  - Sets `is_verified = true`
  - Records `verified_by` (police user's tourist ID)
  - Removes from unverified list
- Reject functionality:
  - Deletes local record
  - Removes from list

## Supabase Queries Used

### Register Local
```javascript
// 1. Create Auth account
supabase.auth.signUp({
  email: form.email,
  password: form.password,
  options: { data: { role: 'local' } }
})

// 2. Upload ID proof (if provided)
supabase.storage.from('tourist-assets')
  .upload(`locals/id-proofs/${timestamp}_${filename}`, file)

// 3. Insert local record
supabase.from('locals').insert([{
  name: form.fullName,
  email: form.email,
  phone: form.phoneNumber,
  address: form.address,
  city: form.city,
  id_proof_url: idProofUrl,
  availability: form.availability,
  is_verified: false
}])
```

### List Unverified Locals
```javascript
supabase.from('locals')
  .select('*')
  .eq('is_verified', false)
  .order('created_at', { ascending: false })
```

### Verify Local
```javascript
supabase.from('locals')
  .update({ is_verified: true, verified_by: verifiedBy })
  .eq('id', id)
```

### Reject Local
```javascript
supabase.from('locals')
  .delete()
  .eq('id', id)
```

## Access Control

### Frontend Access Control
- Only police dashboard shows "Locals Verification" tab
- Only police users can access `/police` route (handled by existing routing)
- Registration form is public (anyone can register)

### Database Access Control (RLS)
- Anyone can insert (register as local)
- Anyone can view verified locals
- Authenticated users can view all locals
- Users can view their own local record
- Authenticated users can update/delete (frontend ensures only police can verify/reject)

## Setup Instructions

### 1. Run Database Schema
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `locals-schema.sql`
4. Execute the script
5. Verify table `locals` was created

### 2. Verify Storage Bucket
Ensure `tourist-assets` bucket exists and allows uploads:
- Supabase Dashboard → Storage → tourist-assets
- Check policies allow authenticated uploads

### 3. Test Registration
1. Navigate to home page (`/`)
2. Click "Register Yourself as Local"
3. Fill registration form
4. Submit
5. Verify local record created in database

### 4. Test Verification
1. Login as police user
2. Navigate to Police Dashboard (`/police`)
3. Click "Locals Verification" tab
4. View unverified locals
5. Click "Approve" or "Reject"
6. Verify changes reflected in database

## Integration Points

### Existing Features Used
- Supabase client configuration (`src/lib/supabase.js`)
- Storage bucket: `tourist-assets` (same as tourist photos)
- Authentication flow (similar to tourist registration)
- Police dashboard tab structure (similar to "Verify" tab)

### Future Integration Points
- Verified locals can receive SOS alerts (to be implemented)
- Verified locals can be displayed on public dashboard (to be implemented)
- Verified locals can assist tourists in their area (to be implemented)

## Notes

1. **Role Handling**: Local volunteers are assigned role 'local' in Supabase Auth user_metadata
2. **File Upload**: ID proof is stored in `tourist-assets` bucket under `locals/id-proofs/` path
3. **Verification**: Only police users can verify locals (enforced by frontend, not RLS)
4. **Rejection**: Rejecting a local deletes their record (consider soft delete if needed)
5. **Verified By**: Stores the tourist ID of the police user who verified (requires police user to have a tourist record)

## Testing Checklist

- [ ] Database schema created successfully
- [ ] Local registration form works
- [ ] File upload works (ID proof)
- [ ] Auth account created with role 'local'
- [ ] Local record inserted in database
- [ ] Police dashboard shows "Locals Verification" tab
- [ ] Unverified locals list displays correctly
- [ ] Approve functionality works
- [ ] Reject functionality works
- [ ] Verified locals removed from unverified list
- [ ] RLS policies allow appropriate access
