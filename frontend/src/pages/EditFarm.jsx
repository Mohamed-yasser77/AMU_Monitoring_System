import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const speciesOptions = [
  { value: 'avian', label: 'Avian (Poultry/Birds)', code: 'AVI' },
  { value: 'bovine', label: 'Bovine (Cattle)', code: 'BOV' },
  { value: 'suine', label: 'Suine (Pigs/Swine)', code: 'POR' },
  { value: 'caprine', label: 'Caprine (Goats)', code: 'CAP' },
  { value: 'ovine', label: 'Ovine (Sheep)', code: 'OVI' },
]

function EditFarm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const user = JSON.parse(localStorage.getItem('user'))
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    village: '',
    farm_number: '',
    farm_type: '',
    species_type: '',
    total_animals: '',
    avg_weight: '',
    avg_feed_consumption: '',
    avg_water_consumption: '',
    antibiotic_used: false,
    antibiotic_name: '',
    antibiotic_reason: '',
    treated_for: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/farms/${id}/`)
        if (response.ok) {
          const data = await response.json()
          setFormData(data)
        } else {
            alert('Failed to fetch farm details')
            navigate('/farmer-dashboard')
        }
      } catch (error) {
        console.error('Error fetching farm:', error)
        alert('Error fetching farm')
      } finally {
        setLoading(false)
      }
    }
    fetchFarm()
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
        const response = await fetch(`http://localhost:8000/api/farms/${id}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...formData,
                email: user.email
            })
        })
        if (response.ok) {
            navigate('/farmer-dashboard')
        } else {
            alert('Failed to update farm')
        }
    } catch (error) {
        console.error('Error updating farm:', error)
        alert('Error updating farm')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Farm</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Farm Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Farm Number</label>
                        <input type="text" name="farm_number" required value={formData.farm_number} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input type="text" name="state" required value={formData.state} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Village</label>
                        <input type="text" name="village" required value={formData.village} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                </div>

                {/* Farm Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Farm Type</label>
                    <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                            <input type="radio" name="farm_type" value="backyard" checked={formData.farm_type === 'backyard'} required onChange={handleChange} className="form-radio text-primary-600" />
                            <span className="ml-2">Backyard</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input type="radio" name="farm_type" value="commercial" checked={formData.farm_type === 'commercial'} required onChange={handleChange} className="form-radio text-primary-600" />
                            <span className="ml-2">Commercial</span>
                        </label>
                    </div>
                </div>

                {/* Species Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Species Type</label>
                    <div className="mt-2 space-y-2">
                        {speciesOptions.map(option => (
                            <div key={option.value} className="flex items-center">
                                <input type="radio" name="species_type" value={option.value} checked={formData.species_type === option.value} required onChange={handleChange} className="form-radio text-primary-600" />
                                <span className="ml-2">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total No of Animals</label>
                        <input type="number" name="total_animals" required value={formData.total_animals} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Average Weight (kg)</label>
                        <input type="number" step="0.01" name="avg_weight" required value={formData.avg_weight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avg Feed Consumption (kg/day)</label>
                        <input type="number" step="0.01" name="avg_feed_consumption" required value={formData.avg_feed_consumption} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avg Water Consumption (litres/day)</label>
                        <input type="number" step="0.01" name="avg_water_consumption" required value={formData.avg_water_consumption} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" />
                    </div>
                </div>

                {/* Antibiotics */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Antibiotic Used?</label>
                    <div className="mt-2 space-x-4">
                        <label className="inline-flex items-center">
                            <input type="checkbox" name="antibiotic_used" checked={formData.antibiotic_used} onChange={handleChange} className="form-checkbox text-primary-600 h-5 w-5" />
                            <span className="ml-2">Yes</span>
                        </label>
                    </div>
                </div>

                {formData.antibiotic_used && (
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Antibiotic Name</label>
                            <select name="antibiotic_name" value={formData.antibiotic_name || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2">
                                <option value="">Select Antibiotic</option>
                                <option value="spectromycin">Spectromycin</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <div className="mt-2 space-y-2">
                                <label className="inline-flex items-center mr-4">
                                    <input type="radio" name="antibiotic_reason" value="treat_disease" checked={formData.antibiotic_reason === 'treat_disease'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Treat Disease</span>
                                </label>
                                <label className="inline-flex items-center mr-4">
                                    <input type="radio" name="antibiotic_reason" value="prophylactic" checked={formData.antibiotic_reason === 'prophylactic'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Prophylactic</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name="antibiotic_reason" value="other" checked={formData.antibiotic_reason === 'other'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Other</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Treated For</label>
                            <div className="mt-2 space-y-2">
                                <label className="inline-flex items-center mr-4">
                                    <input type="radio" name="treated_for" value="enteric" checked={formData.treated_for === 'enteric'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Enteric</span>
                                </label>
                                <label className="inline-flex items-center mr-4">
                                    <input type="radio" name="treated_for" value="respiratory" checked={formData.treated_for === 'respiratory'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Respiratory</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input type="radio" name="treated_for" value="reproductive" checked={formData.treated_for === 'reproductive'} onChange={handleChange} className="form-radio text-primary-600" />
                                    <span className="ml-2">Reproductive</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => navigate('/farmer-dashboard')} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Cancel
                    </button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        Update Farm
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default EditFarm
