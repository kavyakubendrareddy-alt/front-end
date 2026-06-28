import { useState, useEffect } from 'react'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "HH:MM" (24-hr) → { hour, minute, period } */
function from24(str) {
    if (!str) return { hour: '06', minute: '00', period: 'AM' }
    const [h, m] = str.split(':')
    const h24 = parseInt(h, 10)
    const period = h24 >= 12 ? 'PM' : 'AM'
    let h12 = h24 % 12
    if (h12 === 0) h12 = 12
    return { hour: String(h12).padStart(2, '0'), minute: m || '00', period }
}

/** Convert { hour, minute, period } → "HH:MM" (24-hr) */
function to24({ hour, minute, period }) {
    let h = parseInt(hour, 10)
    if (period === 'AM' && h === 12) h = 0
    if (period === 'PM' && h !== 12) h += 12
    return `${String(h).padStart(2, '0')}:${minute}`
}

/** Format "HH:MM" (24-hr) for display as "6:00 AM" */
export function formatTime12(str) {
    if (!str) return ''
    const { hour, minute, period } = from24(str)
    return `${parseInt(hour)}:${minute} ${period}`
}

// ── Component ─────────────────────────────────────────────────────────────────

const SEL =
    'border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white ' +
    'focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer'

export default function TimePicker({ value, onChange }) {
    const [time, setTime] = useState(() => from24(value))

    useEffect(() => { setTime(from24(value)) }, [value])

    const update = (field, val) => {
        const updated = { ...time, [field]: val }
        setTime(updated)
        onChange(to24(updated))
    }

    return (
        <div className="flex items-center gap-1.5">
            <select
                value={time.hour}
                onChange={e => update('hour', e.target.value)}
                className={SEL}
            >
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <span className="text-gray-400 font-bold text-sm">:</span>

            <select
                value={time.minute}
                onChange={e => update('minute', e.target.value)}
                className={SEL}
            >
                {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <button
                type="button"
                onClick={() => update('period', time.period === 'AM' ? 'PM' : 'AM')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${time.period === 'AM'
                        ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
            >
                {time.period}
            </button>
        </div>
    )
}
