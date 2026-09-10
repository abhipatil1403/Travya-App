import { supabase } from './supabase'

// Default blockchain ID for all tourists (hackathon prototype – no MetaMask required at registration)
const DEFAULT_WALLET_ADDRESS = '0xfc3c82dc4da66469931c7e6b3baf45714ae10864'

// TOURISTS
/** Fetch tourists with active SOS (emergency_active = true) for Local Dashboard */
export async function listActiveSosTourists() {
  const { data, error } = await supabase
    .from('tourists')
    .select('id, fullname, last_lat, last_lng, emergency_active, phoneno, zones')
    .eq('emergency_active', true)
  if (error) throw new Error(error.message)
  return data || []
}

export async function listTourists() {
  const { data, error } = await supabase
    .from('tourists')
    .select('id, created_at, fullname, email, phoneno, nationality, checkindate, checkoutdate, photo, documentno, documenttype, registrationpoint, verified, emergency_active, wallet_address, blockchain_tx_hash, last_lat, last_lng, zones')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

// STATIC COORDINATES - Get static coordinates for demonstration (Katraj, Pune, Maharashtra)
export async function getLatestTimelineCoords() {
  try {
    // Get all tourists to assign static coordinates
    const { data: tourists, error: touristsError } = await supabase
      .from('tourists')
      .select('id, last_lat, last_lng')
    
    if (touristsError) throw new Error(touristsError.message)
    
    if (!tourists || tourists.length === 0) {
      return {}
    }
    
    // Base coordinates for Katraj, Pune, Maharashtra
    const baseLat = 18.4489  // Katraj latitude
    const baseLng = 73.8648  // Katraj longitude
    
    // Generate static coordinates with small variations for each tourist
    const staticCoords = {}
    tourists.forEach((tourist) => {
      const hasReal = tourist.last_lat != null && tourist.last_lng != null &&
        !Number.isNaN(Number(tourist.last_lat)) && !Number.isNaN(Number(tourist.last_lng))
      const latVariation = (Math.random() - 0.5) * 0.02
      const lngVariation = (Math.random() - 0.5) * 0.02
      staticCoords[tourist.id] = hasReal
        ? { latitude: Number(tourist.last_lat), longitude: Number(tourist.last_lng), created_at: new Date().toISOString() }
        : { latitude: baseLat + latVariation, longitude: baseLng + lngVariation, created_at: new Date().toISOString() }
    })
    
    return staticCoords
  } catch (error) {
    console.error('Error in getLatestTimelineCoords:', error)
    return {}
  }
}


export async function getTouristByPassport(documentNo) {
  const { data, error } = await supabase
    .from('tourists')
    .select('id, created_at, fullname, email, phoneno, nationality, photo, documenttype, documentno, registrationpoint, checkindate, checkoutdate, verified')
    .eq('documentno', documentNo)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('No tourist found for this passport')
  return data
}

export async function verifyTouristById(id) {
  const { error } = await supabase
    .from('tourists')
    .update({ verified: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
  return { id, verified: true }
}

/** Set verified and blockchain_tx_hash after successful on-chain verification (frontend calls). */
export async function setTouristVerifiedAndTxHash(id, txHash) {
  const { data, error } = await supabase
    .from('tourists')
    .update({ verified: true, blockchain_tx_hash: txHash || null })
    .eq('id', id)
    .select('id, verified')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error(
      'Update blocked: RLS policy may not allow police to update tourists. Run supabase-migration-tourists-police-update.sql in Supabase SQL Editor.'
    )
  }
  return { id, verified: true, blockchain_tx_hash: txHash }
}

export async function verifyTouristByPassport(documentNo) {
  const t = await getTouristByPassport(documentNo)
  return await verifyTouristById(t.id)
}

// REPORTS
export async function createReport({ areaName, description, latitude, longitude, reporterName, reporterPhone, radius_km, status_color }, opts = {}) {
  // Client-side insert directly into Supabase (requires appropriate RLS policies)
  const payload = {
    area_name: areaName,
    description,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    reporter_name: reporterName ?? null,
    reporter_phone: reporterPhone ?? null,
    radius_km: typeof radius_km === 'number' ? radius_km : (radius_km ? Number(radius_km) : null),
    status_color: status_color ?? null
  }
  const { data, error } = await supabase
    .from('reports')
    .insert([payload])
    .select()
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return row
}

// Registration with optional storage uploads. wallet_address auto-set for every new tourist.
export async function registerTourist({ form, emergencyContacts, travelItinerary, photoFile, documentPhotoFile, walletAddress }) {
  // Uploads to bucket 'tourist-assets' must be allowed for authenticated users
  let photoUrl = null
  let documentPhotoUrl = null

  if (photoFile) {
    const path = `photos/${Date.now()}_${photoFile.name}`
    const { data: up, error: upErr } = await supabase
      .storage.from('tourist-assets').upload(path, photoFile, { upsert: false })
    if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`)
    const { data: pub } = supabase.storage.from('tourist-assets').getPublicUrl(up.path)
    photoUrl = pub.publicUrl
  }

  if (documentPhotoFile) {
    const path = `documents/${Date.now()}_${documentPhotoFile.name}`
    const { data: up, error: upErr } = await supabase
      .storage.from('tourist-assets').upload(path, documentPhotoFile, { upsert: false })
    if (upErr) throw new Error(`Document photo upload failed: ${upErr.message}`)
    const { data: pub } = supabase.storage.from('tourist-assets').getPublicUrl(up.path)
    documentPhotoUrl = pub.publicUrl
  }

  const safeRow = {
    fullname: form.fullName,
    email: form.email,
    phoneno: form.phoneNo,
    nationality: form.nationality,
    photo: photoUrl,
    documenttype: form.documentType,
    documentno: form.documentNo,
    documentphoto: documentPhotoUrl,
    registrationpoint: form.registrationPoint,
    checkindate: String(form.checkInDate).slice(0, 10),
    checkoutdate: String(form.checkOutDate).slice(0, 10),
    emergencycontacts: emergencyContacts,
    travelitinerary: travelItinerary,
    verified: false,
    wallet_address: walletAddress || DEFAULT_WALLET_ADDRESS,
  }

  const { data, error } = await supabase
    .from('tourists')
    .insert([safeRow])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// LOCALS
export async function listLocals() {
  const { data, error } = await supabase
    .from('locals')
    .select('id, name, email, phone, address, city, id_proof_url, availability, is_verified, verified_by, created_at')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function listUnverifiedLocals() {
  const { data, error } = await supabase
    .from('locals')
    .select('id, name, email, phone, address, city, id_proof_url, availability, is_verified, verified_by, created_at')
    .eq('is_verified', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function registerLocal({ form, idProofFile }) {
  let idProofUrl = null

  if (idProofFile) {
    const path = `locals/id-proofs/${Date.now()}_${idProofFile.name}`
    const { data: up, error: upErr } = await supabase
      .storage.from('tourist-assets').upload(path, idProofFile, { upsert: false })
    if (upErr) throw new Error(`ID proof upload failed: ${upErr.message}`)
    const { data: pub } = supabase.storage.from('tourist-assets').getPublicUrl(up.path)
    idProofUrl = pub.publicUrl
  }

  const safeRow = {
    name: form.fullName,
    email: form.email,
    phone: form.phoneNumber,
    address: form.address,
    city: form.city,
    id_proof_url: idProofUrl,
    availability: form.availability || null,
    is_verified: false,
  }

  const { data, error } = await supabase
    .from('locals')
    .insert([safeRow])
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function verifyLocalById(id, verifiedBy) {
  const { error } = await supabase
    .from('locals')
    .update({ is_verified: true, verified_by: verifiedBy })
    .eq('id', id)
  if (error) throw new Error(error.message)
  return { id, is_verified: true }
}

export async function rejectLocal(id) {
  const { error } = await supabase
    .from('locals')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  return { id, deleted: true }
}

export async function getLocalByEmail(email) {
  const { data, error } = await supabase
    .from('locals')
    .select('id, name, email, is_verified')
    .eq('email', email)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function listVerifiedLocals() {
  const { data, error } = await supabase
    .from('locals')
    .select('id, name, email, phone, address, city, is_verified, verified_by, created_at')
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

// LOCALS_DUPLICATE
const LOCALS_DUP_SELECT = 'id, full_name, email, phone_number, address, city, state, postal_code, id_proof_type, id_proof_number, id_proof_image_url, police_station, emergency_contact_name, emergency_contact_phone, verification_status, verified_by, verified_at, qr_code_url, total_assists, rating, created_at'

export async function createLocalDuplicate({ form, authUserId, idProofFile }) {
  let idProofImageUrl = null
  if (idProofFile) {
    const path = `locals_dup/id-proofs/${Date.now()}_${idProofFile.name}`
    const { data: up, error: upErr } = await supabase.storage.from('tourist-assets').upload(path, idProofFile, { upsert: false })
    if (upErr) throw new Error(`ID proof upload failed: ${upErr.message}`)
    const { data: pub } = supabase.storage.from('tourist-assets').getPublicUrl(up.path)
    idProofImageUrl = pub.publicUrl
  }

  const row = {
    auth_user_id: authUserId || null,
    full_name: form.fullName || '',
    email: form.email || '',
    age: form.age ? Number(form.age) : null,
    gender: form.gender || null,
    phone_number: form.phoneNumber || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    postal_code: form.postalCode || null,
    id_proof_type: form.idProofType || null,
    id_proof_number: form.idProofNumber || null,
    id_proof_image_url: idProofImageUrl,
    police_station: form.policeStation || null,
    emergency_contact_name: form.emergencyContactName || null,
    emergency_contact_phone: form.emergencyContactPhone || null,
    verification_status: false,
    total_assists: 0,
    is_active: true,
  }
  const { data, error } = await supabase.from('locals_duplicate').insert([row]).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function listUnverifiedLocalsDuplicate() {
  const { data, error } = await supabase
    .from('locals_duplicate')
    .select(LOCALS_DUP_SELECT)
    .eq('verification_status', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function listVerifiedLocalsDuplicate() {
  const { data, error } = await supabase
    .from('locals_duplicate')
    .select(LOCALS_DUP_SELECT)
    .eq('verification_status', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function verifyLocalDuplicate(id, policeEmail, qrCodeDataUrl) {
  const { data, error } = await supabase
    .from('locals_duplicate')
    .update({
      verification_status: true,
      verified_at: new Date().toISOString(),
      verified_by: policeEmail || null,
      qr_code_url: qrCodeDataUrl || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function rejectLocalDuplicate(id) {
  const { error } = await supabase.from('locals_duplicate').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { id, deleted: true }
}

export async function getLocalDuplicateByAuthId(authUserId) {
  const { data, error } = await supabase
    .from('locals_duplicate')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function incrementLocalAssist(localId) {
  const { data: row, error: fetchErr } = await supabase
    .from('locals_duplicate')
    .select('total_assists')
    .eq('id', localId)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)
  if (!row) throw new Error('Local not found')
  const next = (row.total_assists ?? 0) + 1
  const { data, error } = await supabase
    .from('locals_duplicate')
    .update({ total_assists: next })
    .eq('id', localId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}




