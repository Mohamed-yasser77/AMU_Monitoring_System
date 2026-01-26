import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function VetDashboard() {
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInventory, setShowInventory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!user || user.role !== 'vet') {
      navigate('/login')
      return
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
      } finally {
        setLoading(false)
      }
    }

    fetchDrugs()
  }, []) // navigate, user?.role

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
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
            {!showInventory ? (
                <div className="text-center mt-10">
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">Dashboard Actions</h3>
                    <p className="mt-1 text-sm text-gray-500">Manage your veterinary tasks and resources.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button
                            onClick={() => setShowInventory(true)}
                            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                            View Drug Inventory
                        </button>
                        {/* Future buttons can go here */}
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
                                        No drugs found matching "{searchTerm}"
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
    </div>
  )
}

export default VetDashboard
