import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, UserCheck, Shield, ChevronRight, XCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import api from '../services/api'

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'data_operator',
  })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'At least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await api.post('/register/', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email_address: formData.email,
        password: formData.password,
        role: formData.role,
      })

      setSuccess('Account created successfully!')
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'data_operator'
      })
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#14171a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-800/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Back to Home Link */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-all group z-20"
      >
        <div className="p-2 rounded-none bg-white/5 group-hover:bg-white/10 border border-white/5 transition-all">
          <ArrowLeft size={16} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline-block">Back to Home</span>
      </Link>

      <div className="w-full max-w-lg z-10 animate-enter">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-none bg-teal-accent/10 mb-4 animate-slide-up">
            <UserCheck className="text-teal-accent" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {success ? 'Welcome Aboard!' : 'Join AMU Monitoring'}
          </h1>
          <p className="text-slate-400 mt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {success ? 'Redirecting to login...' : 'Create your account to start managing farm data'}
          </p>
        </div>

        {success ? (
          <div className="glass-effect rounded-none p-12 teal-glow flex flex-col items-center justify-center text-center animate-scale-up">
            <div className="w-20 h-20 bg-teal-accent/20 rounded-none flex items-center justify-center mb-6">
              <CheckCircle className="text-teal-accent" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{success}</h3>
            <p className="text-slate-400">Please wait while we redirect you to the login page.</p>
          </div>
        ) : (
          <div className="glass-effect rounded-none p-8 teal-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative group">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${errors.firstName ? 'text-red-400' : 'text-slate-600 group-focus-within:text-teal-accent'}`} size={16} />
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full bg-surface-bg/40 border ${errors.firstName ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all`}
                      placeholder="John"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full bg-surface-bg/40 border ${errors.lastName ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-2.5 px-4 text-white text-sm outline-none transition-all`}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Account Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-surface-bg/40 border border-white/5 focus:border-teal-accent/50 rounded-none py-2.5 px-4 text-white text-sm outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="data_operator">Data Operator</option>
                  <option value="vet">Veterinarian</option>
                  <option value="regulator">Regulator</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-600 group-focus-within:text-teal-accent'}`} size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-surface-bg/40 border ${errors.email ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all`}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-600 group-focus-within:text-teal-accent'}`} size={16} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full bg-surface-bg/40 border ${errors.password ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-2.5 pl-10 pr-4 text-white text-sm outline-none transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full bg-surface-bg/40 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-2.5 px-4 text-white text-sm outline-none transition-all`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-none p-3 flex items-center gap-3 text-red-400 text-xs">
                  <XCircle size={16} />
                  {errors.general}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00c096] hover:bg-[#00d1a4] text-white font-bold py-3.5 rounded-none shadow-lg shadow-teal-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center group mt-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Create Account
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-accent font-bold hover:text-white transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
