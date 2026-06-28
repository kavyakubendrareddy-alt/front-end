import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, CalendarDays, CreditCard, BarChart2, LogOut } from 'lucide-react'
import { removeToken } from '../utils/auth'

const NAV = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/bookings', label: 'Bookings', icon: BookOpen },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
]

export default function Navbar() {
    const { pathname } = useLocation()
    const navigate = useNavigate()

    const logout = () => {
        removeToken()
        navigate('/login', { replace: true })
    }

    return (
        <>
            {/* ── Desktop top bar ── */}
            <nav className="hidden md:flex bg-gradient-to-r from-indigo-800 to-indigo-700
                            text-white px-6 py-3.5 items-center gap-1 shadow-lg">
                <div className="flex items-center gap-2 mr-6">
                    <span className="text-xl">🏛️</span>
                    <div>
                        <div className="font-bold text-base leading-tight">NRK Function Hall</div>
                        <div className="text-indigo-300 text-xs">Event Management CRM</div>
                    </div>
                </div>
                <div className="h-6 w-px bg-indigo-600 mr-4" />
                {NAV.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                        transition-all duration-150
                                        ${active
                                    ? 'bg-white/20 text-white shadow-inner'
                                    : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    )
                })}
                <button
                    onClick={logout}
                    title="Sign out"
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                               text-indigo-300 hover:bg-white/10 hover:text-white transition-all"
                >
                    <LogOut size={15} />
                    <span>Sign out</span>
                </button>
            </nav>

            {/* ── Mobile top bar ── */}
            <div className="md:hidden bg-gradient-to-r from-indigo-800 to-indigo-700
                            text-white px-4 py-3 flex items-center gap-2 shadow-md">
                <span className="text-lg">🏛️</span>
                <div className="flex-1">
                    <div className="font-bold text-sm leading-tight">NRK Function Hall</div>
                    <div className="text-indigo-300 text-xs">Event Management</div>
                </div>
                <button onClick={logout} className="text-indigo-300 hover:text-white p-1">
                    <LogOut size={18} />
                </button>
            </div>

            {/* ── Mobile bottom tab bar ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
                            z-50 flex shadow-2xl safe-area-pb">
                {NAV.map(({ to, label, icon: Icon }) => {
                    const active = pathname === to
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium
                                        transition-all duration-150
                                        ${active
                                    ? 'text-indigo-600'
                                    : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <div className={`p-1 rounded-lg transition-all ${active ? 'bg-indigo-50' : ''}`}>
                                <Icon size={21} />
                            </div>
                            <span>{label}</span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
