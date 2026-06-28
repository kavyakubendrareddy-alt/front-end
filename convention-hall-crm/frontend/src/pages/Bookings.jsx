import { useState, useEffect, useCallback } from 'react'
import { bookingApi } from '../api/bookingApi'
import StatusBadge from '../components/StatusBadge'
import WhatsAppButton from '../components/WhatsAppButton'
import TimePicker, { formatTime12 } from '../components/TimePicker'
import DateRangePicker from '../components/DateRangePicker'
import { format } from 'date-fns'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const EVENT_TYPES = [
    'Wedding', 'Reception', 'Birthday', 'Corporate Event',
    'Conference', 'Puja / Religious', 'Anniversary', 'Engagement',
    'Naming Ceremony', 'Exhibition', 'Other',
]

const EMPTY_FORM = {
    customerName: '',
    phoneNumber: '',
    eventType: '',
    eventTypeOther: '',
    eventDate: '',
    eventEndDate: '',
    foodType: 'VEG',
    totalAmount: '',
    advancePaid: '',
    paymentDueDate: '',
    checkInTime: '06:00',
    checkOutTime: '17:30',
    // Amenities
    villaRooms: 0,
    diningHallIncluded: true,
    vesselsIncluded: true,
    // Terms toggles
    electricityIncluded: true,
    labourIncluded: false,
    dieselIncluded: false,
    cleaningIncluded: false,
    acHours: 3,
    // Notes
    notes: '',
    bookingStatus: 'CONFIRMED',
    // Expenses (filled after event)
    expenseLabour: '',
    expenseDiesel: '',
    expenseCleaning: '',
    expenseElectricity: '',
    expenseOther: '',
    // Cancellation
    cancellationReason: '',
    // Installments (edit mode only)
    installment1Amount: '',
    installment1Paid: false,
    installment2Amount: '',
    installment2Paid: false,
}

const INPUT =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function Bookings() {
    const [bookings, setBookings] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [formError, setFormError] = useState(null)
    const [fieldErrors, setFieldErrors] = useState({})
    const [successMsg, setSuccessMsg] = useState(null)
    const [editingScreenshots, setEditingScreenshots] = useState([])

    const loadAll = useCallback(() => bookingApi.getAll().then(setBookings), [])
    useEffect(() => { loadAll() }, [loadAll])

    // ── Search ──
    const handleSearch = (e) => {
        const q = e.target.value
        setSearchQuery(q)
        if (q.trim().length >= 2) bookingApi.search(q).then(setBookings)
        else if (q === '') loadAll()
    }

    // ── Validate ──
    const validate = (f) => {
        const errs = {}
        if (!f.customerName.trim()) errs.customerName = 'Customer name is required.'
        if (!f.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required.'
        else if (!/^[\d+\-\s]{7,13}$/.test(f.phoneNumber.trim()))
            errs.phoneNumber = 'Enter a valid phone number.'
        if (!f.eventType) errs.eventType = 'Please select an event type.'
        if (f.eventType === 'Other' && !f.eventTypeOther.trim())
            errs.eventTypeOther = 'Please specify the event type.'
        if (!f.eventDate) errs.eventDate = 'Event date is required.'
        if (!f.totalAmount || parseFloat(f.totalAmount) <= 0)
            errs.totalAmount = 'Total amount is required.'
        const adv = parseFloat(f.advancePaid || 0)
        const tot = parseFloat(f.totalAmount || 0)
        if (tot > 0 && adv > tot)
            errs.advancePaid = `Advance paid (₹${adv.toLocaleString('en-IN')}) cannot exceed the total rent (₹${tot.toLocaleString('en-IN')}).`
        return errs
    }

    // Auto-scroll to the first error section after React re-renders
    useEffect(() => {
        if (!showForm || Object.keys(fieldErrors).length === 0) return
        const sectionMap = {
            customerName: 'section-customer',
            phoneNumber: 'section-customer',
            eventType: 'section-customer',
            eventTypeOther: 'section-customer',
            eventDate: 'section-dates',
            totalAmount: 'section-payment',
            advancePaid: 'section-payment',
        }
        const firstKey = Object.keys(fieldErrors)[0]
        const sectionId = sectionMap[firstKey]
        if (sectionId) {
            const el = document.getElementById(sectionId)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [fieldErrors, showForm])

    // ── Open create ──
    const openCreate = () => {
        setForm(EMPTY_FORM)
        setEditingId(null)
        setFormError(null)
        setFieldErrors({})
        setShowForm(true)
    }

    // ── Open edit ──
    const openEdit = (b) => {
        const isOther = !EVENT_TYPES.slice(0, -1).includes(b.eventType)
        setForm({
            customerName: b.customerName ?? '',
            phoneNumber: b.phoneNumber ?? '',
            eventType: isOther ? 'Other' : (b.eventType ?? ''),
            eventTypeOther: isOther ? (b.eventType ?? '') : '',
            eventDate: b.eventDate ?? '',
            eventEndDate: b.eventEndDate ?? '',
            foodType: b.foodType ?? 'VEG',
            totalAmount: b.totalAmount ?? '',
            advancePaid: b.advancePaid ?? '',
            paymentDueDate: b.paymentDueDate ?? '',
            checkInTime: b.checkInTime ?? '06:00',
            checkOutTime: b.checkOutTime ?? '17:30',
            villaRooms: b.villaRooms ?? 0,
            diningHallIncluded: b.diningHallIncluded ?? true,
            vesselsIncluded: b.vesselsIncluded ?? true,
            electricityIncluded: b.electricityIncluded ?? true,
            labourIncluded: b.labourIncluded ?? false,
            dieselIncluded: b.dieselIncluded ?? false,
            cleaningIncluded: b.cleaningIncluded ?? false,
            acHours: b.acHours ?? 3,
            notes: b.notes ?? '',
            bookingStatus: b.bookingStatus ?? 'CONFIRMED',
            expenseLabour: b.expenseLabour ?? '',
            expenseDiesel: b.expenseDiesel ?? '',
            expenseCleaning: b.expenseCleaning ?? '',
            expenseElectricity: b.expenseElectricity ?? '',
            expenseOther: b.expenseOther ?? '',
            cancellationReason: b.cancellationReason ?? '',
            // Installments — pre-populate from paymentHistory if already recorded
            ...((() => {
                try {
                    const hist = JSON.parse(b.paymentHistory || '[]')
                    const inst1 = hist.find(h => (h.note || '').toLowerCase().includes('1st'))
                    const inst2 = hist.find(h => (h.note || '').toLowerCase().includes('2nd'))
                    return {
                        installment1Amount: inst1 ? String(inst1.amount) : '',
                        installment1Paid: !!inst1,
                        installment2Amount: inst2 ? String(inst2.amount) : '',
                        installment2Paid: !!inst2,
                    }
                } catch { return { installment1Amount: '', installment1Paid: false, installment2Amount: '', installment2Paid: false } }
            })()),
        })
        // Parse existing payment screenshots for display
        try { setEditingScreenshots(JSON.parse(b.paymentScreenshots || '[]')) } catch { setEditingScreenshots([]) }
        setEditingId(b.id)
        setFormError(null)
        setFieldErrors({})
        setShowForm(true)
    }

    // ── Submit ──
    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate(form)
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs)
            return
        }
        setFieldErrors({})
        setSaving(true)
        setFormError(null)
        try {
            const finalType = form.eventType === 'Other' ? form.eventTypeOther : form.eventType
            const payload = {
                customerName: form.customerName,
                phoneNumber: form.phoneNumber,
                eventType: finalType,
                eventDate: form.eventDate,
                eventEndDate: form.eventEndDate || null,
                foodType: form.foodType,
                totalAmount: parseFloat(form.totalAmount),
                advancePaid: form.advancePaid ? parseFloat(form.advancePaid) : 0,
                paymentDueDate: form.paymentDueDate || null,
                checkInTime: form.checkInTime || null,
                checkOutTime: form.checkOutTime || null,
                villaRooms: parseInt(form.villaRooms) || 0,
                diningHallIncluded: form.diningHallIncluded,
                vesselsIncluded: form.vesselsIncluded,
                electricityIncluded: form.electricityIncluded,
                labourIncluded: form.labourIncluded,
                dieselIncluded: form.dieselIncluded,
                cleaningIncluded: form.cleaningIncluded,
                acHours: parseInt(form.acHours) || 3,
                notes: form.notes,
                bookingStatus: form.bookingStatus,
                cancellationReason: form.cancellationReason || null,
                expenseLabour: form.expenseLabour ? parseFloat(form.expenseLabour) : null,
                expenseDiesel: form.expenseDiesel ? parseFloat(form.expenseDiesel) : null,
                expenseCleaning: form.expenseCleaning ? parseFloat(form.expenseCleaning) : null,
                expenseElectricity: form.expenseElectricity ? parseFloat(form.expenseElectricity) : null,
                expenseOther: form.expenseOther ? parseFloat(form.expenseOther) : null,
            }
            if (editingId) await bookingApi.update(editingId, payload)
            else await bookingApi.create(payload)
            setShowForm(false)
            loadAll()
            setSuccessMsg(editingId ? 'Booking updated successfully.' : 'Booking confirmed!')
            setTimeout(() => setSuccessMsg(null), 4000)
        } catch (err) {
            setFormError(err.response?.data?.error ?? 'Something went wrong. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // ── Delete ──
    const handleDelete = async (id) => {
        await bookingApi.delete(id)
        setDeleteConfirm(null)
        loadAll()
    }

    // ── Derived values ──
    const f = form
    const remaining = f.totalAmount
        ? Math.max(0, parseFloat(f.totalAmount || 0) - parseFloat(f.advancePaid || 0))
        : 0
    const suggestedTotal = 35000 + (parseInt(f.villaRooms || 0) * 1500)

    // Dates already booked by other bookings (used to highlight the calendar)
    const bookedIntervals = bookings
        .filter(b => b.bookingStatus !== 'CANCELLED' && b.id !== editingId)
        .map(b => ({ startDate: b.eventDate, endDate: b.eventEndDate || b.eventDate }))

    // Auto-calc payment due date when event date changes
    const handleEventDateRangeChange = (startDate, endDate) => {
        setForm(p => {
            const updated = { ...p, eventDate: startDate, eventEndDate: endDate }
            if (startDate) {
                const due = new Date(startDate + 'T00:00:00')
                due.setDate(due.getDate() - 5)
                updated.paymentDueDate = due.toISOString().split('T')[0]
            }
            return updated
        })
    }

    // Veg / Non-veg toggle handler
    const handleFoodTypeChange = (type) => {
        setForm(p => ({
            ...p,
            foodType: type,
            diningHallIncluded: type === 'VEG',
            vesselsIncluded: type === 'VEG',
        }))
    }

    // ─────────────────────────────────────────────
    return (
        <div className="p-4 max-w-4xl mx-auto pb-24 md:pb-8">

            {/* Success toast */}
            {successMsg && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                                bg-green-600 text-white px-6 py-3 rounded-2xl shadow-xl
                                flex items-center gap-2 text-sm font-semibold">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {successMsg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{bookings.length} total bookings</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                               text-white px-4 py-2.5 rounded-xl text-sm font-semibold
                               shadow-sm transition-all hover:shadow-md"
                >
                    <Plus size={18} /> New Booking
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or phone…"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                />
            </div>

            {/* List */}
            <div className="space-y-3">
                {bookings.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <div className="text-5xl mb-3">📋</div>
                        <div className="font-medium text-gray-500">No bookings yet</div>
                        <div className="text-sm mt-1">Tap "New Booking" to get started</div>
                    </div>
                )}
                {bookings.map(b => (
                    <BookingCard
                        key={b.id}
                        booking={b}
                        onEdit={() => openEdit(b)}
                        onDelete={() => setDeleteConfirm(b.id)}
                    />
                ))}
            </div>

            {/* ── Booking Form Modal ── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
                    <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl
                                    max-h-[95vh] overflow-y-auto shadow-2xl">

                        {/* Modal header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4
                                        flex items-center justify-between z-10 rounded-t-2xl">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingId ? 'Edit Booking' : 'New Booking'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">NRK Function Hall</p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-5">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl
                                                px-4 py-3 text-red-700 text-sm">
                                    {formError}
                                </div>
                            )}

                            {/* ─── Customer & Event Info ─── */}
                            <Section id="section-customer" title="Customer & Event">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Customer Name *">
                                        <input
                                            value={f.customerName}
                                            onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                                            className={`${INPUT} ${fieldErrors.customerName ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                            placeholder="Full name"
                                        />
                                        {fieldErrors.customerName && <p className="text-xs text-red-600 mt-1">{fieldErrors.customerName}</p>}
                                    </Field>

                                    <Field label="Phone Number *">
                                        <input
                                            value={f.phoneNumber}
                                            onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                            className={`${INPUT} ${fieldErrors.phoneNumber ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                            placeholder="10-digit mobile number"
                                            maxLength={13}
                                        />
                                        {fieldErrors.phoneNumber && <p className="text-xs text-red-600 mt-1">{fieldErrors.phoneNumber}</p>}
                                    </Field>

                                    <Field label="Event Type *">
                                        <select
                                            value={f.eventType}
                                            onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}
                                            className={`${INPUT} ${fieldErrors.eventType ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                        >
                                            <option value="">Select event type</option>
                                            {EVENT_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        {fieldErrors.eventType && <p className="text-xs text-red-600 mt-1">{fieldErrors.eventType}</p>}
                                    </Field>

                                    {f.eventType === 'Other' && (
                                        <Field label="Specify Event Type *">
                                            <input
                                                value={f.eventTypeOther}
                                                onChange={e => setForm(p => ({ ...p, eventTypeOther: e.target.value }))}
                                                className={`${INPUT} ${fieldErrors.eventTypeOther ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                                placeholder="e.g. Reunion, Farewell…"
                                            />
                                            {fieldErrors.eventTypeOther && <p className="text-xs text-red-600 mt-1">{fieldErrors.eventTypeOther}</p>}
                                        </Field>
                                    )}

                                    <Field label="Booking Status">
                                        <select
                                            value={f.bookingStatus}
                                            onChange={e => setForm(p => ({ ...p, bookingStatus: e.target.value }))}
                                            className={INPUT}
                                        >
                                            <option value="CONFIRMED">Confirmed</option>
                                            <option value="TENTATIVE">Tentative</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </Field>

                                    {/* Cancellation reason — shown only when status is CANCELLED */}
                                    {f.bookingStatus === 'CANCELLED' && (
                                        <div className="md:col-span-2">
                                            <Field label="Cancellation Reason">
                                                <textarea
                                                    value={f.cancellationReason}
                                                    onChange={e => setForm(p => ({ ...p, cancellationReason: e.target.value }))}
                                                    className={`${INPUT} h-16 resize-none`}
                                                    placeholder="Why was this booking cancelled?"
                                                />
                                            </Field>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* ─── Dates & Timings ─── */}
                            <Section id="section-dates" title="Dates & Timings">
                                <div className="space-y-4">
                                    <DateRangePicker
                                        startDate={f.eventDate}
                                        endDate={f.eventEndDate}
                                        onChange={({ startDate, endDate }) =>
                                            handleEventDateRangeChange(startDate, endDate)
                                        }
                                        error={fieldErrors.eventDate}
                                        bookedIntervals={bookedIntervals}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Check-in Time">
                                            <TimePicker
                                                value={f.checkInTime}
                                                onChange={v => setForm(p => ({ ...p, checkInTime: v }))}
                                            />
                                        </Field>

                                        <Field label="Check-out Time">
                                            <TimePicker
                                                value={f.checkOutTime}
                                                onChange={v => setForm(p => ({ ...p, checkOutTime: v }))}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            </Section>

                            {/* ─── Amenities ─── */}
                            <Section id="section-amenities" title="Amenities">
                                {/* Veg / Non-Veg */}
                                <div className="flex gap-2 mb-4">
                                    {['VEG', 'NONVEG'].map(type => (
                                        <button
                                            key={type} type="button"
                                            onClick={() => handleFoodTypeChange(type)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold
                                                        border-2 transition-all ${f.foodType === type
                                                    ? type === 'VEG'
                                                        ? 'bg-green-600 text-white border-green-600'
                                                        : 'bg-red-600 text-white border-red-600'
                                                    : type === 'VEG'
                                                        ? 'bg-white text-green-700 border-green-200 hover:border-green-400'
                                                        : 'bg-white text-red-700 border-red-200 hover:border-red-400'
                                                }`}
                                        >
                                            {type === 'VEG' ? '🥗 Veg Event' : '🍗 Non-Veg Event'}
                                        </button>
                                    ))}
                                </div>

                                {/* Spaces */}
                                <div className="space-y-2 mb-4">
                                    <AmenityRow label="Function Hall" always />
                                    <AmenityRow label="2 Complimentary Rooms" always />
                                    <AmenityRow
                                        label="Dining Hall"
                                        checked={f.diningHallIncluded}
                                        disabled={f.foodType === 'NONVEG'}
                                        onChange={v => setForm(p => ({ ...p, diningHallIncluded: v }))}
                                    />
                                    <AmenityRow
                                        label="Cooking Vessels"
                                        checked={f.vesselsIncluded}
                                        disabled={f.foodType === 'NONVEG'}
                                        onChange={v => setForm(p => ({ ...p, vesselsIncluded: v }))}
                                    />
                                </div>

                                {/* Villa rooms */}
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-indigo-800">
                                            Villa 1st Floor Rooms
                                        </span>
                                        <span className="text-xs font-semibold text-indigo-600">
                                            {f.villaRooms > 0
                                                ? `+₹${(f.villaRooms * 1500).toLocaleString('en-IN')}`
                                                : 'Not included'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[0, 1, 2, 3].map(n => (
                                            <button
                                                key={n} type="button"
                                                onClick={() => setForm(p => ({ ...p, villaRooms: n }))}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold
                                                            border-2 transition-all ${parseInt(f.villaRooms) === n
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                                    }`}
                                            >
                                                {n === 0 ? 'None' : `${n}rm`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-indigo-500 mt-1.5">
                                        ₹1,500 per room · Suggested total: ₹{suggestedTotal.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </Section>

                            {/* ─── Terms & Conditions ─── */}
                            <Section id="section-terms" title="Terms & Conditions">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                    <TermToggle
                                        label="Electricity Bill"
                                        checked={f.electricityIncluded}
                                        onChange={v => setForm(p => ({ ...p, electricityIncluded: v }))}
                                    />
                                    <TermToggle
                                        label="Labour Charges"
                                        checked={f.labourIncluded}
                                        onChange={v => setForm(p => ({ ...p, labourIncluded: v }))}
                                    />
                                    <TermToggle
                                        label="Diesel / Generator"
                                        checked={f.dieselIncluded}
                                        onChange={v => setForm(p => ({ ...p, dieselIncluded: v }))}
                                    />
                                    <TermToggle
                                        label="Cleaning / Garbage"
                                        checked={f.cleaningIncluded}
                                        onChange={v => setForm(p => ({ ...p, cleaningIncluded: v }))}
                                    />
                                </div>

                                {/* AC Hours */}
                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        ❄️ AC Hours/Day
                                    </span>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3, 4, 6].map(h => (
                                            <button
                                                key={h} type="button"
                                                onClick={() => setForm(p => ({ ...p, acHours: h }))}
                                                className={`w-9 h-8 rounded-lg text-xs font-bold
                                                            border-2 transition-all ${parseInt(f.acHours) === h
                                                        ? 'bg-sky-500 text-white border-sky-500'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                                                    }`}
                                            >
                                                {h}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">hrs</span>
                                </div>
                            </Section>

                            {/* ─── Payment ─── */}
                            <Section id="section-payment" title="Payment">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Total Amount (₹) *">
                                        <input
                                            type="number" min="0" step="0.01" value={f.totalAmount}
                                            onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value }))}
                                            className={`${INPUT} ${fieldErrors.totalAmount ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                            placeholder="0.00"
                                        />
                                        <p className="text-xs text-indigo-500 mt-1">
                                            Suggested: ₹{suggestedTotal.toLocaleString('en-IN')}
                                            {parseInt(f.villaRooms) > 0
                                                ? ` (₹35,000 base + ${f.villaRooms} villa room${f.villaRooms > 1 ? 's' : ''})`
                                                : ' (base package)'}
                                        </p>
                                        {fieldErrors.totalAmount && <p className="text-xs text-red-600 mt-1">{fieldErrors.totalAmount}</p>}
                                    </Field>

                                    <Field label="Advance Paid (₹)">
                                        <input
                                            type="number" min="0" step="0.01" value={f.advancePaid}
                                            onChange={e => {
                                                const raw = e.target.value
                                                const val = parseFloat(raw) || 0
                                                const max = parseFloat(f.totalAmount || 0)
                                                setForm(p => ({ ...p, advancePaid: (max > 0 && val > max) ? String(max) : raw }))
                                            }}
                                            className={`${INPUT} ${fieldErrors.advancePaid ? 'border-red-400 ring-1 ring-red-300' : ''}`}
                                            placeholder="0.00"
                                        />
                                        {fieldErrors.advancePaid && <p className="text-xs text-red-600 mt-1">{fieldErrors.advancePaid}</p>}
                                    </Field>

                                    <Field label="Remaining Balance (₹)">
                                        <div className={`${INPUT} bg-gray-50 font-bold text-gray-800`}>
                                            ₹{remaining.toLocaleString('en-IN')}
                                        </div>
                                    </Field>

                                    <Field label="Payment Due Date">
                                        <input
                                            type="date" value={f.paymentDueDate}
                                            onChange={e => setForm(p => ({ ...p, paymentDueDate: e.target.value }))}
                                            className={INPUT}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Auto-set to 5 days before event
                                        </p>
                                    </Field>

                                    {/* ── Installment Planner (edit mode only) ── */}
                                    {editingId && (
                                        <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                                            <p className="text-xs font-bold text-indigo-700 mb-2.5">📅 Instalment Planner</p>
                                            {[
                                                { n: 1, label: '1st Instalment', amtKey: 'installment1Amount', paidKey: 'installment1Paid' },
                                                { n: 2, label: '2nd Instalment', amtKey: 'installment2Amount', paidKey: 'installment2Paid' },
                                            ].map(({ n, label, amtKey, paidKey }) => {
                                                const isPaid = f[paidKey]
                                                const noteText = n === 1 ? '1st Instalment' : '2nd Instalment'
                                                return (
                                                    <div key={n} className="flex items-center gap-2 mb-2 last:mb-0">
                                                        <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
                                                        <input
                                                            type="number" min="0"
                                                            value={f[amtKey]}
                                                            onChange={e => !isPaid && setForm(p => ({ ...p, [amtKey]: e.target.value }))}
                                                            disabled={isPaid}
                                                            className={`${INPUT} text-sm flex-1 ${isPaid ? 'bg-gray-100 text-gray-400' : ''}`}
                                                            placeholder="₹ Amount"
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={!f[amtKey] || isPaid}
                                                            onClick={async () => {
                                                                if (!f[amtKey] || isPaid) return
                                                                try {
                                                                    const updated = await bookingApi.recordPayment(editingId, {
                                                                        amount: parseFloat(f[amtKey]),
                                                                        method: 'Cash',
                                                                        note: noteText,
                                                                        date: new Date().toISOString().split('T')[0],
                                                                    })
                                                                    setBookings(prev => prev.map(b => b.id === editingId ? updated : b))
                                                                    setForm(p => ({
                                                                        ...p,
                                                                        [paidKey]: true,
                                                                        advancePaid: updated.advancePaid != null
                                                                            ? String(updated.advancePaid)
                                                                            : p.advancePaid,
                                                                    }))
                                                                } catch { /* silent */ }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all shrink-0
                                                                ${isPaid
                                                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 cursor-default'
                                                                    : f[amtKey]
                                                                        ? 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                                                                        : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                        >
                                                            {isPaid ? '✓ PAID' : 'Mark PAID'}
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* ── Payment Screenshots (edit mode only) ── */}
                                    {editingId && editingScreenshots.length > 0 && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">Payment Screenshots</p>
                                            <div className="flex flex-wrap gap-2">
                                                {editingScreenshots.map(ss => (
                                                    <a key={ss.index} href={ss.dataUrl} target="_blank" rel="noopener noreferrer"
                                                        className="block">
                                                        <img src={ss.dataUrl} alt={`Payment ${ss.index + 1}`}
                                                            className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200
                                                                        hover:border-indigo-400 transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* ─── Expenses (post-event, edit mode only) ─── */}
                            {editingId && <Section id="section-expenses" title="Actual Expenses (fill after event)">
                                <p className="text-xs text-gray-400 mb-3">
                                    Enter actual costs to track profit per event in Reports.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { key: 'expenseLabour', label: 'Labour' },
                                        { key: 'expenseDiesel', label: 'Diesel / Generator' },
                                        { key: 'expenseCleaning', label: 'Cleaning' },
                                        { key: 'expenseElectricity', label: 'Electricity' },
                                        { key: 'expenseOther', label: 'Other' },
                                    ].map(({ key, label }) => (
                                        <Field key={key} label={`${label} (₹)`}>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={f[key]}
                                                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                                className={INPUT}
                                                placeholder="0"
                                            />
                                        </Field>
                                    ))}
                                    <Field label="Total Expenses">
                                        <div className={`${INPUT} bg-gray-50 font-bold text-rose-700`}>
                                            ₹{[
                                                f.expenseLabour, f.expenseDiesel, f.expenseCleaning,
                                                f.expenseElectricity, f.expenseOther
                                            ].reduce((s, v) => s + (parseFloat(v) || 0), 0).toLocaleString('en-IN')}
                                        </div>
                                    </Field>
                                </div>
                            </Section>}
                            <Section id="section-notes" title="Additional Notes">
                                <textarea
                                    value={f.notes}
                                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className={`${INPUT} h-20 resize-none`}
                                    placeholder="Special instructions, extra notes…"
                                />
                            </Section>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 border-2 border-gray-200 text-gray-700 py-3
                                               rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3
                                               rounded-xl font-semibold disabled:opacity-60 transition-colors
                                               shadow-sm hover:shadow-md"
                                >
                                    {saving ? 'Saving…' : editingId ? 'Update Booking' : 'Create Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="text-4xl mb-3 text-center">🗑️</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">
                            Delete Booking?
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 text-center">
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5
                                           rounded-xl font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5
                                           rounded-xl font-semibold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Booking card
// ─────────────────────────────────────────────

function BookingCard({ booking: b, onEdit, onDelete }) {
    const remaining = parseFloat(b.totalAmount || 0) - parseFloat(b.advancePaid || 0)
    const amenityList = (b.amenities ?? '').split(',').map(a => a.trim()).filter(Boolean)
    const isOverdue = b.paymentStatus === 'OVERDUE'
    const eventEnd = b.eventEndDate || b.eventDate
    const today = new Date().toISOString().slice(0, 10)
    const isEventCompleted = !!eventEnd && eventEnd < today

    const dateStr = b.eventEndDate && b.eventEndDate !== b.eventDate
        ? `${format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(b.eventEndDate + 'T00:00:00'), 'dd MMM yyyy')}`
        : format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM yyyy')

    return (
        <div className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md
                         ${isOverdue ? 'border-red-200 shadow-red-50' : 'border-gray-100'}`}>
            {/* Header */}
            <div className={`px-4 pt-4 pb-3 border-b ${isOverdue ? 'border-red-100' : 'border-gray-50'}`}>
                <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate text-base">{b.customerName}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{b.phoneNumber}</span>
                            {b.bookingRef && (
                                <span className="text-xs text-indigo-500 font-semibold bg-indigo-50
                                                 px-2 py-0.5 rounded-full border border-indigo-100">
                                    {b.bookingRef}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge status={b.paymentStatus} type="payment" />
                        <StatusBadge status={b.bookingStatus} type="booking" />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                    <span>📅 {dateStr}</span>
                    <span>🎉 {b.eventType}</span>
                    {b.checkInTime && (
                        <span className="text-xs text-gray-500">
                            🕐 {formatTime12(b.checkInTime)} – {formatTime12(b.checkOutTime)}
                        </span>
                    )}
                    {b.foodType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                          ${b.foodType === 'VEG'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'}`}>
                            {b.foodType === 'VEG' ? '🥗 Veg' : '🍗 Non-Veg'}
                        </span>
                    )}
                </div>

                {amenityList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {amenityList.map(a => (
                            <span key={a} className="bg-indigo-50 text-indigo-700 text-xs
                                                      px-2.5 py-0.5 rounded-full border border-indigo-100">
                                {a}
                            </span>
                        ))}
                    </div>
                )}

                {/* Payment row */}
                <div className={`flex items-start justify-between gap-2 pt-2 border-t
                                 ${isOverdue ? 'border-red-100' : 'border-gray-50'}`}>
                    <div>
                        <div className="text-sm">
                            <span className="font-bold text-gray-800">
                                ₹{parseFloat(b.totalAmount || 0).toLocaleString('en-IN')}
                            </span>
                            {remaining > 0 && (
                                <span className={`ml-2 font-semibold text-sm
                                                  ${isOverdue ? 'text-red-600' : 'text-orange-500'}`}>
                                    · ₹{remaining.toLocaleString('en-IN')} due
                                </span>
                            )}
                        </div>
                        {b.paymentDueDate && remaining > 0 && (
                            <div className="text-xs text-gray-400 mt-0.5">
                                Due by {format(new Date(b.paymentDueDate + 'T00:00:00'), 'dd MMM yyyy')}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <WhatsAppButton booking={b} mode="confirm" label="Confirm" />
                        {b.paymentStatus !== 'PAID' && (
                            <WhatsAppButton booking={b} mode="reminder" label="Remind" />
                        )}
                        {isEventCompleted && (
                            <WhatsAppButton booking={b} mode="thankyou" label="Thank You" />
                        )}
                        <button
                            onClick={onEdit}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Section({ id, title, children }) {
    return (
        <div id={id} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">{title}</h3>
            {children}
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            {children}
        </div>
    )
}

function AmenityRow({ label, checked, always, disabled, onChange }) {
    return (
        <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all
                         ${always
                ? 'bg-green-50 border-green-100'
                : checked && !disabled
                    ? 'bg-white border-green-200'
                    : 'bg-white border-gray-100 opacity-70'}`}>
            <span className={`text-sm font-medium
                              ${always ? 'text-green-700' : 'text-gray-700'}`}>
                {label}
            </span>
            {always ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    Always Included
                </span>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onChange(!checked)}
                    className={`relative w-11 h-6 rounded-full transition-all
                                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow
                                      transition-all duration-200
                                      ${checked ? 'left-6' : 'left-1'}`} />
                </button>
            )}
        </div>
    )
}

function TermToggle({ label, checked, onChange }) {
    return (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all
                         ${checked
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-100'}`}>
            <span className="text-sm text-gray-700 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${checked ? 'text-green-600' : 'text-red-500'}`}>
                    {checked ? '✓ Incl.' : '✗ Excl.'}
                </span>
                <button
                    type="button"
                    onClick={() => onChange(!checked)}
                    className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                                ${checked ? 'bg-green-500' : 'bg-red-300'}`}
                >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                      transition-all duration-200
                                      ${checked ? 'left-5' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    )
}
