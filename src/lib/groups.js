// Group Management Functions using Supabase Client SDK
import { supabase, supabaseGroupsAuth } from './supabase'

// Helper: Generate random password
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Helper: Get current tourist ID from session email
async function getCurrentTouristId() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  
  const { data, error } = await supabase
    .from('tourists')
    .select('id')
    .eq('email', session.user.email)
    .single()
  
  if (error || !data) {
    throw new Error('Tourist record not found. Please complete registration first.')
  }
  return data.id
}

// Create a new group
export async function createGroup(groupName) {
  try {
    const headTouristId = await getCurrentTouristId()
    
    // Check if user already has a group
    const { data: existingGroup, error: checkError } = await supabase
      .from('groups')
      .select('id')
      .eq('head_tourist_id', headTouristId)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    if (existingGroup) {
      throw new Error('You already have a group')
    }
    
    const { data, error } = await supabase
      .from('groups')
      .insert([{
        group_name: groupName.trim(),
        head_tourist_id: headTouristId
      }])
      .select()
      .single()
    
    if (error) {
      if (error.message.includes('row-level security') || error.code === '42501') {
        throw new Error('RLS Policy Error: Cannot create group. Please run fix-rls-policies-complete.sql in Supabase SQL Editor.')
      }
      throw error
    }
    
    return { success: true, group: data }
  } catch (error) {
    throw new Error(error.message || 'Failed to create group')
  }
}

// Get group and members for current user
export async function getMyGroup() {
  try {
    const touristId = await getCurrentTouristId()
    
    // Get group where user is head
    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('head_tourist_id', touristId)
      .single()
    
    let group = groupData
    let isHead = true
    
    // If no group as head, check if user is a member
    if (groupError && groupError.code === 'PGRST116') {
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('tourist_id', touristId)
        .single()
      
      if (memberError && memberError.code === 'PGRST116') {
        return { success: true, group: null, members: [], isHead: false }
      }
      
      if (memberError) throw memberError
      
      const { data: groupAsMember, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', memberData.group_id)
        .single()
      
      if (groupErr) throw groupErr
      
      group = groupAsMember
      isHead = false
    } else if (groupError) {
      throw groupError
    }
    
    if (!group) {
      return { success: true, group: null, members: [], isHead: false }
    }
    
    // Get members with tourist details
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        id,
        tourist_id,
        added_by,
        created_at,
        tourists:tourist_id (
          id,
          fullname,
          email,
          phoneno
        )
      `)
      .eq('group_id', group.id)
    
    if (membersError) throw membersError
    
    return {
      success: true,
      group,
      members: members || [],
      isHead
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to get group')
  }
}

// Add member to group
// Flow: 1. Create Supabase Auth account → 2. Create tourist record (verified=true) → 3. Add to group
// Copies head tourist's data (emergencycontacts, travelitinerary, etc.) to new member
export async function addMemberToGroup(memberData) {
  try {
    // Verify head tourist is authenticated and has completed registration
    const headTouristId = await getCurrentTouristId()
    
    // Get head tourist's full data to copy to new member
    const { data: headTourist, error: headError } = await supabase
      .from('tourists')
      .select('*')
      .eq('id', headTouristId)
      .single()
    
    if (headError || !headTourist) {
      throw new Error('Head tourist data not found')
    }
    
    // Verify user is head of a group
    // Use maybeSingle() to avoid errors if no group exists
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('head_tourist_id', headTouristId)
      .maybeSingle()
    
    if (groupError) {
      console.error('Group fetch error:', groupError)
      throw new Error(`Failed to verify group: ${groupError.message}`)
    }
    
    if (!group) {
      throw new Error('You must be the head of a group to add members. Please create a group first.')
    }
    
    // Check if tourist already exists (by email)
    const { data: existingTourist } = await supabase
      .from('tourists')
      .select('id, verified')
      .eq('email', memberData.email)
      .single()
    
    let touristId
    let isNewUser = false
    let generatedPassword = null
    
    if (existingTourist) {
      touristId = existingTourist.id
      
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('tourist_id', touristId)
        .single()
      
      if (existingMember) {
        throw new Error('Member already exists in group')
      }
      
      // If existing tourist is not verified, auto-verify them as group member
      if (!existingTourist.verified) {
        await supabase
          .from('tourists')
          .update({ verified: true })
          .eq('id', touristId)
      }
    } else {
      // STEP 1: Create Supabase Auth account first
      // Password format requested: firstName + "123"
      const baseName = (memberData.name || 'member').trim().split(/\s+/)[0].toLowerCase()
      generatedPassword = `${baseName}123`
      
      // IMPORTANT: use secondary client so auth session of main app (head tourist)
      // is NOT affected when we create the member account.
      const { data: authData, error: authError } = await supabaseGroupsAuth.auth.signUp({
        email: memberData.email,
        password: generatedPassword,
        options: {
          data: {
            role: 'tourist',
            is_group_member: true
          },
          emailRedirectTo: undefined // No email confirmation required
        }
      })
      
      if (authError) {
        throw new Error(`Failed to create account: ${authError.message}`)
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user account')
      }
      
      const authUserId = authData.user.id
      
      // STEP 2: Create tourist record with verified=true
      // Copy all data from head tourist, override only: name, email, phone
      const touristPayload = {
        fullname: memberData.name,
        email: memberData.email,
        phoneno: memberData.phoneNumber,
        verified: true,
        nationality: headTourist.nationality || '',
        documenttype: headTourist.documenttype || '',
        documentno: '',
        registrationpoint: headTourist.registrationpoint || 'Group Member Registration',
        checkindate: headTourist.checkindate || new Date().toISOString().split('T')[0],
        checkoutdate: headTourist.checkoutdate || new Date().toISOString().split('T')[0],
        emergencycontacts: headTourist.emergencycontacts || [],
        travelitinerary: headTourist.travelitinerary || [],
        photo: headTourist.photo || null,
        documentphoto: headTourist.documentphoto || null,
        wallet_address: headTourist.wallet_address || '0x0000000000000000000000000000000000000000',
      }
      // Use RPC to set user_id (bypasses RLS) - run supabase-migration-tourists-user-id.sql first
      const { data: rpcRows, error: rpcErr } = await supabase.rpc('create_tourist_with_user_id', {
        p_user_id: authUserId,
        p_fullname: touristPayload.fullname,
        p_email: touristPayload.email,
        p_phoneno: touristPayload.phoneno,
        p_verified: touristPayload.verified,
        p_nationality: touristPayload.nationality,
        p_documenttype: touristPayload.documenttype,
        p_documentno: touristPayload.documentno,
        p_registrationpoint: touristPayload.registrationpoint,
        p_checkindate: touristPayload.checkindate,
        p_checkoutdate: touristPayload.checkoutdate,
        p_emergencycontacts: touristPayload.emergencycontacts,
        p_travelitinerary: touristPayload.travelitinerary,
        p_photo: touristPayload.photo,
        p_documentphoto: touristPayload.documentphoto,
        p_wallet_address: touristPayload.wallet_address,
      })

      if (!rpcErr && rpcRows && rpcRows.length > 0) {
        touristId = rpcRows[0].id
        isNewUser = true
      } else {
        // Fallback: direct insert (user_id may not persist without migration)
        const { data: newTourist, error: touristError } = await supabase
          .from('tourists')
          .insert([{ ...touristPayload, user_id: authUserId }])
          .select()
          .single()
        if (touristError) {
          const retry = await supabase
            .from('tourists')
            .insert([{ ...touristPayload, auth_user_id: authUserId }])
            .select()
            .single()
          if (retry.error) throw new Error(`Failed to create tourist: ${retry.error.message}. Run supabase-migration-tourists-user-id.sql`)
          touristId = retry.data.id
        } else {
          touristId = newTourist.id
        }
        isNewUser = true
      }
    }
    
    // STEP 3: Add to group
    // Ensure all required fields are present for RLS policy check
    console.log('Adding member to group:', {
      group_id: group.id,
      tourist_id: touristId,
      added_by: headTouristId
    })
    
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .insert([{
        group_id: group.id,
        tourist_id: touristId,
        added_by: headTouristId
      }])
      .select()
      .single()
    
    if (memberError) {
      console.error('Member insert error:', memberError)
      if (memberError.message.includes('row-level security') || memberError.code === '42501') {
        throw new Error('RLS Error: Run FINAL_CLEAN_FIX.sql in Supabase SQL Editor, then logout/login. Error: ' + memberError.message)
      } else if (memberError.code === '23505') {
        throw new Error('Member already exists in this group')
      } else if (memberError.code === '23503') {
        throw new Error('Invalid group or tourist ID')
      }
      throw new Error(`Failed to add member: ${memberError.message} (Code: ${memberError.code})`)
    }

    return {
      success: true,
      member,
      isNewUser,
      password: isNewUser ? generatedPassword : undefined
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to add member')
  }
}

// Remove member from group
export async function removeMemberFromGroup(memberId) {
  try {
    const headTouristId = await getCurrentTouristId()
    
    // Verify user is head of the group
    const { data: member, error: memberError } = await supabase
      .from('group_members')
      .select(`
        id,
        group_id,
        groups!inner(head_tourist_id)
      `)
      .eq('id', memberId)
      .single()
    
    if (memberError) {
      throw new Error('Member not found')
    }
    
    if (member.groups.head_tourist_id !== headTouristId) {
      throw new Error('Only group head can remove members')
    }
    
    // Remove member
    const { error: deleteError } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)
    
    if (deleteError) throw deleteError
    
    return { success: true }
  } catch (error) {
    throw new Error(error.message || 'Failed to remove member')
  }
}
