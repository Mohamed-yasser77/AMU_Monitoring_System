import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VetSidebar from '../components/vet/Sidebar'
import {
  LayoutDashboard,
  ClipboardList,
  Pill,
  BookOpen,
  User as UserIcon,
  LogOut,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  ChevronRight,
  Info,
  AlertCircle,
  Settings,
  Activity,
  Edit,
  FileText,
  Droplet,
  Scale
} from 'lucide-react'

function VetDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [pendingTreatments, setPendingTreatments] = useState([])
  const [treatmentHistory, setTreatmentHistory] = useState([])

  // Modification Modal State
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [modifyForm, setModifyForm] = useState({
    antibiotic_name: '',
    dosage: '',
    method_intake: '',
    reason: '',
    treated_for: '',
    vet_notes: ''
  })

  // Prescription Form State
  const [prescriptionForm, setPrescriptionForm] = useState({
    farm_id: '',
    flock_id: '',
    animal_id: '',
    antibiotic_name: '',
    reason: '',
    treated_for: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Dependent Selection Data
  const [farms, setFarms] = useState([])
  const [flocks, setFlocks] = useState([])
  const [animals, setAnimals] = useState([])

  const [profileData, setProfileData] = useState({
    state: '',
    district: '',
    address: '',
    phone_number: ''
  })

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

    const fetchData = async () => {
      try {
        const [drugsRes, treatmentsRes, farmsRes] = await Promise.all([
          fetch('http://localhost:8000/api/reference/drugs/'),
          fetch(`http://localhost:8000/api/treatments/?vet_email=${user.email}`),
          fetch(`http://localhost:8000/api/farms/?email=${user.email}`)
        ])

        if (drugsRes.ok) setDrugs(await drugsRes.json())
        if (treatmentsRes.ok) {
          const data = await treatmentsRes.json()
          setPendingTreatments(data.pending)
          setTreatmentHistory(data.history)
        }
        if (farmsRes.ok) setFarms(await farmsRes.json())

        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh data every 30 seconds for real-time request tracking
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [navigate, user?.email])

  // Fetch flocks when farm is selected in prescription form
  useEffect(() => {
    if (prescriptionForm.farm_id) {
      const fetchFlocks = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/flocks/?farm_id=${prescriptionForm.farm_id}&email=${user.email}`)
          if (res.ok) setFlocks(await res.json())
        } catch (error) {
          console.error('Error fetching flocks:', error)
        }
      }
      fetchFlocks()
    } else {
      setFlocks([])
      setAnimals([])
    }
  }, [prescriptionForm.farm_id])

  // Fetch animals when flock is selected
  useEffect(() => {
    if (prescriptionForm.flock_id) {
      const fetchAnimals = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/animals/?flock_id=${prescriptionForm.flock_id}&email=${user.email}`)
          if (res.ok) setAnimals(await res.json())
        } catch (error) {
          console.error('Error fetching animals:', error)
        }
      }
      fetchAnimals()
    } else {
      setAnimals([])
    }
  }, [prescriptionForm.flock_id])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleTreatmentAction = async (treatmentId, action, modifiedData = null) => {
    try {
      const response = await fetch(`http://localhost:8000/api/treatments/${treatmentId}/action/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(modifiedData || {})
        })
      })

      if (response.ok) {
        setPendingTreatments(prev => prev.filter(t => t.id !== treatmentId))
        // Refresh history
        const treatmentsRes = await fetch(`http://localhost:8000/api/treatments/?vet_email=${user.email}`)
        if (treatmentsRes.ok) {
          const data = await treatmentsRes.json()
          setTreatmentHistory(data.history)
        }
        setShowModifyModal(false)
        alert(`Treatment ${action}ed successfully`)
      }
    } catch (error) {
      console.error('Error updating treatment:', error)
    }
  }

  const openModifyModal = (t) => {
    setSelectedTreatment(t)
    setModifyForm({
      antibiotic_name: t.antibiotic_name || '',
      dosage: t.dosage || '',
      method_intake: t.method_intake || '',
      reason: t.reason || '',
      treated_for: t.treated_for || '',
      vet_notes: t.vet_notes || ''
    })
    setShowModifyModal(true)
  }

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:8000/api/treatments/prescribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...prescriptionForm,
          farm: prescriptionForm.farm_id,
          vet_email: user.email
        })
      })

      if (response.ok) {
        alert('Prescription logged successfully!')
        setPrescriptionForm({
          farm_id: '',
          flock_id: '',
          animal_id: '',
          antibiotic_name: '',
          reason: '',
          treated_for: '',
          date: new Date().toISOString().split('T')[0]
        })
        setActiveTab('treatments')
        // Refresh treatments
        const treatmentsRes = await fetch(`http://localhost:8000/api/treatments/?vet_email=${user.email}`)
        if (treatmentsRes.ok) {
          const data = await treatmentsRes.json()
          setPendingTreatments(data.pending)
          setTreatmentHistory(data.history)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to log prescription')
      }
    } catch (error) {
      console.error('Error prescribing:', error)
      alert('Error logging prescription')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.family.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabLabels = { overview: 'Overview', treatments: 'Treatments', prescribe: 'Prescribe', reference: 'Drug Database' };

  return (
    <div className="min-h-screen bg-surface-bg flex relative overflow-hidden">
      <VetSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userName={user?.name}
        onLogout={handleLogout}
        pendingCount={pendingTreatments.length}
      />

      <main className="flex-1 ml-64 p-8 animate-fade-in custom-scrollbar overflow-y-auto h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {tabLabels[activeTab] || activeTab}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-teal-accent uppercase tracking-[0.2em]">AMU Monitoring</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">{tabLabels[activeTab]}</span>
            </div>
          </div>

          <div className="flex gap-3">
            {!profileCompleted && (
              <button
                onClick={() => setShowProfileForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-all"
              >
                <AlertCircle size={14} />
                Complete Profile
              </button>
            )}
            <div className="flex items-center gap-2 bg-surface-card border border-white/5 rounded-xl px-4 py-2.5 text-slate-400">
              <Search size={16} />
              <input
                type="text"
                placeholder="Quick search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-600 w-48 outline-none"
              />
            </div>
            <div className="p-2.5 bg-teal-accent text-[#14171a] rounded-xl cursor-pointer hover:opacity-90 transition-opacity teal-glow">
              <Settings size={18} strokeWidth={2.5} />
            </div>
          </div>
        </header>

        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-card p-6 rounded-2xl border border-white/5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-teal-accent/10 p-3 rounded-xl text-teal-accent">
                      <ClipboardList size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
                      <p className="text-2xl font-bold text-white">{pendingTreatments.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-card p-6 rounded-2xl border border-white/5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
                      <CheckCircle size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Total Approved</p>
                      <p className="text-2xl font-bold text-white">{treatmentHistory.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-card p-6 rounded-2xl border border-white/5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-400/10 p-3 rounded-xl text-indigo-400">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Drug Molecules</p>
                      <p className="text-2xl font-bold text-white">{drugs.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-card p-6 rounded-2xl border border-white/5 shadow-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="bg-violet-400/10 p-3 rounded-xl text-violet-400">
                      <UserIcon size={22} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">District Vets</p>
                      <p className="text-2xl font-bold text-white">12</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Mini-table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-card rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white">Urgent Pending Requests</h3>
                    <button onClick={() => setActiveTab('treatments')} className="text-teal-accent text-xs font-bold hover:underline uppercase tracking-wider">View All</button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {pendingTreatments.slice(0, 4).length > 0 ? (
                      pendingTreatments.slice(0, 4).map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-800 p-2 rounded-lg text-slate-500 group-hover:text-teal-accent transition-colors">
                              <ClipboardList size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{t.farm__name}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-tight">{t.antibiotic_name} • {t.date}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        <CheckCircle size={32} className="mx-auto mb-2 opacity-10" />
                        No pending requests
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#00c096] rounded-3xl p-8 text-[#14171a] relative overflow-hidden shadow-xl shadow-teal-accent/10 group teal-glow-strong">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">New Prescription</h3>
                    <p className="text-[#14171a]/70 text-sm font-medium mb-6 max-w-xs uppercase tracking-tight">Easily log new treatments for flocks or individual animals directly from your dashboard.</p>
                    <button
                      onClick={() => setActiveTab('prescribe')}
                      className="bg-[#14171a] text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg uppercase tracking-wider"
                    >
                      Create Now
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-8 -mb-8 blur-2xl"></div>
                  <Pill size={120} className="absolute -bottom-4 right-4 text-black/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                </div>
              </div>
            </div>
          )}

          {/* Treatments Tab */}
          {activeTab === 'treatments' && (
            <div className="space-y-8 animate-slide-up">
              <div className="bg-surface-card rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-400" />
                    Pending Approval
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {pendingTreatments.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/[0.02]">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Farm/Owner</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Molecule/Drug</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {pendingTreatments.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-white text-sm">{t.farm__name}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-tight">{t.farm__district}, {t.farm__village}</div>
                            </td>
                            <td className="px-6 py-4">
                              {t.animal__animal_tag ? (
                                <span className="bg-teal-accent/10 text-teal-accent text-[10px] font-bold px-2 py-1 rounded-md border border-teal-accent/20 uppercase tracking-tighter">Animal: {t.animal__animal_tag}</span>
                              ) : (
                                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-md border border-indigo-500/20 uppercase tracking-tighter">Flock: {t.flock__flock_tag}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-300">{t.antibiotic_name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t.date}</div>
                            </td>
                            <td className="px-6 py-4 capitalize font-medium text-slate-400 text-xs">
                              {t.reason.replace('_', ' ')} / {t.treated_for}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openModifyModal(t)}
                                  className="p-2 bg-teal-accent/10 text-teal-accent hover:bg-teal-accent hover:text-[#14171a] rounded-lg transition-all border border-teal-accent/20 shadow-sm"
                                  title="Review & Modify"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleTreatmentAction(t.id, 'approve')}
                                  className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-[#14171a] rounded-lg transition-all border border-emerald-500/20 shadow-sm"
                                  title="Quick Approve"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleTreatmentAction(t.id, 'reject')}
                                  className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all border border-rose-500/20 shadow-sm"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center">
                      <CheckCircle size={48} className="mx-auto mb-4 text-white opacity-5" />
                      <p className="text-slate-500 font-medium text-sm">No pending requests to show.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* History */}
              <div className="bg-surface-card rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h2 className="font-bold text-white">Treatment History</h2>
                </div>
                <div className="overflow-x-auto">
                  {treatmentHistory.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/[0.02]">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Farm</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Drug</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {treatmentHistory.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-white">{t.farm__name}</div>
                              {t.animal__animal_tag ? (
                                <div className="text-[10px] text-teal-accent uppercase font-medium">Animal: {t.animal__animal_tag}</div>
                              ) : (
                                <div className="text-[10px] text-indigo-400 uppercase font-medium">Flock: {t.flock__flock_tag}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-300">{t.antibiotic_name}</div>
                              <div className="flex gap-2 mt-1">
                                {t.dosage && <span className="bg-white/5 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border border-white/5">{t.dosage}</span>}
                                {t.method_intake && <span className="bg-white/5 text-slate-500 text-[9px] px-1.5 py-0.5 rounded border border-white/5">{t.method_intake}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{t.date}</div>
                              {t.vet_notes && (
                                <div className="flex items-center gap-1 mt-1 text-teal-accent/60 group-hover:text-teal-accent transition-colors">
                                  <FileText size={10} />
                                  <span className="text-[9px] italic truncate max-w-[100px]">{t.vet_notes}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                Approved
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="p-8 text-center text-slate-500 text-sm italic">No history available yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prescribe Tab */}
          {activeTab === 'prescribe' && (
            <div className="max-w-2xl mx-auto animate-slide-up">
              <div className="bg-surface-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative group">
                <div className="bg-teal-accent p-8 text-[#14171a] teal-glow">
                  <h2 className="text-2xl font-bold mb-2">New Prescription</h2>
                  <p className="text-[#14171a]/70 text-sm font-medium uppercase tracking-tight">Issue a direct treatment order for an animal or flock.</p>
                  <Pill size={80} className="absolute -top-4 -right-4 text-black/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                </div>
                <form onSubmit={handlePrescriptionSubmit} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Farm</label>
                      <select
                        required
                        value={prescriptionForm.farm_id}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, farm_id: e.target.value, flock_id: '', animal_id: '' })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                      >
                        <option value="" className="bg-slate-900">Select Farm</option>
                        {farms.map(farm => (
                          <option key={farm.id} value={farm.id} className="bg-slate-900">{farm.name} ({farm.farm_number})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Flock (Optional)</label>
                      <select
                        value={prescriptionForm.flock_id}
                        disabled={!prescriptionForm.farm_id}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, flock_id: e.target.value, animal_id: '' })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none disabled:opacity-30"
                      >
                        <option value="" className="bg-slate-900">Entire Farm</option>
                        {flocks.map(flock => (
                          <option key={flock.id} value={flock.id} className="bg-slate-900">{flock.flock_tag}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Animal (Optional)</label>
                      <select
                        value={prescriptionForm.animal_id}
                        disabled={!prescriptionForm.flock_id}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, animal_id: e.target.value })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none disabled:opacity-30"
                      >
                        <option value="" className="bg-slate-900">Entire Flock</option>
                        {animals.map(animal => (
                          <option key={animal.id} value={animal.id} className="bg-slate-900">{animal.animal_tag}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Molecule / Drug</label>
                      <select
                        required
                        value={prescriptionForm.antibiotic_name}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, antibiotic_name: e.target.value })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                      >
                        <option value="" className="bg-slate-900">Select Drug</option>
                        {drugs.map(drug => (
                          <option key={drug.id} value={drug.name} className="bg-slate-900">{drug.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                      <select
                        required
                        value={prescriptionForm.reason}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, reason: e.target.value })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                      >
                        <option value="" className="bg-slate-900">Select Reason</option>
                        <option value="treat_disease" className="bg-slate-900">Treat Disease</option>
                        <option value="prophylactic" className="bg-slate-900">Prophylactic</option>
                        <option value="other" className="bg-slate-900">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System/Issue</label>
                      <select
                        required
                        value={prescriptionForm.treated_for}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, treated_for: e.target.value })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                      >
                        <option value="" className="bg-slate-900">Select System</option>
                        <option value="enteric" className="bg-slate-900">Enteric</option>
                        <option value="respiratory" className="bg-slate-900">Respiratory</option>
                        <option value="reproductive" className="bg-slate-900">Reproductive</option>
                        <option value="other" className="bg-slate-900">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Treatment Date</label>
                      <input
                        type="date"
                        required
                        value={prescriptionForm.date}
                        onChange={e => setPrescriptionForm({ ...prescriptionForm, date: e.target.value })}
                        className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-teal-accent text-[#14171a] hover:opacity-90 transition-all shadow-lg teal-glow"
                    >
                      Log Approved Prescription
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Drug Reference Tab */}
          {activeTab === 'reference' && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Antimicrobial Database</h2>
                  <p className="text-sm text-slate-500">Reference directory for drug molecules and MRL limits.</p>
                </div>
                <div className="relative w-full md:w-96">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search molecule, family, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-white/5 bg-surface-card shadow-sm focus:border-teal-accent focus:ring-teal-accent transition-all text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrugs.map((drug) => (
                  <div key={drug.id} className="bg-surface-card rounded-2xl border border-white/5 shadow-sm p-6 flex flex-col hover:border-teal-accent/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-teal-accent/10 p-3 rounded-xl text-teal-accent group-hover:teal-glow transition-all">
                        <BookOpen size={20} />
                      </div>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${drug.category?.toLowerCase() === 'critically important'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {drug.category || 'Standard'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{drug.name}</h3>
                    <p className="text-[10px] font-bold text-teal-accent/60 uppercase tracking-widest mb-4 group-hover:text-teal-accent transition-colors">{drug.family}</p>

                    <p className="text-sm text-slate-500 mb-6 flex-1 italic line-clamp-3">
                      {drug.comments || 'No description available for this molecule.'}
                    </p>

                    {drug.mrls && drug.mrls.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">MRL Limits (mg/kg)</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          {drug.mrls.map((mrl, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white/[0.02] p-2 rounded-lg text-[11px] font-medium border border-white/5">
                              <span className="text-slate-400">{mrl.species} ({mrl.tissue})</span>
                              <span className="text-teal-accent font-bold">{mrl.limit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredDrugs.length === 0 && (
                  <div className="col-span-full py-20 text-center">
                    <Search size={48} className="mx-auto mb-4 text-white opacity-5" />
                    <p className="text-slate-500 font-bold">No molecules found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modify & Approve Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-card rounded-3xl border border-white/5 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-slide-up">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-teal-accent text-[#14171a] rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-bold">Review & Modify Treatment</h2>
                <p className="text-[#14171a]/70 text-sm font-medium uppercase tracking-tight mt-1">
                  Adjusting request for {selectedTreatment?.farm__name}
                </p>
              </div>
              <button
                onClick={() => setShowModifyModal(false)}
                className="p-2 hover:bg-black/10 rounded-full transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Context Info Panel */}
              <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-5">
                <div className="flex items-center gap-2 mb-4 text-slate-300">
                  <Info size={16} className="text-teal-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Animal / Flock Profile</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Target</p>
                    <p className="text-sm font-medium text-white">
                      {selectedTreatment?.animal__animal_tag ? `Animal: ${selectedTreatment.animal__animal_tag}` : `Flock: ${selectedTreatment?.flock__flock_tag || 'Unknown'}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Species</p>
                    <p className="text-sm font-medium text-white capitalize">
                      {selectedTreatment?.flock__species_type?.replace(/_/g, ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1"><Scale size={10} /> Avg. Weight</p>
                    <p className="text-sm font-medium text-white">
                      {selectedTreatment?.flock__avg_weight ? `${selectedTreatment.flock__avg_weight} kg` : '--'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1"><Droplet size={10} /> Daily Feed/Water</p>
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {selectedTreatment?.flock__avg_feed_consumption ? `${selectedTreatment.flock__avg_feed_consumption}kg` : '--'} / {selectedTreatment?.flock__avg_water_consumption ? `${selectedTreatment.flock__avg_water_consumption}L` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              <form id="modify-form" onSubmit={(e) => {
                e.preventDefault();
                handleTreatmentAction(selectedTreatment.id, 'approve', modifyForm);
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Molecule / Drug</label>
                    <select
                      required
                      value={modifyForm.antibiotic_name}
                      onChange={e => setModifyForm({ ...modifyForm, antibiotic_name: e.target.value })}
                      className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    >
                      {drugs.map(drug => (
                        <option key={drug.id} value={drug.name} className="bg-slate-900">{drug.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dosage (Vet Instruction)</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg, 5ml"
                      value={modifyForm.dosage}
                      onChange={e => setModifyForm({ ...modifyForm, dosage: e.target.value })}
                      className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intake Method</label>
                    <select
                      value={modifyForm.method_intake}
                      onChange={e => setModifyForm({ ...modifyForm, method_intake: e.target.value })}
                      className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    >
                      <option value="" className="bg-slate-900">Select Method</option>
                      <option value="Oral" className="bg-slate-900">Oral</option>
                      <option value="Injection" className="bg-slate-900">Injection</option>
                      <option value="Water" className="bg-slate-900">Water</option>
                      <option value="Feed" className="bg-slate-900">Feed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reason</label>
                    <select
                      value={modifyForm.reason}
                      onChange={e => setModifyForm({ ...modifyForm, reason: e.target.value })}
                      className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    >
                      <option value="treat_disease" className="bg-slate-900">Treat Disease</option>
                      <option value="prophylactic" className="bg-slate-900">Prophylactic</option>
                      <option value="other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vet Notes / Clinical Observations</label>
                  <textarea
                    rows={4}
                    placeholder="Enter your clinical observations or specific instructions..."
                    className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    value={modifyForm.vet_notes}
                    onChange={e => setModifyForm({ ...modifyForm, vet_notes: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-white/5 flex gap-4">
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="flex-1 px-4 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                form="modify-form"
                className="flex-[2] px-4 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-teal-accent text-[#14171a] hover:opacity-90 transition-all shadow-lg teal-glow"
              >
                Apply Modifications & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-card rounded-3xl border border-white/5 shadow-2xl max-w-md w-full p-8 relative animate-slide-up">
            <button
              onClick={() => setShowProfileForm(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors p-1"
            >
              <XCircle size={24} />
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="bg-teal-accent/10 p-2 rounded-lg">
                  <UserIcon className="text-teal-accent" size={20} />
                </div>
                Professional Profile
              </h2>
              <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-tight">Please complete your details to enable all features.</p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const response = await fetch('http://localhost:8000/api/update-profile/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email, ...profileData })
                })
                if (response.ok) {
                  const data = await response.json()
                  const updatedUser = { ...user, profile_completed: true, profile: data.user }
                  localStorage.setItem('user', JSON.stringify(updatedUser))
                  setProfileCompleted(true)
                  setShowProfileForm(false)
                  alert('Profile updated successfully!')
                }
              } catch (error) {
                alert('Error updating profile.')
              }
            }} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Address</label>
                <textarea
                  required
                  placeholder="Enter your clinic or residence address"
                  className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                  value={profileData.address}
                  onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                  value={profileData.phone_number}
                  onChange={e => setProfileData({ ...profileData, phone_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State</label>
                  <select
                    required
                    className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    value={profileData.state}
                    onChange={e => setProfileData({ ...profileData, state: e.target.value, district: '' })}
                  >
                    <option value="" className="bg-slate-900">Select State</option>
                    {states.map(state => <option key={state} value={state} className="bg-slate-900">{state}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">District</label>
                  <select
                    required
                    className="w-full rounded-xl border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus:border-teal-accent focus:ring-teal-accent transition-all outline-none"
                    value={profileData.district}
                    onChange={e => setProfileData({ ...profileData, district: e.target.value })}
                  >
                    <option value="" className="bg-slate-900">Select District</option>
                    {profileData.state === "Tamil Nadu" ? tnDistricts.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>) : <option value="Other" className="bg-slate-900">Other</option>}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-teal-accent text-[#14171a] rounded-xl py-4 font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg teal-glow"
              >
                Save Professional Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VetDashboard
