import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Shield, ChevronRight, XCircle, ArrowLeft } from 'lucide-react'
import api from '../services/api'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [userName, setUserName] = useState('')
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
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const data = await api.post('/login/', {
        email_address: formData.email,
        password: formData.password,
      })

      setUserName(data.user_name)
      localStorage.setItem('user', JSON.stringify({
        name: data.user_name,
        email: data.email,
        role: data.role,
        token: data.token,
        profile_completed: data.profile_completed,
        profile: data.profile
      }))

      const target = (data.role === 'farmer' || data.role === 'data_operator')
        ? '/operator-dashboard'
        : (data.role === 'vet' ? '/vet-dashboard' : '/')

      setTimeout(() => navigate(target), 1200)
    } catch (error) {
      setErrors({ general: error.message || 'Login failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#14171a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-800/10 rounded-full blur-[120px] pointer-events-none"></div>

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

      <div className="w-full max-w-md z-10 animate-enter">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 rounded-none bg-teal-accent/10 mb-4 animate-slide-up">
            <Shield className="text-teal-accent" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {userName ? `Welcome back, ${userName}` : 'Sign In'}
          </h1>
          <p className="text-slate-400 mt-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {userName ? 'Preparing your dashboard...' : 'Access the AMU Monitoring System'}
          </p>
        </div>

        {!userName && (
          <div className="glass-effect rounded-none p-8 teal-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-500 group-focus-within:text-teal-accent'}`} size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-surface-bg/50 border ${errors.email ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-3 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all focus:ring-4 focus:ring-teal-accent/5`}
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400 ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" size="sm" className="text-xs font-medium text-teal-accent hover:text-white transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-500 group-focus-within:text-teal-accent'}`} size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-surface-bg/50 border ${errors.password ? 'border-red-500/50' : 'border-white/5 focus:border-teal-accent/50'} rounded-none py-3 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all focus:ring-4 focus:ring-teal-accent/5`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-400 ml-1">{errors.password}</p>}
              </div>

              {errors.general && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-none p-3 flex items-center gap-3 text-red-400 text-sm">
                  <XCircle size={18} />
                  {errors.general}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00c096] hover:bg-[#00d1a4] text-white font-bold py-4 rounded-none shadow-lg shadow-teal-accent/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center group"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Sign In
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-teal-accent font-bold hover:text-white transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
