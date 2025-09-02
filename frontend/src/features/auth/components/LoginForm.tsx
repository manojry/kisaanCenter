import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Building2, User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.username || !credentials.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const user = await login(credentials.username, credentials.password)
      console.log('Login response:', user)
      console.log('localStorage.auth_token:', localStorage.getItem('auth_token'))
      console.log('localStorage.userRole:', localStorage.getItem('userRole'))
      if (user && user.role) {
        localStorage.setItem('userRole', user.role)
        toast.success('Login successful!')
        navigate('/dashboard')
      } else {
        toast.error('Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Login error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Kisaan Center
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                name="username"
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Demo Credentials:</p>
          <p>Owner: owner1 / password</p>
          <p>Farmer: farmer1 / password</p>
          <p>Buyer: buyer1 / password</p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm