import { useState, useEffect, useMemo } from 'react'
import { bookingApi } from '../api/bookingApi'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtRs(val) {
    if (!val || isNaN(val)) return '₹0'
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
    return `₹${Number(val).toLocaleString('en-IN')}`
}

export default function Reports() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [mode, setMode] = useState('monthly')       // 'monthly' | 'annual'
    const [year, setYear] = useState(new Date().getFullYear())
    const [month, setMonth] = useState(new Date().getMonth())

    useEffect(() => {
        bookingApi.getAll()
            .then(data => setBookings(data))
            .finally(() => setLoading(false))
    }, [])

    // Bookings in the selected period
    const filtered = useMemo(() => {
        return bookings.filter(b => {
            if (!b.eventDate) return false
            const d = new Date(b.eventDate + 'T00:00:00')
            if (mode === 'annual') return d.getFullYear() === year
            return d.getFullYear() === year && d.getMonth() === month
        })
    }, [bookings, mode, year, month])

    // Aggregated stats
    const stats = useMemo(() => {
        const active = filtered.filter(b => b.bookingStatus !== 'CANCELLED')
        const cancelled = filtered.filter(b => b.bookingStatus === 'CANCELLED').length
        const confirmed = filtered.filter(b => b.bookingStatus === 'CONFIRMED').length
        const tentative = filtered.filter(b => b.bookingStatus === 'TENTATIVE').length

        const revenue = active.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0)
        const collected = active.reduce((s, b) => s + parseFloat(b.advancePaid || 0), 0)
        const pending = revenue - collected
        const rate = revenue > 0 ? Math.round((collected / revenue) * 100) : 0

        // Expenses & profit
        const totalExpenses = active.reduce((s, b) => s +
            (parseFloat(b.expenseLabour || 0) +
                parseFloat(b.expenseDiesel || 0) +
                parseFloat(b.expenseCleaning || 0) +
                parseFloat(b.expenseElectricity || 0) +
                parseFloat(b.expenseOther || 0)), 0)
        const profit = revenue - totalExpenses

        // Event type breakdown
        const typeCounts = {}
        active.forEach(b => { typeCounts[b.eventType] = (typeCounts[b.eventType] || 0) + 1 })
        const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])

        // Payment status
        const psByStatus = {}
        active.forEach(b => { psByStatus[b.paymentStatus] = (psByStatus[b.paymentStatus] || 0) + 1 })

        // Food type
        let veg = 0, nonveg = 0
        active.forEach(b => {
            if (b.foodType === 'VEG') veg++
            else if (b.foodType === 'NONVEG') nonveg++
        })

        return {
            total: filtered.length, active: active.length,
            confirmed, tentative, cancelled,
            revenue, collected, pending, rate,
            totalExpenses, profit,
            topTypes, psByStatus, veg, nonveg,
        }
    }, [filtered])

    // Annual: monthly breakdown for bar chart
    const monthlyTrend = useMemo(() => {
        if (mode !== 'annual') return []
        return Array.from({ length: 12 }, (_, m) => {
            const mb = bookings.filter(b => {
                if (!b.eventDate) return false
                const d = new Date(b.eventDate + 'T00:00:00')
                return d.getFullYear() === year && d.getMonth() === m && b.bookingStatus !== 'CANCELLED'
            })
            return {
                month: MONTH_SHORT[m],
                bookings: mb.length,
                revenue: mb.reduce((s, b) => s + parseFloat(b.totalAmount || 0), 0),
                collected: mb.reduce((s, b) => s + parseFloat(b.advancePaid || 0), 0),
            }
        })
    }, [bookings, year, mode])

    const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue), 1)

    const periodLabel = mode === 'annual'
        ? String(year)
        : `${MONTH_NAMES[month]} ${year}`

    // Period navigation helpers
    function prevPeriod() {
        if (mode === 'annual') { setYear(y => y - 1); return }
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    function nextPeriod() {
        if (mode === 'annual') { setYear(y => y + 1); return }
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-gray-400 text-sm">Loading reports…</div>
            </div>
        )
    }

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 md:pb-8">

            {/* Page header */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-0.5">Business performance at a glance</p>
            </div>

            {/* Period control */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5
                            flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Monthly / Annual toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {['monthly', 'annual'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all capitalize
                                        ${mode === m ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {m === 'monthly' ? 'Monthly' : 'Annual'}
                        </button>
                    ))}
                </div>

                {/* Period navigator */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevPeriod}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-gray-800 min-w-[130px] text-center">
                        {periodLabel}
                    </span>
                    <button
                        onClick={nextPeriod}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <span className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">
                    {stats.total} booking{stats.total !== 1 ? 's' : ''} in period
                </span>
            </div>

            {/* ── Summary stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
                <StatCard
                    label="Bookings"
                    value={stats.active}
                    sub={stats.cancelled > 0 ? `${stats.cancelled} cancelled` : 'all active'}
                    bg="from-indigo-500 to-indigo-600"
                />
                <StatCard
                    label="Total Revenue"
                    value={fmtRs(stats.revenue)}
                    sub={`${stats.active} events`}
                    bg="from-violet-500 to-violet-600"
                />
                <StatCard
                    label="Collected"
                    value={fmtRs(stats.collected)}
                    sub={`${stats.rate}% collection rate`}
                    bg="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    label="Pending"
                    value={fmtRs(stats.pending)}
                    sub="balance due"
                    bg={stats.pending > 0 ? 'from-rose-500 to-rose-600' : 'from-emerald-500 to-emerald-600'}
                />
                <StatCard
                    label="Net Profit"
                    value={fmtRs(Math.abs(stats.profit))}
                    sub={stats.totalExpenses > 0
                        ? `₹${stats.totalExpenses.toLocaleString('en-IN')} expenses`
                        : 'no expenses entered'}
                    bg={stats.profit >= 0 ? 'from-teal-500 to-teal-600' : 'from-rose-600 to-rose-700'}
                />
            </div>

            {/* ── Collection rate bar ── */}
            {stats.active > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Collection Rate</span>
                        <span className="text-sm font-bold text-indigo-600">{stats.rate}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${stats.rate}%`,
                                background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>{fmtRs(stats.collected)} collected</span>
                        <span>{fmtRs(stats.revenue)} total billed</span>
                    </div>
                </div>
            )}

            {/* ── Annual: monthly revenue bar chart ── */}
            {mode === 'annual' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Monthly Revenue — {year}</h3>
                    <div className="space-y-2">
                        {monthlyTrend.map(m => (
                            <div key={m.month} className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-400 w-7 shrink-0 text-right">
                                    {m.month}
                                </span>
                                <div className="flex-1 relative h-8 bg-gray-50 rounded-lg overflow-hidden">
                                    {/* billed bar */}
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-100 rounded-lg transition-all duration-500"
                                        style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                                    />
                                    {/* collected bar */}
                                    <div
                                        className="absolute inset-y-0 left-0 bg-indigo-500 rounded-lg transition-all duration-500"
                                        style={{ width: `${(m.collected / maxRevenue) * 100}%` }}
                                    />
                                    {m.bookings > 0 && (
                                        <span className="absolute inset-0 flex items-center justify-end pr-2
                                                         text-xs font-semibold text-gray-600 z-10">
                                            {m.bookings} {m.bookings === 1 ? 'booking' : 'bookings'} &nbsp;·&nbsp; {fmtRs(m.revenue)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-5 mt-3 pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-3 h-2 bg-indigo-100 rounded inline-block" />
                            Total Billed
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-3 h-2 bg-indigo-500 rounded inline-block" />
                            Collected
                        </span>
                    </div>
                </div>
            )}

            {/* ── Event type breakdown ── */}
            {stats.topTypes.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">
                        Event Types — {periodLabel}
                    </h3>
                    <div className="space-y-3">
                        {stats.topTypes.map(([type, count], idx) => {
                            const pct = stats.active > 0 ? Math.round((count / stats.active) * 100) : 0
                            const palette = [
                                'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
                                'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500',
                                'bg-rose-500', 'bg-pink-500',
                            ]
                            return (
                                <div key={type}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm text-gray-700 font-medium">{type}</span>
                                        <span className="text-xs font-semibold text-gray-400">
                                            {count} event{count !== 1 ? 's' : ''} · {pct}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${palette[idx % palette.length]}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Bottom trio: Food / Booking status / Payment status ── */}
            {stats.active > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    {/* Food type */}
                    <MiniCard title="Food Type">
                        <PieBar label="Veg" count={stats.veg} total={stats.active} color="bg-emerald-500" />
                        <PieBar label="Non-Veg" count={stats.nonveg} total={stats.active} color="bg-rose-500" />
                    </MiniCard>

                    {/* Booking status */}
                    <MiniCard title="Booking Status">
                        <PieBar label="Confirmed" count={stats.confirmed} total={stats.total} color="bg-indigo-500" />
                        <PieBar label="Tentative" count={stats.tentative} total={stats.total} color="bg-amber-400" />
                        <PieBar label="Cancelled" count={stats.cancelled} total={stats.total} color="bg-rose-400" />
                    </MiniCard>

                    {/* Payment status */}
                    <MiniCard title="Payment Status">
                        {Object.entries(stats.psByStatus)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([status, count]) => {
                                const colors = {
                                    PAID: 'bg-emerald-500', PARTIAL: 'bg-amber-400',
                                    PENDING: 'bg-indigo-400', OVERDUE: 'bg-rose-500',
                                }
                                return (
                                    <PieBar
                                        key={status}
                                        label={status.charAt(0) + status.slice(1).toLowerCase()}
                                        count={count}
                                        total={stats.active}
                                        color={colors[status] || 'bg-gray-400'}
                                    />
                                )
                            })}
                    </MiniCard>
                </div>
            )}

            {/* ── Empty state ── */}
            {stats.total === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <div className="text-5xl mb-4">📊</div>
                    <div className="font-semibold text-gray-500 text-base">No bookings in this period</div>
                    <div className="text-sm mt-1">Try a different month or year</div>
                </div>
            )}
        </div>
    )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, bg }) {
    return (
        <div className={`bg-gradient-to-br ${bg} rounded-2xl p-4 text-white shadow-sm`}>
            <div className="text-xl font-extrabold tracking-tight">{value}</div>
            <div className="text-xs font-semibold opacity-90 mt-0.5">{label}</div>
            <div className="text-xs opacity-70 mt-1">{sub}</div>
        </div>
    )
}

function MiniCard({ title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-2.5">{children}</div>
        </div>
    )
}

function PieBar({ label, count, total, color }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600 font-medium">{label}</span>
                <span className="text-xs font-semibold text-gray-500">{count} ({pct}%)</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
