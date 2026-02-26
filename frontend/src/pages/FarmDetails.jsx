import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const speciesMapping = {
  'AVI': 'Avian (Poultry/Birds)',
  'BOV': 'Bovine (Cattle)',
  'SUI': 'Suine (Pigs/Swine)',
  'CAP': 'Caprine (Goats)',
  'OVI': 'Ovine (Sheep)',
  'EQU': 'Equine (Horses)',
  'LEP': 'Leporine (Rabbits)',
  'PIS': 'Pisces (Fish)',
  'CAM': 'Camelids (Camels)',
  'API': 'Apiculture (Bees)'
}

function FarmDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [farm, setFarm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTreatments, setActiveTreatments] = useState([]) // Placeholder for active treatments

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/farms/${id}/`)
        if (response.ok) {
          const data = await response.json()
          setFarm(data)
        } else {
          alert('Failed to fetch farm details')
          navigate('/operator-dashboard')
        }
      } catch (error) {
        console.error('Error fetching farm:', error)
        alert('Error fetching farm')
      } finally {
        setLoading(false)
      }
    }

    const fetchTreatments = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/treatments/?farm_id=${id}`)
        if (response.ok) {
          const data = await response.json()
          setActiveTreatments(data)
        }
      } catch (error) {
        console.error('Error fetching treatments:', error)
      }
    }

    fetchFarm()
    fetchTreatments()
  }, [id, navigate])

  if (loading) return <div className="p-6">Loading...</div>
  if (!farm) return <div className="p-6">Farm not found</div>

  const formatText = (text) => {
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Farm Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Comprehensive information about {farm.name}.</p>
          </div>
          <button
            onClick={() => navigate('/operator-dashboard')}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Farm Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Farm Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.farm_number}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.district}, {farm.state}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Farm Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 capitalize">{farm.farm_type}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Species</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{speciesMapping[farm.species_type] || farm.species_type}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Animals</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.total_animals}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Average Weight</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.avg_weight} kg</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Avg Feed Consumption</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.avg_feed_consumption} kg/day</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Avg Water Consumption</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{farm.avg_water_consumption} litres/day</dd>
            </div>

          </dl>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Active Treatments</h3>
          {activeTreatments.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {activeTreatments.map((treatment, index) => (
                <li key={index} className="py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{treatment.antibiotic_name}</p>
                      <p className="text-sm text-gray-500">Reason: {formatText(treatment.reason)} | For: {formatText(treatment.treated_for)}</p>
                    </div>
                    <p className="text-sm text-gray-500">{treatment.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No active treatments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FarmDetails
