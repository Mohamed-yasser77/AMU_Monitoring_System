import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function VetDashboard() {
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInventory, setShowInventory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [pendingTreatments, setPendingTreatments] = useState([])
  const [treatmentHistory, setTreatmentHistory] = useState([])
  const [profileData, setProfileData] = useState({
    state: '',
    district: '',
    address: '',
    phone_number: ''
  })
  const [ownerSearch, setOwnerSearch] = useState('')
  const [owners, setOwners] = useState([])
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [ownerDetails, setOwnerDetails] = useState(null)
  
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
    "Uttarakhand", "West Bengal"
  ]

  const tnDistricts = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", 
    "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", 
    "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", 
    "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", 
    "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", 
    "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ]

  useEffect(() => {
    if (!user || user.role !== 'vet') {
      navigate('/login')
      return
    }

    if (user.profile_completed) {
      setProfileCompleted(true)
    }

    const fetchDrugs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/reference/drugs/')
        if (response.ok) {
          const data = await response.json()
          setDrugs(data)
        }
      } catch (error) {
        console.error('Error fetching drugs:', error)
      }
    }

    const fetchPendingTreatments = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/treatments/?vet_email=${user.email}`)
        if (response.ok) {
          const data = await response.json()
          setPendingTreatments(data.pending)
          setTreatmentHistory(data.history)
        }
      } catch (error) {
        console.error('Error fetching treatments:', error)
      }
    }

    const fetchOwners = async () => {
      try {
        const params = new URLSearchParams({ email: user.email })
        const response = await fetch(`http://localhost:8000/api/owners/?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setOwners(data)
        }
      } catch (error) {
        console.error('Error fetching owners:', error)
      }
    }

    const fetchData = async () => {
      await Promise.all([fetchDrugs(), fetchPendingTreatments(), fetchOwners()])
      setLoading(false)
    }

    fetchData()
  }, [navigate, user])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
        const response = await fetch('http://localhost:8000/api/update-profile/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                ...profileData
            })
        })
        
        if (response.ok) {
            const data = await response.json()
            // Update local storage
            const updatedUser = {
                ...user,
                profile_completed: true,
                profile: data.user
            }
            localStorage.setItem('user', JSON.stringify(updatedUser))
            setProfileCompleted(true)
            setShowProfileForm(false)
            alert('Profile updated successfully!')
        } else {
            alert('Failed to update profile.')
        }
    } catch (error) {
        console.error('Error updating profile:', error)
        alert('An error occurred.')
    }
  }

  const handleTreatmentAction = async (treatmentId, action) => {
      try {
          const response = await fetch(`http://localhost:8000/api/treatments/${treatmentId}/action/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action })
          })

          if (response.ok) {
              // Remove from list
              setPendingTreatments(prev => prev.filter(t => t.id !== treatmentId))
              alert(`Treatment ${action}ed successfully`)
          } else {
              alert('Failed to update treatment')
          }
      } catch (error) {
          console.error('Error updating treatment:', error)
          alert('Error updating treatment')
      }
  }

  const handleOwnerSearchChange = async (e) => {
    const value = e.target.value
    setOwnerSearch(value)
    try {
      const params = new URLSearchParams({ email: user.email })
      if (value) params.append('q', value)
      const response = await fetch(`http://localhost:8000/api/owners/?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOwners(data)
      }
    } catch (error) {
      console.error('Error searching owners:', error)
    }
  }

  const handleOwnerSelect = async (owner) => {
    setSelectedOwner(owner)
    try {
      const params = new URLSearchParams({ email: user.email })
      const response = await fetch(`http://localhost:8000/api/owners/${owner.id}/?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOwnerDetails(data)
      }
    } catch (error) {
      console.error('Error fetching owner details:', error)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.family.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drug.category && drug.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Veterinarian Dashboard</h1>
          <div className="flex items-center gap-4">
             {user && <span className="text-sm font-semibold text-gray-900">Welcome, {user.name}</span>}
             <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-500">Log out</button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Pending Treatments Section */}
            <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Treatment Requests</h2>
                {pendingTreatments.length > 0 ? (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Farm</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Drug</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Issue</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {pendingTreatments.map((treatment) => (
                                    <tr key={treatment.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {treatment.farm__name} ({treatment.farm__farm_number})
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {treatment.farm__village ? `${treatment.farm__village}, ` : ''}{treatment.farm__district}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {treatment.antibiotic_name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                                            {treatment.reason.replace('_', ' ')} / {treatment.treated_for}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{treatment.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <button
                                                onClick={() => handleTreatmentAction(treatment.id, 'approve')}
                                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-600 hover:bg-blue-600 hover:text-white mr-2 transition-colors duration-200"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleTreatmentAction(treatment.id, 'reject')}
                                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-600 hover:bg-red-600 hover:text-white transition-colors duration-200"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No pending treatment requests.</p>
                )}
            </div>

            {/* Treatment History Section */}
            <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Treatment History</h2>
                {treatmentHistory.length > 0 ? (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Farm</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Drug</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Issue</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {treatmentHistory.map((treatment) => (
                                    <tr key={treatment.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {treatment.farm__name} ({treatment.farm__farm_number})
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {treatment.farm__village ? `${treatment.farm__village}, ` : ''}{treatment.farm__district}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {treatment.antibiotic_name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                                            {treatment.reason.replace('_', ' ')} / {treatment.treated_for}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{treatment.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                Approved
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No recent treatment history.</p>
                )}
            </div>

            {!showInventory ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                <div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Dashboard Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your veterinary tasks and resources.</p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    {!profileCompleted && (
                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
                      >
                        Complete Profile
                      </button>
                    )}
                    <button
                      onClick={() => setShowInventory(true)}
                      className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                    >
                      View Drug Inventory
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">Owner Problems</h3>
                  <p className="mt-1 text-sm text-gray-500">Search owners and review reported flock or animal problems.</p>
                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={ownerSearch}
                      onChange={handleOwnerSearchChange}
                      placeholder="Search owners by name, phone, or location..."
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                      {owners.length === 0 ? (
                        <p className="p-3 text-sm text-gray-500">No owners found.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {owners.map((owner) => (
                            <li
                              key={owner.id}
                              className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedOwner?.id === owner.id ? 'bg-gray-50' : ''}`}
                              onClick={() => handleOwnerSelect(owner)}
                            >
                              <p className="text-sm font-medium text-gray-900">{owner.name}</p>
                              <p className="text-xs text-gray-500">
                                {owner.phone_number || 'No phone'} • {owner.village ? `${owner.village}, ` : ''}{owner.district || ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto p-3">
                      {!ownerDetails ? (
                        <p className="text-sm text-gray-500">Select an owner to view problems.</p>
                      ) : ownerDetails.problems.length === 0 ? (
                        <p className="text-sm text-gray-500">No problems logged for this owner.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {ownerDetails.problems.map((problem) => (
                            <li key={problem.id} className="py-2">
                              <p className="text-sm text-gray-900">{problem.description}</p>
                              <p className="text-xs text-gray-500">
                                Severity: {problem.severity} • Date: {problem.date_reported}
                                {problem.flock_id && ' • Flock'}
                                {problem.animal_id && ' • Animal'}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <>
                  <div className="sm:flex sm:items-center justify-between">
                    <div className="sm:flex-auto">
                      <h2 className="text-base font-semibold leading-6 text-gray-900">Drug Inventory</h2>
                      <p className="mt-2 text-sm text-gray-700">
                        A list of all available drugs including their family, category, comments, and MRL limits.
                      </p>
                    </div>
                    <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search drugs..."
                                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowInventory(false)}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                  </div>
                  <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                  Drug Name
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Family
                                </th>
                                 <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Category
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Comments
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  MRL Limits (mg/kg)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {filteredDrugs.map((drug) => (
                                <tr key={drug.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {drug.name}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {drug.family}
                                  </td>
                                   <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {drug.category || '-'}
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={drug.comments}>
                                    {drug.comments || '-'}
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-500">
                                    {drug.mrls && drug.mrls.length > 0 ? (
                                        <details className="cursor-pointer">
                                            <summary className="text-primary-600 hover:text-primary-500">
                                                View {drug.mrls.length} Limits
                                            </summary>
                                            <div className="mt-2 text-xs">
                                                {drug.mrls.map((mrl, idx) => (
                                                    <div key={idx} className="mb-1">
                                                        <span className="font-semibold">{mrl.species}</span> - {mrl.tissue}: {mrl.limit}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    ) : (
                                        <span className="text-gray-400">None</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {filteredDrugs.length === 0 && (
                                <tr>
                                      <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                                        No drugs found matching &quot;{searchTerm}&quot;
                                    </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
            )}
        </div>
      </main>

      {showProfileForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
                <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                value={profileData.address}
                                onChange={e => setProfileData({...profileData, address: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                value={profileData.phone_number}
                                onChange={e => setProfileData({...profileData, phone_number: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">State</label>
                            <select
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                value={profileData.state}
                                onChange={e => setProfileData({...profileData, state: e.target.value, district: ''})}
                            >
                                <option value="">Select State</option>
                                {states.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">District</label>
                            {profileData.state === "Tamil Nadu" ? (
                                <select
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                    value={profileData.district}
                                    onChange={e => setProfileData({...profileData, district: e.target.value})}
                                >
                                    <option value="">Select District</option>
                                    {tnDistricts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                    value={profileData.district}
                                    onChange={e => setProfileData({...profileData, district: e.target.value})}
                                />
                            )}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowProfileForm(false)}
                            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                            Save Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}

export default VetDashboard
