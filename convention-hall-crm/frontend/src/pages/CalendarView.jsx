import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import {
    format, parse, startOfWeek, getDay,
    startOfMonth, endOfMonth,
} from 'date-fns'
import { enUS } from 'date-fns/locale'
import { bookingApi } from '../api/bookingApi'
import StatusBadge from '../components/StatusBadge'
import WhatsAppButton from '../components/WhatsAppButton'
import TimePicker, { formatTime12 } from '../components/TimePicker'
import DateRangePicker from '../components/DateRangePicker'
import { X, Edit2, CheckCircle, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const STATUS_COLORS = {
    PAID: '#16a34a',
    PARTIAL: '#d97706',
    PENDING: '#4f46e5',
    OVERDUE: '#dc2626',
}

// ─────────────────────────────────────────────
// Form defaults (mirrors Bookings.jsx)
// ─────────────────────────────────────────────
const EVENT_TYPES = [
    'Wedding', 'Reception', 'Birthday', 'Corporate Event',
    'Conference', 'Puja / Religious', 'Anniversary', 'Engagement',
    'Naming Ceremony', 'Exhibition', 'Other',
]

const INPUT =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

// ─────────────────────────────────────────────
// Custom Calendar Toolbar
// ─────────────────────────────────────────────
function CustomToolbar({ date, view, onNavigate, onView }) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const [pickerYear, setPickerYear] = useState(date.getFullYear())

    const goTo = (year, month) => {
        onNavigate('DATE', new Date(year, month, 1))
        setPickerOpen(false)
    }

    const viewButtons = [
        { key: 'month', label: 'Month' },
        { key: 'week', label: 'Week' },
        { key: 'agenda', label: 'List' },
    ]

    let titleLabel = ''
    if (view === 'month') titleLabel = format(date, 'MMMM yyyy')
    else if (view === 'week') titleLabel = format(date, 'MMM yyyy')
    else titleLabel = format(date, 'MMM yyyy')

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between
                        gap-3 px-4 py-3 border-b border-gray-100 bg-white">

            {/* Left: Today + Prev/Next + Month picker */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => onNavigate('TODAY')}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white
                               rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    Today
                </button>
                <button
                    type="button"
                    onClick={() => onNavigate('PREV')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    type="button"
                    onClick={() => onNavigate('NEXT')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Month/Year quick-jump */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => {
                            setPickerOpen(o => !o)
                            setPickerYear(date.getFullYear())
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold
                                   text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {titleLabel}
                        <ChevronDown size={13} className="text-gray-400" />
                    </button>

                    {pickerOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl
                                        border border-gray-200 p-4 z-50 min-w-[224px]">
                            {/* Year nav */}
                            <div className="flex items-center justify-between mb-3">
                                <button type="button"
                                    onClick={() => setPickerYear(y => y - 1)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <ChevronLeft size={15} />
                                </button>
                                <span className="font-bold text-gray-800 text-sm">{pickerYear}</span>
                                <button type="button"
                                    onClick={() => setPickerYear(y => y + 1)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                            {/* Month grid */}
                            <div className="grid grid-cols-3 gap-1">
                                {MONTH_NAMES.map((m, i) => {
                                    const active = date.getMonth() === i && date.getFullYear() === pickerYear
                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => goTo(pickerYear, i)}
                                            className={`py-2 text-xs font-semibold rounded-lg transition-colors
                                                ${active
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-indigo-50 text-gray-700 hover:text-indigo-700'}`}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: view switcher */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                {viewButtons.map(v => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => onView(v.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                                    ${view === v.key
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function CalendarView() {
    const [bookings, setBookings] = useState([])
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState('month')
    const [selectedBooking, setSelectedBooking] = useState(null) // full detail modal
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)

    useEffect(() => { loadMonth(currentDate) }, [currentDate])

    function loadMonth(date) {
        const start = format(startOfMonth(date), 'yyyy-MM-dd')
        const end = format(endOfMonth(date), 'yyyy-MM-dd')
        bookingApi.getCalendar(start, end).then(setBookings)
    }

    const events = bookings.map(b => ({
        id: b.id,
        title: `${b.customerName} · ${b.eventType}`,
        start: new Date(`${b.eventDate}T${b.checkInTime || '09:00'}:00`),
        end: new Date(`${b.eventEndDate || b.eventDate}T${b.checkOutTime || '21:00'}:00`),
        resource: b,
    }))

    function eventStyleGetter(event) {
        return {
            style: {
                backgroundColor: STATUS_COLORS[event.resource.paymentStatus] ?? '#4f46e5',
                borderRadius: '8px',
                border: 'none',
                fontSize: '11px',
                padding: '2px 6px',
                color: '#fff',
                fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            },
        }
    }

    function openDetail(event) {
        setSelectedBooking(event.resource)
        setEditMode(false)
        setEditForm(null)
        setSaveError(null)
    }

    function startEdit() {
        const b = selectedBooking
        const isOther = !EVENT_TYPES.slice(0, -1).includes(b.eventType)
        setEditForm({
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
        })
        setEditMode(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        setSaving(true)
        setSaveError(null)
        try {
            const f = editForm
            const finalType = f.eventType === 'Other' ? f.eventTypeOther : f.eventType
            // Cap advance at total
            const total = parseFloat(f.totalAmount || 0)
            const advance = Math.min(parseFloat(f.advancePaid || 0), total)
            const payload = {
                customerName: f.customerName,
                phoneNumber: f.phoneNumber,
                eventType: finalType,
                eventDate: f.eventDate,
                eventEndDate: f.eventEndDate || null,
                foodType: f.foodType,
                totalAmount: total,
                advancePaid: advance,
                paymentDueDate: f.paymentDueDate || null,
                checkInTime: f.checkInTime || null,
                checkOutTime: f.checkOutTime || null,
                villaRooms: parseInt(f.villaRooms) || 0,
                diningHallIncluded: f.diningHallIncluded,
                vesselsIncluded: f.vesselsIncluded,
                electricityIncluded: f.electricityIncluded,
                labourIncluded: f.labourIncluded,
                dieselIncluded: f.dieselIncluded,
                cleaningIncluded: f.cleaningIncluded,
                acHours: parseInt(f.acHours) || 3,
                notes: f.notes,
                bookingStatus: f.bookingStatus,
            }
            const updated = await bookingApi.update(selectedBooking.id, payload)
            setSelectedBooking(updated)
            setEditMode(false)
            loadMonth(currentDate)
        } catch (err) {
            setSaveError(err.response?.data?.error ?? 'Could not save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    function closeModal() {
        setSelectedBooking(null)
        setEditMode(false)
        setEditForm(null)
    }

    // Auto-calc payment due when event date changes in edit
    const handleEditDateRange = (startDate, endDate) => {
        setEditForm(p => {
            const updated = { ...p, eventDate: startDate, eventEndDate: endDate }
            if (startDate) {
                const due = new Date(startDate + 'T00:00:00')
                due.setDate(due.getDate() - 5)
                updated.paymentDueDate = due.toISOString().split('T')[0]
            }
            return updated
        })
    }

    // Veg / Non-Veg toggle in edit
    const handleEditFoodType = (type) => {
        setEditForm(p => ({
            ...p,
            foodType: type,
            diningHallIncluded: type === 'VEG',
            vesselsIncluded: type === 'VEG',
        }))
    }

    return (
        <div className="p-4 max-w-5xl mx-auto pb-24 md:pb-8">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
                <p className="text-sm text-gray-500 mt-0.5">Click any event to view or edit details</p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(STATUS_COLORS).map(([label, color]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600
                                                 bg-white border border-gray-100 rounded-full px-3 py-1 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        {label}
                    </span>
                ))}
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                style={{ height: currentView === 'week' ? 660 : currentView === 'agenda' ? 540 : 540 }}
            >
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={openDetail}
                    selectable
                    date={currentDate}
                    onNavigate={date => setCurrentDate(date)}
                    view={currentView}
                    onView={v => setCurrentView(v)}
                    views={['month', 'week', 'agenda']}
                    popup
                    components={{ toolbar: CustomToolbar }}
                />
            </div>

            {/* ── Event Detail / Edit Modal ── */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center
                                justify-center p-0 md:p-4">
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl
                                    max-h-[90vh] overflow-y-auto shadow-2xl">

                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4
                                        flex items-center justify-between z-10 rounded-t-2xl">
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg">
                                    {editMode ? 'Edit Booking' : selectedBooking.customerName}
                                </h2>
                                {!editMode && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {selectedBooking.eventType} ·{' '}
                                        {format(new Date(selectedBooking.eventDate + 'T00:00:00'), 'dd MMM yyyy')}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {!editMode && (
                                    <button
                                        onClick={startEdit}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50
                                                   text-indigo-700 rounded-lg text-sm font-semibold
                                                   hover:bg-indigo-100 transition-colors"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                )}
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* ── Detail View ── */}
                        {!editMode && <DetailView booking={selectedBooking} />}

                        {/* ── Edit Form ── */}
                        {editMode && editForm && (
                            <form onSubmit={handleSave} className="p-5 space-y-4">
                                {saveError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl
                                                    px-4 py-3 text-red-700 text-sm">
                                        {saveError}
                                    </div>
                                )}

                                {/* ─── Customer & Event ─── */}
                                <ESection title="Customer & Event">
                                    <div className="grid grid-cols-2 gap-3">
                                        <EField label="Customer Name *">
                                            <input required value={editForm.customerName}
                                                onChange={e => setEditForm(p => ({ ...p, customerName: e.target.value }))}
                                                className={INPUT} />
                                        </EField>
                                        <EField label="Phone Number *">
                                            <input required value={editForm.phoneNumber}
                                                onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                                                className={INPUT} />
                                        </EField>
                                        <EField label="Event Type *">
                                            <select required value={editForm.eventType}
                                                onChange={e => setEditForm(p => ({ ...p, eventType: e.target.value }))}
                                                className={INPUT}>
                                                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </EField>
                                        {editForm.eventType === 'Other' && (
                                            <EField label="Specify Type *">
                                                <input required value={editForm.eventTypeOther}
                                                    onChange={e => setEditForm(p => ({ ...p, eventTypeOther: e.target.value }))}
                                                    className={INPUT} placeholder="e.g. Reunion" />
                                            </EField>
                                        )}
                                        <EField label="Booking Status">
                                            <select value={editForm.bookingStatus}
                                                onChange={e => setEditForm(p => ({ ...p, bookingStatus: e.target.value }))}
                                                className={INPUT}>
                                                <option value="CONFIRMED">Confirmed</option>
                                                <option value="TENTATIVE">Tentative</option>
                                                <option value="CANCELLED">Cancelled</option>
                                            </select>
                                        </EField>
                                    </div>
                                </ESection>

                                {/* ─── Dates & Timings ─── */}
                                <ESection title="Dates & Timings">
                                    <div className="space-y-3">
                                        <DateRangePicker
                                            startDate={editForm.eventDate}
                                            endDate={editForm.eventEndDate}
                                            onChange={({ startDate, endDate }) => handleEditDateRange(startDate, endDate)}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <EField label="Check-in Time">
                                                <TimePicker value={editForm.checkInTime}
                                                    onChange={v => setEditForm(p => ({ ...p, checkInTime: v }))} />
                                            </EField>
                                            <EField label="Check-out Time">
                                                <TimePicker value={editForm.checkOutTime}
                                                    onChange={v => setEditForm(p => ({ ...p, checkOutTime: v }))} />
                                            </EField>
                                        </div>
                                    </div>
                                </ESection>

                                {/* ─── Amenities ─── */}
                                <ESection title="Amenities">
                                    {/* Veg / Non-Veg */}
                                    <div className="flex gap-2 mb-3">
                                        {['VEG', 'NONVEG'].map(type => (
                                            <button key={type} type="button"
                                                onClick={() => handleEditFoodType(type)}
                                                className={`flex-1 py-2 rounded-xl text-sm font-semibold
                                                            border-2 transition-all ${editForm.foodType === type
                                                        ? type === 'VEG'
                                                            ? 'bg-green-600 text-white border-green-600'
                                                            : 'bg-red-600 text-white border-red-600'
                                                        : type === 'VEG'
                                                            ? 'bg-white text-green-700 border-green-200 hover:border-green-400'
                                                            : 'bg-white text-red-700 border-red-200 hover:border-red-400'
                                                    }`}>
                                                {type === 'VEG' ? 'Veg Event' : 'Non-Veg Event'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 mb-3">
                                        <EAmenityRow label="Function Hall" always />
                                        <EAmenityRow label="2 Complimentary Rooms" always />
                                        <EAmenityRow label="Dining Hall"
                                            checked={editForm.diningHallIncluded}
                                            disabled={editForm.foodType === 'NONVEG'}
                                            onChange={v => setEditForm(p => ({ ...p, diningHallIncluded: v }))} />
                                        <EAmenityRow label="Cooking Vessels"
                                            checked={editForm.vesselsIncluded}
                                            disabled={editForm.foodType === 'NONVEG'}
                                            onChange={v => setEditForm(p => ({ ...p, vesselsIncluded: v }))} />
                                    </div>
                                    {/* Villa rooms */}
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-indigo-800">Villa 1st Floor Rooms</span>
                                            <span className="text-xs font-semibold text-indigo-600">
                                                {editForm.villaRooms > 0 ? `+₹${(editForm.villaRooms * 1500).toLocaleString('en-IN')}` : 'Not included'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[0, 1, 2, 3].map(n => (
                                                <button key={n} type="button"
                                                    onClick={() => setEditForm(p => ({ ...p, villaRooms: n }))}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${parseInt(editForm.villaRooms) === n
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                                        }`}>
                                                    {n === 0 ? 'None' : `${n}rm`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </ESection>

                                {/* ─── Terms & Conditions ─── */}
                                <ESection title="Terms & Conditions">
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <ETermToggle label="Electricity Bill"
                                            checked={editForm.electricityIncluded}
                                            onChange={v => setEditForm(p => ({ ...p, electricityIncluded: v }))} />
                                        <ETermToggle label="Labour Charges"
                                            checked={editForm.labourIncluded}
                                            onChange={v => setEditForm(p => ({ ...p, labourIncluded: v }))} />
                                        <ETermToggle label="Diesel / Generator"
                                            checked={editForm.dieselIncluded}
                                            onChange={v => setEditForm(p => ({ ...p, dieselIncluded: v }))} />
                                        <ETermToggle label="Cleaning / Garbage"
                                            checked={editForm.cleaningIncluded}
                                            onChange={v => setEditForm(p => ({ ...p, cleaningIncluded: v }))} />
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">AC Hours / Day</span>
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3, 4, 6].map(h => (
                                                <button key={h} type="button"
                                                    onClick={() => setEditForm(p => ({ ...p, acHours: h }))}
                                                    className={`w-8 h-7 rounded-lg text-xs font-bold border-2 transition-all ${parseInt(editForm.acHours) === h
                                                        ? 'bg-sky-500 text-white border-sky-500'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                                                        }`}>
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400">hrs</span>
                                    </div>
                                </ESection>

                                {/* ─── Payment ─── */}
                                <ESection title="Payment">
                                    <div className="grid grid-cols-2 gap-3">
                                        <EField label="Total Rent (₹) *">
                                            <input required type="number" min="0" step="0.01"
                                                value={editForm.totalAmount}
                                                onChange={e => setEditForm(p => ({ ...p, totalAmount: e.target.value }))}
                                                className={INPUT} placeholder="0.00" />
                                        </EField>
                                        <EField label="Advance Paid (₹)">
                                            <input type="number" min="0" step="0.01"
                                                value={editForm.advancePaid}
                                                onChange={e => {
                                                    const raw = e.target.value
                                                    const val = parseFloat(raw) || 0
                                                    const max = parseFloat(editForm.totalAmount || 0)
                                                    setEditForm(p => ({ ...p, advancePaid: (max > 0 && val > max) ? String(max) : raw }))
                                                }}
                                                className={INPUT} placeholder="0.00" />
                                        </EField>
                                        <EField label="Remaining Balance">
                                            <div className={`${INPUT} bg-gray-50 font-bold text-gray-800`}>
                                                ₹{Math.max(0,
                                                    parseFloat(editForm.totalAmount || 0) -
                                                    parseFloat(editForm.advancePaid || 0)
                                                ).toLocaleString('en-IN')}
                                            </div>
                                        </EField>
                                        <EField label="Payment Due Date">
                                            <input type="date" value={editForm.paymentDueDate}
                                                onChange={e => setEditForm(p => ({ ...p, paymentDueDate: e.target.value }))}
                                                className={INPUT} />
                                            <p className="text-xs text-gray-400 mt-1">Auto-set 15 days before event</p>
                                        </EField>
                                    </div>
                                </ESection>

                                <EField label="Additional Notes">
                                    <textarea value={editForm.notes}
                                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                                        className={`${INPUT} h-16 resize-none`} />
                                </EField>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setEditMode(false)}
                                        className="flex-1 border-2 border-gray-200 text-gray-700 py-3
                                                   rounded-xl font-semibold">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white
                                                   py-3 rounded-xl font-semibold disabled:opacity-60">
                                        {saving ? 'Saving…' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Booking Detail View (read-only)
// ─────────────────────────────────────────────

function DetailView({ booking: b }) {
    const remaining = parseFloat(b.totalAmount || 0) - parseFloat(b.advancePaid || 0)
    const amenityList = (b.amenities ?? '').split(',').map(a => a.trim()).filter(Boolean)
    const eventEnd = b.eventEndDate || b.eventDate
    const today = new Date().toISOString().slice(0, 10)
    const isEventCompleted = !!eventEnd && eventEnd < today

    const dateStr = b.eventEndDate && b.eventEndDate !== b.eventDate
        ? `${format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM')} – ${format(new Date(b.eventEndDate + 'T00:00:00'), 'dd MMM yyyy')}`
        : format(new Date(b.eventDate + 'T00:00:00'), 'dd MMM yyyy')

    const acHours = b.acHours ?? 3

    return (
        <div className="p-5 space-y-4">
            {/* Status row */}
            <div className="flex gap-2">
                <StatusBadge status={b.paymentStatus} type="payment" />
                <StatusBadge status={b.bookingStatus} type="booking" />
                {b.foodType && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                      ${b.foodType === 'VEG'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'}`}>
                        {b.foodType === 'VEG' ? '🥗 Veg' : '🍗 Non-Veg'}
                    </span>
                )}
            </div>

            {/* Customer info */}
            <DetailSection title="👤 Customer">
                <Row label="Name" value={b.customerName} />
                <Row label="Phone" value={b.phoneNumber} />
            </DetailSection>

            {/* Event info */}
            <DetailSection title="📅 Event">
                <Row label="Date" value={dateStr} />
                <Row label="Check-in" value={formatTime12(b.checkInTime)} />
                <Row label="Check-out" value={formatTime12(b.checkOutTime)} />
            </DetailSection>

            {/* Amenities */}
            {amenityList.length > 0 && (
                <DetailSection title="🏠 Amenities">
                    <div className="flex flex-wrap gap-1.5">
                        {amenityList.map(a => (
                            <span key={a} className="bg-indigo-50 text-indigo-700 text-xs
                                                      px-3 py-1 rounded-full border border-indigo-100 font-medium">
                                ✓ {a}
                            </span>
                        ))}
                    </div>
                </DetailSection>
            )}

            {/* Terms */}
            {(b.electricityIncluded !== null || b.labourIncluded !== null) && (
                <DetailSection title="📋 Terms">
                    <div className="grid grid-cols-2 gap-1.5 text-sm">
                        <TermRow label="Electricity" val={b.electricityIncluded} />
                        <TermRow label="Labour" val={b.labourIncluded} />
                        <TermRow label="Diesel" val={b.dieselIncluded} />
                        <TermRow label="Cleaning" val={b.cleaningIncluded} />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        ❄️ AC: <strong>{acHours} hrs/day</strong>
                        <span className="text-gray-400 text-xs"> (extra charged separately)</span>
                    </div>
                </DetailSection>
            )}

            {/* Payment */}
            <DetailSection title="💰 Payment">
                <Row label="Total Rent" value={`₹${parseFloat(b.totalAmount || 0).toLocaleString('en-IN')}`} />
                <Row label="Advance Paid" value={`₹${parseFloat(b.advancePaid || 0).toLocaleString('en-IN')}`}
                    valueClass="text-green-600 font-semibold" />
                {remaining > 0 && (
                    <Row label="Balance Due" value={`₹${remaining.toLocaleString('en-IN')}`}
                        valueClass="text-red-600 font-semibold" />
                )}
                {b.paymentDueDate && remaining > 0 && (
                    <Row label="Due By"
                        value={format(new Date(b.paymentDueDate + 'T00:00:00'), 'dd MMM yyyy')}
                        valueClass="text-orange-600" />
                )}
            </DetailSection>

            {/* Notes */}
            {b.notes && (
                <DetailSection title="📝 Notes">
                    <p className="text-sm text-gray-600 whitespace-pre-line">{b.notes}</p>
                </DetailSection>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <WhatsAppButton booking={b} mode="confirm" label="Send Confirmation"
                    className="flex-1 justify-center" />
                {b.paymentStatus !== 'PAID' && (
                    <WhatsAppButton booking={b} mode="reminder" label="Send Reminder"
                        className="flex-1 justify-center" />
                )}
                {isEventCompleted && (
                    <WhatsAppButton booking={b} mode="thankyou" label="Send Thank You"
                        className="flex-1 justify-center" />
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Helper sub-components
// ─────────────────────────────────────────────

function DetailSection({ title, children }) {
    return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{title}</div>
            {children}
        </div>
    )
}

function Row({ label, value, valueClass = '' }) {
    return (
        <div className="flex justify-between items-baseline gap-2 py-0.5">
            <span className="text-xs text-gray-500 shrink-0">{label}</span>
            <span className={`text-sm font-medium text-gray-800 text-right ${valueClass}`}>{value}</span>
        </div>
    )
}

function TermRow({ label, val }) {
    if (val === null || val === undefined) return null
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
                         ${val ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <span>{val ? '✓' : '✗'}</span>
            <span>{label}</span>
        </div>
    )
}

function EField({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
            {children}
        </div>
    )
}

function ESection({ title, children }) {
    return (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
            {children}
        </div>
    )
}

function EAmenityRow({ label, checked, always, disabled, onChange }) {
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all
                         ${always ? 'bg-green-50 border-green-100'
                : checked && !disabled ? 'bg-white border-green-200'
                    : 'bg-white border-gray-100 opacity-70'}`}>
            <span className={`text-xs font-medium ${always ? 'text-green-700' : 'text-gray-700'}`}>{label}</span>
            {always ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Included</span>
            ) : (
                <button type="button" disabled={disabled}
                    onClick={() => !disabled && onChange(!checked)}
                    className={`relative w-10 h-5 rounded-full transition-all
                                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                      transition-all duration-200 ${checked ? 'left-5' : 'left-0.5'}`} />
                </button>
            )}
        </div>
    )
}

function ETermToggle({ label, checked, onChange }) {
    return (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2 border transition-all
                         ${checked ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'}`}>
            <span className="text-xs text-gray-700 font-medium">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${checked ? 'text-green-600' : 'text-red-500'}`}>
                    {checked ? 'Incl.' : 'Excl.'}
                </span>
                <button type="button" onClick={() => onChange(!checked)}
                    className={`relative w-9 h-5 rounded-full transition-all cursor-pointer
                                ${checked ? 'bg-green-500' : 'bg-red-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
                                      transition-all duration-200 ${checked ? 'left-4' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    )
}

