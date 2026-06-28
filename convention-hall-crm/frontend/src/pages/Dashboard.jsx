import { useEffect, useState } from 'react'
import { bookingApi } from '../api/bookingApi'
import StatusBadge from '../components/StatusBadge'
import WhatsAppButton from '../components/WhatsAppButton'
import { format } from 'date-fns'
import { BookOpen, IndianRupee, AlertCircle, CalendarDays } from 'lucide-react'
import { formatTime12 } from '../components/TimePicker'

export default function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        bookingApi.getDashboard()
            .then(setStats)
            .catch(() => setError('Could not load dashboard. Is the backend running?'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <Spinner />
    if (error) return <ErrorMsg msg={error} />

    // Group upcoming events by month
    const grouped = (stats?.upcomingEvents ?? []).reduce((acc, b) => {
        const key = format(new Date(b.eventDate + 'T00:00:00'), 'MMMM yyyy')
        if (!acc[key]) acc[key] = []
        acc[key].push(b)
        return acc
    }, {})

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 md:pb-8">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {format(new Date(), 'EEEE, dd MMMM yyyy')}
                </p>
            </div>

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                    icon={<BookOpen size={22} className="text-indigo-500" />}
                    label="This Month"
                    value={stats?.totalBookingsThisMonth ?? 0}
                    sub="bookings"
                    accent="border-indigo-400"
                    bg="from-indigo-50"
                />
                <StatCard
                    icon={<IndianRupee size={22} className="text-amber-500" />}
                    label="Pending"
                    value={stats?.pendingPayments ?? 0}
                    sub="payments"
                    accent="border-amber-400"
                    bg="from-amber-50"
                />
                <StatCard
                    icon={<AlertCircle size={22} className="text-red-500" />}
                    label="Overdue"
                    value={stats?.overduePayments ?? 0}
                    sub="payments"
                    accent="border-red-400"
                    bg="from-red-50"
                />
                <StatCard
                    icon={<CalendarDays size={22} className="text-emerald-500" />}
                    label="Upcoming"
                    value={stats?.upcomingEvents?.length ?? 0}
                    sub="events"
                    accent="border-emerald-400"
                    bg="from-emerald-50"
                />
            </div>

            {/* ── Follow-ups ── */}
            {stats?.todayFollowUps?.length > 0 && (
                <section className="mb-6">
                    <SectionHeader icon="⏰" title="Follow-ups Needed" sub="Unpaid — event within 7 days" />
                    <div className="space-y-3">
                        {stats.todayFollowUps.map(b => (
                            <FollowUpCard key={b.id} booking={b} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Daily Payment Reminders ── */}
            {stats?.pendingReminders?.length > 0 && (
                <section className="mb-6">
                    <SectionHeader
                        icon="🔔"
                        title="Payment Reminders"
                        sub={`${stats.pendingReminders.length} booking${stats.pendingReminders.length > 1 ? 's' : ''} with outstanding balance`}
                    />
                    <div className="space-y-2">
                        {stats.pendingReminders.map(b => (
                            <FollowUpCard key={b.id} booking={b} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── Upcoming Events grouped by month ── */}
            <section className="mb-6">
                <SectionHeader icon="📅" title="Upcoming Events" sub="All confirmed & tentative" />
                {Object.keys(grouped).length === 0
                    ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-4xl mb-2">🗓️</div>
                            <div className="text-sm">No upcoming events</div>
                        </div>
                    )
                    : Object.entries(grouped).map(([month, events]) => (
                        <div key={month} className="mb-5">
                            {/* Month header */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px flex-1 bg-gradient-to-r from-indigo-200 to-transparent" />
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50
                                                 px-3 py-1 rounded-full border border-indigo-100">
                                    {month}
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-l from-indigo-200 to-transparent" />
                            </div>
                            <div className="space-y-2">
                                {events.map(b => (
                                    <UpcomingCard key={b.id} booking={b} />
                                ))}
                            </div>
                        </div>
                    ))
                }
            </section>

            {/* ── Past Events ── */}
            {stats?.pastEvents?.length > 0 && (
                <section className="mb-6">
                    <SectionHeader icon="🏛️" title="Past Events" sub="Completed events" />
                    <div className="space-y-2">
                        {stats.pastEvents.map(b => (
                            <PastEventCard key={b.id} booking={b} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SectionHeader({ icon, title, sub }) {
    return (
        <div className="flex items-baseline gap-2 mb-3">
            <span>{icon}</span>
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
    )
}

function StatCard({ icon, label, value, sub, accent, bg }) {
    return (
        <div className={`bg-gradient-to-br ${bg} to-white rounded-2xl p-4
                         shadow-sm border-l-4 ${accent} border border-gray-100`}>
            <div className="mb-2">{icon}</div>
            <div className="text-2xl font-extrabold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-snug">
                <span className="font-semibold text-gray-700">{label}</span>
                {sub && <><br />{sub}</>}
            </div>
        </div>
    )
}

function FollowUpCard({ booking }) {
    const remaining = parseFloat(booking.totalAmount || 0) - parseFloat(booking.advancePaid || 0)
    const daysLeft = Math.ceil(
        (new Date(booking.eventDate + 'T00:00:00') - new Date()) / 86_400_000,
    )
    const urgencyClass = daysLeft <= 1
        ? 'bg-red-50 border-red-300'
        : daysLeft <= 3
            ? 'bg-orange-50 border-orange-200'
            : 'bg-amber-50 border-amber-200'

    const dateStr = booking.eventEndDate && booking.eventEndDate !== booking.eventDate
        ? `${format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(booking.eventEndDate + 'T00:00:00'), 'dd MMM yyyy')}`
        : format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM yyyy')

    return (
        <div className={`border-2 rounded-2xl p-4 ${urgencyClass}`}>
            <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                    <div className="font-bold text-gray-900 truncate">{booking.customerName}</div>
                    <div className="text-sm text-gray-600 mt-0.5">
                        {booking.eventType} · {dateStr}
                    </div>
                    <div className="text-sm font-semibold text-red-600 mt-1">
                        ₹{remaining.toLocaleString('en-IN')} pending ·{' '}
                        {daysLeft <= 0 ? '🔴 Event today!' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <WhatsAppButton booking={booking} mode="reminder" label="Remind" />
                </div>
            </div>
        </div>
    )
}

function UpcomingCard({ booking }) {
    const dateStr = booking.eventEndDate && booking.eventEndDate !== booking.eventDate
        ? `${format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(booking.eventEndDate + 'T00:00:00'), 'dd MMM')}`
        : format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM')

    return (
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100
                        flex justify-between items-center gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 min-w-0">
                {/* Day badge */}
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex flex-col
                                items-center justify-center border border-indigo-100">
                    <span className="text-xs font-bold text-indigo-700 leading-none">
                        {format(new Date(booking.eventDate + 'T00:00:00'), 'dd')}
                    </span>
                    <span className="text-[9px] text-indigo-500 font-semibold">
                        {format(new Date(booking.eventDate + 'T00:00:00'), 'MMM').toUpperCase()}
                    </span>
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{booking.customerName}</div>
                    <div className="text-xs text-gray-500">
                        {booking.eventType}
                        {booking.checkInTime && (
                            <> · {formatTime12(booking.checkInTime)} – {formatTime12(booking.checkOutTime)}</>
                        )}
                    </div>
                </div>
            </div>
            <StatusBadge status={booking.paymentStatus} type="payment" />
        </div>
    )
}

function PastEventCard({ booking }) {
    const dateStr = booking.eventEndDate && booking.eventEndDate !== booking.eventDate
        ? `${format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(booking.eventEndDate + 'T00:00:00'), 'dd MMM yyyy')}`
        : format(new Date(booking.eventDate + 'T00:00:00'), 'dd MMM yyyy')

    return (
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100
                        flex justify-between items-center gap-3 hover:shadow-md transition-shadow
                        opacity-80">
            <div className="flex items-center gap-3 min-w-0">
                {/* Day badge – slate tone for past */}
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-xl flex flex-col
                                items-center justify-center border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 leading-none">
                        {format(new Date(booking.eventDate + 'T00:00:00'), 'dd')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                        {format(new Date(booking.eventDate + 'T00:00:00'), 'MMM').toUpperCase()}
                    </span>
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-gray-700 truncate">{booking.customerName}</div>
                    <div className="text-xs text-gray-400">{booking.eventType} · {dateStr}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={booking.paymentStatus} type="payment" />
                <WhatsAppButton booking={booking} mode="thankyou" label="Thank You" />
            </div>
        </div>
    )
}

function Spinner() {
    return (
        <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-sm">Loading…</div>
            </div>
        </div>
    )
}

function ErrorMsg({ msg }) {
    return (
        <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {msg}
        </div>
    )
}



