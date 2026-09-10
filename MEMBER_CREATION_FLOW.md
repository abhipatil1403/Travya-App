# Group Member Creation Flow

## Overview
When a head tourist adds a member to their group, the system automatically:
1. Creates a Supabase Auth account
2. Creates a tourist record (linked via email)
3. Sets `verified = true` automatically
4. Adds member to the group

## Flow Details

### Step 1: Create Supabase Auth Account
```javascript
supabase.auth.signUp({
  email: memberData.email,
  password: generatedPassword,
  options: {
    data: {
      role: 'tourist',
      is_group_member: true
    }
  }
})
```
- Creates authentication account
- Auto-generates secure password (12 chars)
- No email confirmation required

### Step 2: Create Tourist Record
```javascript
supabase.from('tourists').insert([{
  fullname: memberData.name,
  email: memberData.email,        // Links to auth account
  phoneno: memberData.phoneNumber,
  verified: true,                   // ✅ AUTO-VERIFIED
  registrationpoint: 'Group Member Registration',
  // ... other required fields
}])
```
- Creates tourist record in database
- **`verified = true`** automatically
- Links to auth account via email
- No police verification needed

### Step 3: Add to Group
```javascript
supabase.from('group_members').insert([{
  group_id: group.id,
  tourist_id: touristId,
  added_by: headTouristId
}])
```
- Links tourist to group
- Records who added them

## Key Features

✅ **Auto-Verification**: Group members are automatically verified (`verified = true`)
- No police verification required
- Can use all features immediately
- Appears as verified in police dashboard

✅ **Account Creation**: Full Supabase Auth account created
- Can login immediately
- Password auto-generated and shared once
- Email-based authentication

✅ **Existing Users**: If email already exists
- Adds existing tourist to group
- Auto-verifies if not already verified
- No duplicate accounts created

## Error Handling

- **"Tourist record not found"**: Head tourist must complete registration first
- **"Member already exists"**: Email already in this group
- **"Failed to create account"**: Email might already be in use or invalid

## Security

- Passwords are auto-generated (12 chars, mixed case, numbers, symbols)
- Passwords shown only once (share securely)
- Group members inherit head tourist's verification status
- RLS policies ensure only head can add members

## Notes

- Group members don't need to complete full registration form
- They can login immediately with provided credentials
- They appear as verified tourists in the system
- Head tourist manages all group members
