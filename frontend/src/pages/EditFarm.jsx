import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const speciesOptions = [
    { value: 'MIX', label: 'Mixed (Multi-species)' },
    { value: 'AVI', label: 'Avian (Poultry/Birds)' },
    { value: 'BOV', label: 'Bovine (Cattle)' },
    { value: 'SUI', label: 'Suine (Pigs/Swine)' },
    { value: 'CAP', label: 'Caprine (Goats)' },
    { value: 'OVI', label: 'Ovine (Sheep)' },
    { value: 'EQU', label: 'Equine (Horses)' },
    { value: 'LEP', label: 'Leporine (Rabbits)' },
    { value: 'PIS', label: 'Pisces (Fish)' },
    { value: 'CAM', label: 'Camelids (Camels)' },
    { value: 'API', label: 'Apiculture (Bees)' },
]

function EditFarm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const user = JSON.parse(localStorage.getItem('user'))
    const [formData, setFormData] = useState({
        name: '',
        state: '',
        district: '',
        farm_number: '',
        farm_type: '',
        species_type: ''
    })
    const [loading, setLoading] = useState(true)

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
        const fetchFarm = async () => {
            try {
                const data = await api.get(`/farms/${id}/`)
                setFormData(data)
            } catch (error) {
                console.error('Error fetching farm:', error)
                alert(error.message || 'Error fetching farm')
                navigate('/operator-dashboard')
            } finally {
                setLoading(false)
            }
        }
        fetchFarm()
    }, [id, navigate])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        if (name === 'state') {
            setFormData(prev => ({ ...prev, state: value, district: '' }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.put(`/farms/${id}/`, formData)
            navigate('/operator-dashboard')
        } catch (error) {
            console.error('Error updating farm:', error)
            alert(error.message || 'Error updating farm')
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
                            <select
                                name="state"
                                required
                                value={formData.state}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                            >
                                <option value="">Select State</option>
                                {states.map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">District</label>
                            {formData.state === "Tamil Nadu" ? (
                                <select
                                    name="district"
                                    required
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                >
                                    <option value="">Select District</option>
                                    {tnDistricts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    name="district"
                                    required
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                                />
                            )}
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

                    {/* Metrics Section Removed - Now in Flock Level */}

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => navigate('/operator-dashboard')} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
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
