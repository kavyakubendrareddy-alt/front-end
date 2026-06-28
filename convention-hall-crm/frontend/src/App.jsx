import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Bookings from './pages/Bookings'
import CalendarView from './pages/CalendarView'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Login from './pages/Login'
import { isLoggedIn } from './utils/auth'

function ProtectedRoute({ children }) {
    return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <div className="min-h-screen bg-gray-50">
                            <Navbar />
                            <main className="pb-20 md:pb-6">
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/bookings" element={<Bookings />} />
                                    <Route path="/calendar" element={<CalendarView />} />
                                    <Route path="/payments" element={<Payments />} />
                                    <Route path="/reports" element={<Reports />} />
                                </Routes>
                            </main>
                        </div>
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}
