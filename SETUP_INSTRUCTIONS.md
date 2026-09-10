# Family / Group Tourist Management - Setup Instructions

## Architecture
This is a **full frontend ReactJS application** using Supabase Client SDK. There is NO backend server required.

## Database Setup

1. **Run the SQL schema** in Supabase SQL Editor:
   - Open `database-schema.sql`
   - Copy and paste the entire content into Supabase SQL Editor
   - Execute the script
   - This creates:
     - `groups` table
     - `group_members` table
     - Indexes for performance
     - Row Level Security (RLS) policies

2. **Verify tables were created**:
   - Go to Supabase Dashboard > Table Editor
   - You should see `groups` and `group_members` tables

## Frontend Setup

No additional setup required! The feature uses existing Supabase configuration.

1. **Start the React app**:
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard**:
   - Sign up → Sign in → Complete registration → Go to `/dashboard`

## Feature Flow

1. **Create Group**:
   - Head tourist logs in and goes to Dashboard
   - Clicks "Create Group"
   - Enters group name
   - Group is created with unique ID

2. **Add Members**:
   - Head tourist clicks "+ Add Member"
   - Fills form: Name, Email, Phone Number
   - On submit:
     - If email doesn't exist: Creates Supabase Auth account + tourist record
     - If email exists: Adds existing tourist to group
     - Auto-generated password shown for new users

3. **View Members**:
   - All group members displayed in table
   - Shows: Name, Email, Phone

4. **Remove Members**:
   - Only head tourist can remove members
   - Click "Remove" next to member

## Supabase Queries Used

### Create Group
```javascript
supabase.from('groups').insert([{
  group_name: name,
  head_tourist_id: touristId
}])
```

### Get Group
```javascript
// As head
supabase.from('groups').select('*').eq('head_tourist_id', touristId).single()

// As member
supabase.from('group_members')
  .select('group_id')
  .eq('tourist_id', touristId)
  .single()
```

### Get Members
```javascript
supabase.from('group_members')
  .select(`
    id,
    tourist_id,
    added_by,
    created_at,
    tourists:tourist_id (id, fullname, email, phoneno)
  `)
  .eq('group_id', groupId)
```

### Create Member Account
```javascript
// Create auth user
supabase.auth.signUp({
  email: email,
  password: generatedPassword
})

// Create tourist record
supabase.from('tourists').insert([{
  fullname: name,
  email: email,
  phoneno: phone
}])

// Add to group
supabase.from('group_members').insert([{
  group_id: groupId,
  tourist_id: touristId,
  added_by: headTouristId
}])
```

### Remove Member
```javascript
supabase.from('group_members')
  .delete()
  .eq('id', memberId)
```

## Security

- **Row Level Security (RLS)** enabled on all tables
- Only authenticated users can access
- Only group head can create/update/delete groups
- Only group head can add/remove members
- Members can view but not modify

## Files Structure

```
src/
├── lib/
│   ├── supabase.js      # Existing Supabase client
│   ├── groups.js        # Group management functions
│   └── db.js            # Existing database functions
└── pages/
    └── touristdashboard.jsx  # Dashboard UI
```

## Troubleshooting

1. **"Tourist record not found"**:
   - User must complete registration at `/register` first

2. **"You must be the head of a group"**:
   - Create a group first before adding members

3. **RLS Policy errors**:
   - Ensure user is authenticated
   - Check that RLS policies were created correctly
   - Verify email in auth matches email in tourists table

4. **Cannot create group**:
   - Check if user already has a group (one group per head tourist)

## Notes

- Uses Supabase Client SDK only (no backend required)
- Auto-generates passwords for new members
- Passwords shown once (share securely)
- All operations respect RLS policies
- No .env files needed (uses existing Supabase config)
