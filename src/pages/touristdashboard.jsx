import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './navbar'
import { supabase } from '../lib/supabase'
import { createGroup, getMyGroup, addMemberToGroup, removeMemberFromGroup } from '../lib/groups'

export default function TouristDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [isHead, setIsHead] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Check authentication and load user data
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/signin')
        return
      }
      setUser(session.user)
      
      // Check if tourist record exists before loading group
      try {
        const { data: tourist, error } = await supabase
          .from('tourists')
          .select('id')
          .eq('email', session.user.email)
          .single()
        
        if (error || !tourist) {
          setMessage('⚠️ Please complete your tourist registration first. Redirecting...')
          setTimeout(() => navigate('/register'), 2000)
          return
        }
        
        // Tourist record exists, load group
        loadGroup()
      } catch (err) {
        setMessage(`Error: ${err.message}`)
      }
    }
    loadUser()
  }, [navigate])

  // Load group data
  async function loadGroup() {
    try {
      setLoading(true)
      setMessage('') // Clear previous messages
      const data = await getMyGroup()
      setGroup(data.group)
      setMembers(data.members || [])
      setIsHead(data.isHead)
      setShowCreateGroup(!data.group)
    } catch (error) {
      console.error('Failed to load group:', error)
      // Provide helpful error messages
      if (error.message.includes('Tourist record not found')) {
        setMessage('⚠️ Please complete your tourist registration first. <a href="/register" style="text-decoration: underline; color: #2563eb;">Go to Registration</a>')
      } else if (error.message.includes('row-level security') || error.message.includes('RLS Policy')) {
        setMessage('⚠️ RLS Policy Error: Please run fix-rls-policies-complete.sql in Supabase SQL Editor to fix this issue.')
      } else {
        setMessage(`Error: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Create group
  async function handleCreateGroup(e) {
    e.preventDefault()
    if (!groupName.trim()) {
      setMessage('Please enter a group name')
      return
    }
    
    setSubmitting(true)
    setMessage('')
    
    try {
      const result = await createGroup(groupName.trim())
      setGroup(result.group)
      setIsHead(true)
      setShowCreateGroup(false)
      setGroupName('')
      setMessage('Group created successfully!')
      await loadGroup()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Add member
  async function handleAddMember(e) {
    e.preventDefault()
    if (!memberForm.name || !memberForm.email || !memberForm.phoneNumber) {
      setMessage('Please fill all fields')
      return
    }
    
    setSubmitting(true)
    setMessage('')
    
    try {
      const result = await addMemberToGroup(memberForm)
      setMessage(
        result.isNewUser
          ? `✅ Member added and auto-verified! Account created. Password: ${result.password} (Share securely - they can login immediately)`
          : '✅ Member added successfully! (Auto-verified - no police verification needed)'
      )
      setMemberForm({ name: '', email: '', phoneNumber: '' })
      setShowAddMember(false)
      await loadGroup()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Remove member
  async function handleRemoveMember(memberId) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }
    
    try {
      await removeMemberFromGroup(memberId)
      setMessage('Member removed successfully')
      await loadGroup()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <main>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-sky-50 via-white to-rose-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl -z-10" />

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="pt-24" />

          <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">
              Tourist Dashboard
            </h2>
            {user && (
              <p className="text-sm text-gray-600">Welcome, {user.email}</p>
            )}
          </div>

          {/* Family / Travel Group Section */}
          <div className="rounded-2xl bg-white/90 p-6 ring-1 ring-black/10 shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Family / Travel Group
              </h3>
              {isHead && group && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-white shadow hover:opacity-90"
                >
                  + Add Member
                </button>
              )}
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('Error') || message.includes('⚠️')
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`} dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br/>') }}>
              </div>
            )}

            {/* Create Group Form */}
            {showCreateGroup && !group && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Create a Group</h4>
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Group Name (e.g., 'Smith Family Trip')"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white shadow hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Group'}
                  </button>
                </form>
              </div>
            )}

            {/* Group Info */}
            {group && (
              <div className="mb-6">
                <div className="p-4 bg-sky-50 rounded-lg mb-4">
                  <div className="text-sm text-gray-600 mb-1">Group ID</div>
                  <div className="font-mono font-semibold text-lg">{group.id}</div>
                  <div className="text-sm text-gray-600 mt-2">Group Name</div>
                  <div className="font-semibold">{group.group_name}</div>
                  {isHead ? (
                    <div className="mt-2 text-xs text-sky-700 font-semibold">
                      👑 You are the Group Head
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-600">
                      👤 You are a Group Member
                    </div>
                  )}
                </div>

                {/* Members List */}
                <div>
                  <h4 className="font-semibold mb-3">Group Members</h4>
                  {members.length === 0 ? (
                    <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                      No members yet. Add members to get started.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Name</th>
                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Email</th>
                            <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Phone</th>
                            {isHead && (
                              <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => (
                            <tr key={member.id} className="border-b border-gray-100">
                              <td className="py-2 px-3 text-sm">
                                {member.tourists?.fullname || 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-600">
                                {member.tourists?.email || 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-600">
                                {member.tourists?.phoneno || 'N/A'}
                              </td>
                              {isHead && (
                                <td className="py-2 px-3">
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add Member Modal */}
            {showAddMember && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Add Group Member</h4>
                    <button
                      onClick={() => {
                        setShowAddMember(false)
                        setMemberForm({ name: '', email: '', phoneNumber: '' })
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={memberForm.name}
                        onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                        className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        placeholder="email@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={memberForm.phoneNumber}
                        onChange={(e) => setMemberForm({ ...memberForm, phoneNumber: e.target.value })}
                        className="w-full rounded-lg bg-white px-3 py-2 text-gray-900 ring-1 ring-black/10 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        placeholder="+91 xxxxx xxxxx"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-white shadow hover:opacity-90 disabled:opacity-50"
                      >
                        {submitting ? 'Adding...' : 'Add Member'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMember(false)
                          setMemberForm({ name: '', email: '', phoneNumber: '' })
                        }}
                        className="px-4 py-2 text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="my-10" />
        </div>
      </section>
    </main>
  )
}
