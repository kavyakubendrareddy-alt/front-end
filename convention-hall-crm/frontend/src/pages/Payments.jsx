import { useState, useEffect } from 'react'
import { bookingApi } from '../api/bookingApi'
import StatusBadge from '../components/StatusBadge'
import WhatsAppButton from '../components/WhatsAppButton'
import { format } from 'date-fns'
import { formatTime12 } from '../components/TimePicker'

const TABS = ['ALL', 'OVERDUE', 'PARTIAL', 'PENDING', 'PAID']

const TAB_STYLES = {
    ALL: 'bg-gray-800 text-white',
    OVERDUE: 'bg-red-600 text-white',
    PARTIAL: 'bg-amber-500 text-white',
    PENDING: 'bg-indigo-600 text-white',
    PAID: 'bg-emerald-600 text-white',
}

export default function Payments() {
    const [bookings, setBookings] = useState([])
    const [activeTab, setActiveTab] = useState('ALL')
    const [recordModal, setRecordModal] = useState(null) // booking being paid
    const [payAmount, setPayAmount] = useState('')
    const [payMethod, setPayMethod] = useState('Cash')
    const [payDate, setPayDate] = useState('')
    const [payNote, setPayNote] = useState('')
    const [payScreenshot, setPayScreenshot] = useState(null)
    const [saving, setSaving] = useState(false)

    // Convert uploaded file to base64 data URL
    const handleScreenshotChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) { setPayScreenshot(null); return }
        const reader = new FileReader()
        reader.onload = (ev) => setPayScreenshot(ev.target.result)
        reader.readAsDataURL(file)
    }

    const reload = () => bookingApi.getAll().then(setBookings)
    useEffect(() => { reload() }, [])

    // ── Filtered list ──
    const filtered = activeTab === 'ALL'
        ? bookings
        : bookings.filter(b => b.paymentStatus === activeTab)

    // ── Summary totals ──
    const totalCollected = bookings.reduce((s, b) => s + parseFloat(b.advancePaid || 0), 0)
    const totalOutstanding = bookings
        .filter(b => b.paymentStatus !== 'PAID')
        .reduce((s, b) => s + (parseFloat(b.totalAmount || 0) - parseFloat(b.advancePaid || 0)), 0)

    // ── Record payment ──
    const openRecordPayment = (b) => {
        setRecordModal(b)
        setPayAmount('')
        setPayMethod('Cash')
        setPayDate(new Date().toISOString().split('T')[0])
        setPayNote('')
        setPayScreenshot(null)
    }

    const handleRecordPayment = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) return
        setSaving(true)
        try {
            await bookingApi.recordPayment(recordModal.id, {
                amount: parseFloat(payAmount),
                method: payMethod,
                date: payDate,
                note: payNote,
                ...(payScreenshot ? { screenshot: payScreenshot } : {}),
            })
            setRecordModal(null)
            reload()
        } finally {
            setSaving(false)
        }
    }

    // ─────────────────────────────────────────────
    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 md:pb-8">
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-sm text-gray-500 mt-0.5">Track all payment statuses</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200
                                rounded-2xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">
                        Total Collected
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-800">
                        ₹{totalCollected.toLocaleString('en-IN')}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-white border border-red-200
                                rounded-2xl p-4 shadow-sm">
                    <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">
                        Outstanding
                    </div>
                    <div className="text-2xl font-extrabold text-red-800">
                        ₹{totalOutstanding.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
                {TABS.map(tab => {
                    const count = tab === 'ALL'
                        ? bookings.length
                        : bookings.filter(b => b.paymentStatus === tab).length
                    const isActive = activeTab === tab
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap
                                        transition-all shadow-sm border
                                        ${isActive
                                    ? `${TAB_STYLES[tab]} border-transparent shadow-md`
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {tab} <span className="ml-0.5 opacity-80">({count})</span>
                        </button>
                    )
                })}
            </div>

            {/* Payment Cards */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <div className="text-4xl mb-2">💳</div>
                        <div className="text-sm">No bookings in this category</div>
                    </div>
                )}

                {filtered.map(b => {
                    const remaining = parseFloat(b.totalAmount || 0) - parseFloat(b.advancePaid || 0)
                    const isOverdue = b.paymentStatus === 'OVERDUE'

                    const dateStr = b.eventEndDate && b.eventEndDate !== b.eventDate
                        ? `${format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(b.eventEndDate + 'T00:00:00'), 'dd MMM yyyy')}`
                        : format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM yyyy')

                    return (
                        <div
                            key={b.id}
                            className={`rounded-2xl shadow-sm border transition-all hover:shadow-md
                                        ${isOverdue
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-white border-gray-100'}`}
                        >
                            {/* Header */}
                            <div className={`px-4 pt-4 pb-3 border-b
                                             ${isOverdue ? 'border-red-100' : 'border-gray-50'}`}>
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <div className="font-bold text-gray-900 truncate">{b.customerName}</div>
                                        <div className="text-sm text-gray-500">{b.phoneNumber}</div>
                                    </div>
                                    <StatusBadge status={b.paymentStatus} type="payment" />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="px-4 py-3">
                                <div className="text-sm text-gray-600 mb-3">
                                    🎉 {b.eventType} · 📅 {dateStr}
                                    {b.paymentDueDate && remaining > 0 && (
                                        <span className={`ml-2 text-xs font-semibold
                                                          ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                            · Due: {format(new Date(b.paymentDueDate + 'T00:00:00'), 'dd MMM yyyy')}
                                        </span>
                                    )}
                                </div>

                                {/* Amount cards */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <AmountCard
                                        label="Total"
                                        value={parseFloat(b.totalAmount || 0)}
                                        color="text-gray-800"
                                    />
                                    <AmountCard
                                        label="Paid"
                                        value={parseFloat(b.advancePaid || 0)}
                                        color="text-emerald-600"
                                        bg="bg-emerald-50"
                                    />
                                    <AmountCard
                                        label="Balance"
                                        value={remaining}
                                        color={remaining > 0 ? 'text-red-600' : 'text-gray-400'}
                                        bg={remaining > 0 ? 'bg-red-50' : 'bg-gray-50'}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 flex-wrap">
                                    {b.paymentStatus !== 'PAID' && (
                                        <button
                                            onClick={() => openRecordPayment(b)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white
                                                       px-4 py-1.5 rounded-lg text-sm font-semibold
                                                       transition-colors"
                                        >
                                            + Record Payment
                                        </button>
                                    )}
                                    {b.paymentStatus !== 'PAID' && (
                                        <WhatsAppButton booking={b} mode="reminder" label="Send Reminder" />
                                    )}
                                </div>

                                {/* Payment history timeline */}
                                {b.paymentHistory && (() => {
                                    try {
                                        const hist = JSON.parse(b.paymentHistory)
                                        if (!hist.length) return null
                                        return (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="text-xs font-bold text-gray-400 mb-2">PAYMENT HISTORY</div>
                                                <div className="space-y-1.5">
                                                    {hist.map((p, i) => (
                                                        <div key={i} className="flex items-center justify-between
                                                                                text-xs text-gray-600 bg-gray-50
                                                                                rounded-lg px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                <span className="font-medium">
                                                                    {p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                                </span>
                                                                <span className="text-gray-400">· {p.method || 'Cash'}</span>
                                                                {p.note && <span className="text-gray-400 truncate max-w-[100px]">· {p.note}</span>}
                                                            </div>
                                                            <span className="font-bold text-emerald-600">
                                                                ₹{parseFloat(p.amount || 0).toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    } catch { return null }
                                })()}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Record Payment Modal ── */}
            {recordModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-0.5">Record Payment</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {recordModal.customerName} &middot;
                            Balance: ₹{(parseFloat(recordModal.totalAmount || 0) - parseFloat(recordModal.advancePaid || 0)).toLocaleString('en-IN')}
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount Received (₹) *</label>
                                <input type="number" min="0" step="0.01"
                                    value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g. 15000"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                                <div className="flex gap-2">
                                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => (
                                        <button key={m} type="button"
                                            onClick={() => setPayMethod(m)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all
                                                        ${payMethod === m
                                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                                    : 'bg-white text-gray-600 border-gray-200'}`}
                                        >{m}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
                                    <input type="date" value={payDate}
                                        onChange={e => setPayDate(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Note (optional)</label>
                                    <input type="text" value={payNote}
                                        onChange={e => setPayNote(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                                                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Balance"
                                    />
                                </div>
                            </div>
                            {/* Screenshot upload */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Payment Screenshot (optional)
                                </label>
                                <input type="file" accept="image/*"
                                    onChange={handleScreenshotChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3
                                               file:rounded-lg file:border-0 file:text-xs file:font-semibold
                                               file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {payScreenshot && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img src={payScreenshot} alt="Preview"
                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                        <button type="button" onClick={() => setPayScreenshot(null)}
                                            className="text-xs text-red-500 hover:text-red-700">
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setRecordModal(null)}
                                className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5
                                           rounded-xl font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleRecordPayment} disabled={saving || !payAmount}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5
                                           rounded-xl font-semibold disabled:opacity-60">
                                {saving ? 'Saving…' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function AmountCard({ label, value, color, bg = 'bg-gray-50' }) {
    return (
        <div className={`${bg} rounded-xl px-3 py-2.5 text-center`}>
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className={`text-sm font-bold ${color}`}>
                ₹{value.toLocaleString('en-IN')}
            </div>
        </div>
    )
}



