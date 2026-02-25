import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function LogTreatment() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const [farms, setFarms] = useState([])
  const [antibiotics, setAntibiotics] = useState([])
  const [formData, setFormData] = useState({
    farm: '',
    antibiotic_name: '',
    reason: '',
    treated_for: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || (user.role !== 'farmer' && user.role !== 'data_operator')) {
      navigate('/login')
      return
    }

    const fetchFarms = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/farms/?email=${user.email}`)
        if (response.ok) {
          const data = await response.json()
          setFarms(data)
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, farm: data[0].id }))
          }
        }
      } catch (error) {
        console.error('Error fetching farms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFarms()
  }, [navigate, user])

  useEffect(() => {
    if (formData.farm && farms.length > 0) {
      const selectedFarm = farms.find(f => f.id == formData.farm)
      if (selectedFarm && selectedFarm.species_type) {
        fetch(`http://localhost:8000/api/reference/molecules/?species=${selectedFarm.species_type}`)
          .then(res => res.json())
          .then(data => {
             if (Array.isArray(data)) {
                 setAntibiotics(data)
                 setFormData(prev => ({ ...prev, antibiotic_name: '' }))
             } else {
                console.error('Error fetching molecules:', data)
                setAntibiotics([])
            }
          })
          .catch(err => console.error('Error fetching molecules:', err))
      }
    } else {
        setAntibiotics([])
    }
  }, [formData.farm, farms])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
        const response = await fetch('http://localhost:8000/api/treatments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })

        if (response.ok) {
            alert('Treatment logged successfully')
            navigate('/farmer-dashboard')
        } else {
            const data = await response.json()
            alert(data.error || 'Failed to log treatment')
        }
    } catch (error) {
        console.error('Error logging treatment:', error)
        alert('Error logging treatment')
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Log New Treatment
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="farm" className="block text-sm font-medium text-gray-700">
                Select Farm
              </label>
              <select
                id="farm"
                name="farm"
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                value={formData.farm}
                onChange={handleChange}
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} ({farm.farm_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="antibiotic_name" className="block text-sm font-medium text-gray-700">
                Antibiotic Name
              </label>
              <select
                id="antibiotic_name"
                name="antibiotic_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                value={formData.antibiotic_name}
                onChange={handleChange}
              >
                <option value="">Select antibiotic</option>
                {antibiotics.map((antibiotic) => (
                  <option key={antibiotic.id} value={antibiotic.name}>
                    {antibiotic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                Reason
              </label>
              <select
                id="reason"
                name="reason"
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                value={formData.reason}
                onChange={handleChange}
              >
                <option value="">Select a reason</option>
                <option value="treat_disease">Treat Disease</option>
                <option value="prophylactic">Prophylactic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="treated_for" className="block text-sm font-medium text-gray-700">
                Treated For
              </label>
              <select
                id="treated_for"
                name="treated_for"
                required
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                value={formData.treated_for}
                onChange={handleChange}
              >
                 <option value="">Select condition</option>
                <option value="enteric">Enteric</option>
                <option value="respiratory">Respiratory</option>
                <option value="reproductive">Reproductive</option>
                <option value="other">Other</option>
              </select>
            </div>

             <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/farmer-dashboard')}
              className="group relative flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Log Treatment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LogTreatment
