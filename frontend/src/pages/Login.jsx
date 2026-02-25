import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [userName, setUserName] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
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
    if (!validate()) {
      return
    }
    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: formData.email,
          password: formData.password,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setUserName(data.user_name)
        localStorage.setItem('user', JSON.stringify({ 
          name: data.user_name,
          email: data.email,
          role: data.role,
          token: data.token,
          profile_completed: data.profile_completed,
          profile: data.profile
        }))
        
        if (data.role === 'farmer' || data.role === 'data_operator') {
          setTimeout(() => navigate('/farmer-dashboard'), 1500)
        } else if (data.role === 'vet') {
          setTimeout(() => navigate('/vet-dashboard'), 1500)
        } else {
          setTimeout(() => navigate('/'), 1500)
        }
      } else {
        setErrors({ general: data.error || 'Login failed' })
      }
    } catch (error) {
      setErrors({ general: 'Network error' })
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="mx-auto h-10 w-auto flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">AMU</span>
        </div>
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">
          {userName ? `Welcome, ${userName}` : 'Sign in to your account'}
        </h2>
      </div>

      {!userName && (
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-md px-3 py-1.5 text-base text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.email 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600'
                  } outline-1 -outline-offset-1 sm:text-sm/6`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                  Password
                </label>
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-md px-3 py-1.5 text-base text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.password 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600'
                  } outline-1 -outline-offset-1 sm:text-sm/6`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-primary-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
              >
                Sign in
              </button>
            </div>
            {errors.general && (
              <p className="mt-2 text-sm text-red-600 text-center">{errors.general}</p>
            )}
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-500">
            Not a member?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-500"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default Login
