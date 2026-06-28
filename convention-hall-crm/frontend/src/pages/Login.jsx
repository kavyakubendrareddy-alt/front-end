import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { setToken } from '../utils/auth'
import { Eye, EyeOff, Lock } from 'lucide-react'

const loginUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/auth/login`
    : '/api/auth/login'

export default function Login() {
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const res = await axios.post(loginUrl, { password })
            setToken(res.data.token)
            navigate('/dashboard', { replace: true })
        } catch (err) {
            setError(err.response?.data?.error ?? 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700
                        flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo / branding */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🏛️</div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        NRK Function Hall
                    </h1>
                    <p className="text-indigo-300 text-sm mt-1">Event Management CRM</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Lock size={16} className="text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Sign In</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                                               hover:text-gray-600"
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                                            rounded-xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
                                       text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-indigo-400 text-xs mt-6">
                    NRK Function Hall · 9448249477
                </p>
            </div>
        </div>
    )
}
