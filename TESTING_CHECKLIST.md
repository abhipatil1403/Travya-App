# Complete Testing Checklist - All Features

## 🔧 Pre-Testing Setup

### 1. Database Setup (MUST DO FIRST)
- [ ] Run `database-schema.sql` in Supabase SQL Editor
- [ ] Run `fix-rls-policies-complete.sql` in Supabase SQL Editor
- [ ] Verify no errors in SQL execution
- [ ] Check tables exist: `groups`, `group_members`, `tourists`

### 2. Verify RLS Policies
Run this query in Supabase SQL Editor to verify policies:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;
```

Expected policies:
- **groups**: Heads can view, Members can view, Users can create, Head can update, Head can delete
- **group_members**: Users can view, Head can add, Head can remove

## ✅ Feature Testing

### Test 1: User Authentication Flow
- [ ] **Sign Up** (`/signup`)
  - Enter email and password
  - Click "Create account"
  - Should redirect to `/register`
  - No errors

- [ ] **Sign In** (`/signin`)
  - Enter existing credentials
  - Click "Sign in"
  - Should redirect to `/register` or `/dashboard`
  - No errors

### Test 2: Tourist Registration
- [ ] **Complete Registration** (`/register`)
  - Fill all required fields:
    - Full Name
    - Phone Number
    - Nationality
    - Document Type & Number
    - Registration Point
    - Check-in/Check-out dates
    - Emergency Contacts (at least one)
    - Travel Itinerary (at least one)
  - Upload photo (optional)
  - Upload document photo (optional)
  - Submit form
  - Should create tourist record successfully
  - Should show success message

### Test 3: Dashboard Access
- [ ] **Access Dashboard** (`/dashboard`)
  - After registration, navigate to `/dashboard`
  - Should load without errors
  - Should show "Family / Travel Group" section
  - Should show "Create Group" option if no group exists

### Test 4: Group Creation
- [ ] **Create Group**
  - Enter group name (e.g., "Smith Family Trip")
  - Click "Create Group"
  - Should create group successfully
  - Should display Group ID
  - Should show "You are the Group Head" badge
  - Should show "+ Add Member" button

### Test 5: Add New Member (New User)
- [ ] **Add New Member**
  - Click "+ Add Member"
  - Fill form:
    - Name: "John Doe"
    - Email: "john@example.com" (new email)
    - Phone: "+91 9876543210"
  - Click "Add Member"
  - Should:
    - Create Supabase Auth account
    - Create tourist record (with verified=true)
    - Copy head tourist's data (emergencycontacts, travelitinerary, etc.)
    - Add to group
    - Display password (share securely)
  - Member should appear in members list
  - No errors

### Test 6: Add Existing User as Member
- [ ] **Add Existing User**
  - Use email of existing tourist
  - Fill name and phone
  - Click "Add Member"
  - Should:
    - Add existing tourist to group
    - Auto-verify if not verified
    - Add to group_members table
  - Member should appear in list
  - No errors

### Test 7: View Members
- [ ] **Members List**
  - Should display all group members in table
  - Shows: Name, Email, Phone
  - Head can see all members
  - Members can see other members (if they login)

### Test 8: Remove Member
- [ ] **Remove Member** (Head only)
  - Click "Remove" next to a member
  - Confirm removal
  - Should remove from group
  - Member should disappear from list
  - No errors

### Test 9: Member Login & View
- [ ] **Member Login**
  - Logout as head
  - Login as member (using provided credentials)
  - Navigate to `/dashboard`
  - Should:
    - Show group information
    - Show "You are a Group Member" (not head)
    - Show members list (read-only)
    - NOT show "Add Member" button
    - NOT show "Remove" buttons

### Test 10: Error Handling
- [ ] **Test Error Scenarios**
  - Try to add duplicate member → Should show "Member already exists"
  - Try to create second group → Should show "You already have a group"
  - Try to access dashboard without registration → Should redirect to registration
  - Try to add member without group → Should show "You must be the head of a group"

## 🐛 Common Issues & Solutions

### Issue: "new row violates row-level security policy"
**Solution**: Run `fix-rls-policies-complete.sql` in Supabase SQL Editor

### Issue: "Tourist record not found"
**Solution**: Complete registration at `/register` first

### Issue: "null value in column 'emergencycontacts'"
**Solution**: Fixed in code - now copies from head tourist automatically

### Issue: "Cannot add member"
**Solution**: 
1. Verify RLS policies are set up correctly
2. Ensure you're the head of a group
3. Check that group exists

### Issue: Dashboard shows errors on load
**Solution**:
1. Complete registration first
2. Check browser console for specific errors
3. Verify RLS policies are correct

## 📊 Expected Results

### After Complete Setup:
✅ All authentication flows work  
✅ Registration creates tourist record  
✅ Dashboard loads without errors  
✅ Groups can be created  
✅ Members can be added (new and existing)  
✅ Members are auto-verified  
✅ Members list displays correctly  
✅ Members can be removed  
✅ RLS policies enforce security  
✅ No console errors  

## 🔍 Debugging Tips

1. **Check Browser Console**: Look for specific error messages
2. **Check Supabase Logs**: Dashboard → Logs → API Logs
3. **Verify RLS Policies**: Run policy verification query
4. **Check Tourist Record**: Verify record exists in `tourists` table
5. **Check Group Record**: Verify group exists in `groups` table
6. **Check Group Members**: Verify members in `group_members` table

## 📝 Test Data Examples

### Head Tourist:
- Email: `head@example.com`
- Name: `John Head`
- Phone: `+91 9876543210`

### Member 1 (New):
- Email: `member1@example.com`
- Name: `Jane Member`
- Phone: `+91 9876543211`

### Member 2 (Existing):
- Email: `existing@example.com`
- Name: `Existing User`
- Phone: `+91 9876543212`

---

**Status**: Ready for Testing
**Last Updated**: After Complete Fix Implementation
