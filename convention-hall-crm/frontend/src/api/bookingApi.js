import axios from 'axios'
import { format } from 'date-fns'
import { getToken, removeToken } from '../utils/auth'

const api = axios.create({
    // In production (Vercel), set VITE_API_URL=https://your-backend.onrender.com
    // In local dev, leave unset — Vite proxy forwards /api → localhost:8080
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
})

// Attach JWT to every request
api.interceptors.request.use(config => {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Redirect to login on 401
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            removeToken()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

export const bookingApi = {
    getAll: () => api.get('/bookings').then(r => r.data),
    getById: (id) => api.get(`/bookings/${id}`).then(r => r.data),
    create: (data) => api.post('/bookings', data).then(r => r.data),
    update: (id, data) => api.put(`/bookings/${id}`, data).then(r => r.data),
    delete: (id) => api.delete(`/bookings/${id}`),
    search: (q) => api.get(`/bookings/search?q=${encodeURIComponent(q)}`).then(r => r.data),
    getCalendar: (s, e) => api.get(`/bookings/calendar?start=${s}&end=${e}`).then(r => r.data),
    getOverdue: () => api.get('/bookings/overdue').then(r => r.data),
    updatePayment: (id, data) => api.patch(`/bookings/${id}/payment`, data).then(r => r.data),
    recordPayment: (id, data) => api.post(`/bookings/${id}/payments`, data).then(r => r.data),
    getDashboard: () => api.get('/dashboard/stats').then(r => r.data),
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function toPhone(phoneNumber) {
    const digits = (phoneNumber || '').replace(/\D/g, '')
    return digits.length === 10 ? `91${digits}` : digits
}

function fmtDate(dateStr) {
    if (!dateStr) return ''
    return format(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy')
}

function fmtDateRange(startStr, endStr) {
    if (!startStr) return ''
    if (!endStr || endStr === startStr) return fmtDate(startStr)
    return `${fmtDate(startStr)} – ${fmtDate(endStr)}`
}

function fmtTime12(str) {
    if (!str) return 'As discussed'
    const [h, m] = str.split(':')
    const h24 = parseInt(h, 10)
    const period = h24 >= 12 ? 'PM' : 'AM'
    let h12 = h24 % 12; if (h12 === 0) h12 = 12
    return `${h12}:${m} ${period}`
}

function fmtRs(val) {
    return `₹${Number(val || 0).toLocaleString('en-IN')}`
}

// ── Helper: build dynamic charges sentence for Terms ──────────────────────────

function buildChargesSentence(elec, labour, diesel, cleaning) {
    const chargeLabels = ['electricity', 'labour', 'diesel', 'cleaning']
    const flags = [elec, labour, diesel, cleaning]
    const incl = chargeLabels.filter((_, i) => flags[i])
    const excl = chargeLabels.filter((_, i) => !flags[i])

    function joinList(arr) {
        if (arr.length === 0) return ''
        if (arr.length === 1) return arr[0]
        return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`
    }

    const parts = []
    if (incl.length) parts.push(`${joinList(incl).charAt(0).toUpperCase() + joinList(incl).slice(1)} charges are included`)
    if (excl.length) parts.push(`${joinList(excl).charAt(0).toUpperCase() + joinList(excl).slice(1)} charges are not included`)
    return parts.join('. ') + '.'
}

// ── Venue constants ──────────────────────────────────────────────────────────
const HALL_PHONE = '9448249477'
const HALL_FEEDBACK_URL = 'https://forms.gle/HtdZGAU1gvthbgTXA'
const HALL_REVIEW_URL = 'https://www.google.com/search?q=NRK+Function+Hall+Gauribidanur+Reviews'

// ── Booking confirmation WhatsApp message ─────────────────────────────────────

export function buildConfirmationMessage(booking) {
    const remaining = parseFloat(booking.totalAmount || 0) - parseFloat(booking.advancePaid || 0)
    const dateRange = fmtDateRange(booking.eventDate, booking.eventEndDate)

    const vr = Number(booking.villaRooms || 0)
    const amenities = [
        `✅ Function Hall`,
        `✅ 2 Complimentary Rooms`,
        `${booking.diningHallIncluded ? '✅' : '❌'} Dining Hall`,
        `${booking.vesselsIncluded ? '✅' : '❌'} Cooking Vessels`,
        ...(vr > 0 ? [`✅ Villa Rooms: ${vr} Room${vr > 1 ? 's' : ''}`] : []),
    ]

    const acFreeHrs = 3
    const chargesLine = buildChargesSentence(
        booking.electricityIncluded, booking.labourIncluded,
        booking.dieselIncluded, booking.cleaningIncluded
    )
    const dueStr = booking.paymentDueDate ? fmtDate(booking.paymentDueDate) : 'the due date'

    const venueRules = [
        `1. Kindly keep the venue clean and handle the premises with care.`,
        `2. Food is not allowed inside the Function Hall.`,
        `3. Guests are requested to take care of their valuables. NRK Function Hall is not responsible for any loss or theft.`,
        `4. Any damage caused to hall property or equipment will be chargeable.`,
        `5. Please follow check-in and check-out timings strictly.`,
        `6. Decorations causing damage to walls or property are not allowed.`,
        `7. Kindly cooperate with the venue staff and maintain respectful behavior.`,
    ]

    return [
        `Dear ${booking.customerName},`,
        ``,
        `Thank you for choosing *NRK Function Hall* for your upcoming event! We are delighted to have you with us. 🎉`,
        ``,
        `✅ *BOOKING CONFIRMED*`,
        ``,
        `*📋 Event Details*`,
        `🎉 Event  : ${booking.eventType}`,
        `📅 Date   : ${dateRange}`,
        `📌 Ref No : ${booking.bookingRef || '—'}`,
        ``,
        `*🏛️ Amenities Included*`,
        ...amenities,
        ``,
        `*⏰ Timings*`,
        `🕐 Check-in  : ${fmtTime12(booking.checkInTime)}`,
        `🕕 Check-out : ${fmtTime12(booking.checkOutTime)}`,
        ``,
        `*💰 Payment Details*`,
        `Total Rent   : ${fmtRs(booking.totalAmount)}`,
        `Advance Paid : ${fmtRs(booking.advancePaid)}`,
        `*Balance Due : ${fmtRs(remaining)}*`,
        ...(booking.paymentDueDate ? [`📅 Due by    : ${dueStr}`] : []),
        ``,
        `*📜 Terms & Conditions*`,
        `1. Advance amount is non-refundable.`,
        `2. ${chargesLine}`,
        `3. AC: ${acFreeHrs} hrs/day included free.`,
        `4. Balance payment must be completed by ${dueStr}.`,
        ``,
        `*📋 Venue Rules*`,
        ...venueRules,
        ``,
        `_Kindly complete the balance payment by the due date to ensure smooth event arrangements._`,
        ``,
        `Please reply *CONFIRM* to confirm your booking.`,
        ``,
        `We look forward to making your event truly memorable. Thank you for trusting us! 🙏`,
        ``,
        `*NRK FUNCTION HALL* 🏛️`,
        `📞 ${HALL_PHONE}`,
    ].join('\n')
}

export function buildConfirmationWhatsAppUrl(booking) {
    return `https://wa.me/${toPhone(booking.phoneNumber)}?text=${encodeURIComponent(buildConfirmationMessage(booking))}`
}

// ── Payment reminder WhatsApp message ─────────────────────────────────────────

export function buildReminderMessage(booking) {
    const remaining = parseFloat(booking.totalAmount || 0) - parseFloat(booking.advancePaid || 0)
    const dueStr = booking.paymentDueDate ? fmtDate(booking.paymentDueDate) : 'the earliest'
    return [
        `Dear ${booking.customerName},`,
        ``,
        `*🔔 PAYMENT REMINDER*`,
        ``,
        `This is a gentle reminder about your upcoming *${booking.eventType}* on *${fmtDate(booking.eventDate)}*.`,
        ``,
        `*💰 Payment Details*`,
        `Total Rent   : ${fmtRs(booking.totalAmount)}`,
        `Amount Paid  : ${fmtRs(booking.advancePaid)}`,
        `*Balance Due : ${fmtRs(remaining)}*`,
        ``,
        `📅 Please complete the balance payment by *${dueStr}* to ensure smooth arrangements.`,
        ``,
        `Thank you for choosing NRK Function Hall. We look forward to hosting your event! 🙏`,
        ``,
        `*NRK FUNCTION HALL* 🏛️`,
        `📞 ${HALL_PHONE}`,
    ].join('\n')
}

export function buildReminderWhatsAppUrl(booking) {
    return `https://wa.me/${toPhone(booking.phoneNumber)}?text=${encodeURIComponent(buildReminderMessage(booking))}`
}

// ── Thank-you / feedback WhatsApp message ────────────────────────────────────

export function buildThankYouMessage(booking) {
    const dateRange = fmtDateRange(booking.eventDate, booking.eventEndDate)
    return [
        `Dear ${booking.customerName},`,
        ``,
        `*🙏 Thank You from NRK Function Hall!*`,
        ``,
        `Thank you for celebrating your *${booking.eventType}* with us on *${dateRange}*! 🎉`,
        ``,
        `It was a pleasure hosting you and your guests. We hope you had a wonderful experience!`,
        ``,
        `*📝 Share Your Feedback*`,
        `We'd love to hear your thoughts:`,
        `${HALL_FEEDBACK_URL}`,
        ``,
        `*⭐ Leave a Google Review*`,
        `Your review helps others find us:`,
        `${HALL_REVIEW_URL}`,
        ``,
        `We look forward to hosting you again! 🏛️`,
        ``,
        `*NRK Function Hall*`,
        `📞 ${HALL_PHONE}`,
    ].join('\n')
}

export function buildThankYouWhatsAppUrl(booking) {
    return `https://wa.me/${toPhone(booking.phoneNumber)}?text=${encodeURIComponent(buildThankYouMessage(booking))}`
}

/** Legacy helper kept for backward compat */
export function buildWhatsAppUrl(phoneNumber, customerName, balanceAmount, eventDate) {
    return buildReminderWhatsAppUrl({
        phoneNumber,
        customerName,
        totalAmount: balanceAmount,
        advancePaid: 0,
        eventDate,
        eventEndDate: null,
        paymentDueDate: null,
    })
}
