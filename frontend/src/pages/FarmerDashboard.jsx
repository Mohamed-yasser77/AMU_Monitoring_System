import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function FarmerDashboard() {
  const [farms, setFarms] = useState([])
  const [activeTreatments, setActiveTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!user || user.role !== 'farmer') {
      navigate('/login')
      return
    }

    const fetchFarms = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/farms/?email=${user.email}`)
        if (response.ok) {
          const data = await response.json()
          setFarms(data)
        }
      } catch (error) {
        console.error('Error fetching farms:', error)
      }
    }

    const fetchTreatments = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/treatments/?email=${user.email}`)
            if (response.ok) {
                const data = await response.json()
                setActiveTreatments(data)
            }
        } catch (error) {
            console.error('Error fetching treatments:', error)
        }
    }

    const fetchData = async () => {
        await Promise.all([fetchFarms(), fetchTreatments()])
        setLoading(false)
    }

    fetchData()
  }, [navigate, user?.email, user?.role])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="bg-white min-h-screen">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Farmer Dashboard</h1>
          <div className="flex items-center gap-4">
             <span className="text-sm font-semibold text-gray-900">Welcome, {user?.name}</span>
             <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-500">Log out</button>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {farms.length === 0 ? (
            <div className="text-center mt-10">
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No farms</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new farm.</p>
              <div className="mt-6">
                <Link
                  to="/add-farm"
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <span className="mr-2">+</span> Add Farm
                </Link>
              </div>
            </div>
          ) : (
            <div>
                <div className="flex justify-end mb-4 gap-4">
                    <Link
                      to="/log-treatment"
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Log Treatment
                    </Link>
                    <Link
                      to="/add-farm"
                      className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
                    >
                      <span className="mr-2">+</span> Add Farm
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {farms.map((farm) => (
                    <div key={farm.id} className="relative flex flex-col justify-between rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900">{farm.name}</p>
                        <p className="truncate text-sm text-gray-500">ID: {farm.farm_number}</p>
                        <p className="truncate text-sm text-gray-500">Species: {farm.species_type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/edit-farm/${farm.id}`}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                        <Link
                          to={`/farm-details/${farm.id}`}
                          className="inline-flex items-center rounded-md bg-primary-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        >
                          Display
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

        <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Active Treatments</h2>
            {activeTreatments.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Farm</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Antibiotic</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {activeTreatments.map((treatment) => (
                        <tr key={treatment.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {treatment.farm__name} ({treatment.farm__farm_number})
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{treatment.antibiotic_name}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                                {treatment.reason.replace('_', ' ')} / {treatment.treated_for}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{treatment.date}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-sm text-gray-500">No active treatments found.</p>
            )}
        </div>
        </div>
      </main>
    </div>
  )
}

export default FarmerDashboard
