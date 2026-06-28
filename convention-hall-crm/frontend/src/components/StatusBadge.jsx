const PAYMENT_STYLES = {
    PAID: 'bg-green-100  text-green-800',
    PARTIAL: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-gray-100   text-gray-700',
    OVERDUE: 'bg-red-100    text-red-800',
}

const BOOKING_STYLES = {
    CONFIRMED: 'bg-blue-100   text-blue-800',
    TENTATIVE: 'bg-orange-100 text-orange-800',
    CANCELLED: 'bg-gray-100   text-gray-500',
}

export default function StatusBadge({ status, type = 'payment' }) {
    const palette = type === 'payment' ? PAYMENT_STYLES : BOOKING_STYLES
    const cls = palette[status] ?? 'bg-gray-100 text-gray-600'
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            {status}
        </span>
    )
}
