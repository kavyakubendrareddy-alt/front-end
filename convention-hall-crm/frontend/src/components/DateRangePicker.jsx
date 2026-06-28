import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function addMonths(y, m, delta) {
    let mo = m + delta, yr = y
    while (mo > 11) { mo -= 12; yr++ }
    while (mo < 0) { mo += 12; yr-- }
    return [yr, mo]
}

function toStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function fmtLabel(s) {
    if (!s) return ''
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
}

// ── Single month grid ─────────────────────────────────────────────────────────

function MonthGrid({ year, month, rangeStart, rangeEnd, hoverDate, selecting, onDayClick, onDayHover, bookedIntervals = [] }) {
    const today = new Date().toISOString().split('T')[0]
    const numDays = new Date(year, month + 1, 0).getDate()
    const offset = new Date(year, month, 1).getDay()

    // Effective end for range preview while selecting
    const effEnd = selecting && hoverDate ? hoverDate : rangeEnd
    const [lo, hi] =
        rangeStart && effEnd
            ? rangeStart <= effEnd
                ? [rangeStart, effEnd]
                : [effEnd, rangeStart]
            : [rangeStart || null, null]

    const cells = [
        ...Array(offset).fill(null),
        ...Array(numDays).fill(0).map((_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
        <div>
            <p className="text-sm font-bold text-center text-gray-800 mb-3">
                {MONTH_NAMES[month]} {year}
            </p>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-0.5">
                {DAY_LABELS.map(l => (
                    <div key={l} className="text-center text-xs font-semibold text-gray-400 py-1">{l}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                    if (!day) return <div key={`e-${month}-${i}`} />

                    const ds = toStr(year, month, day)
                    const dow = (offset + day - 1) % 7   // 0=Sun … 6=Sat
                    const isStart = lo && ds === lo
                    const isEnd = hi && ds === hi
                    const inRange = lo && hi && ds > lo && ds < hi
                    const isSingle = lo && lo === hi
                    const isToday = ds === today

                    // ── Booked intervals detection ──────────────────────
                    const bookedInfo = bookedIntervals.find(({ startDate: bs, endDate: be }) => {
                        const end = be || bs
                        return ds >= bs && ds <= end
                    })
                    const isBooked = !!bookedInfo
                    const isBookedSingle = isBooked && (!bookedInfo.endDate || bookedInfo.endDate === bookedInfo.startDate)
                    const isBookedStart = isBooked && !isBookedSingle && ds === bookedInfo.startDate
                    const isBookedEnd = isBooked && !isBookedSingle && ds === bookedInfo.endDate
                    // Show booked bands only when not overridden by current selection
                    const showBookedBand = isBooked && !isStart && !isEnd && !inRange
                    const showBookedLeft = showBookedBand && !isBookedStart && !isBookedSingle && dow !== 0
                    const showBookedRight = showBookedBand && !isBookedEnd && !isBookedSingle && dow !== 6

                    // ── Selection band segments ──────────────────────────
                    const showLeft = (inRange || isEnd) && !isSingle && dow !== 0
                    const showRight = (inRange || isStart) && !isSingle && dow !== 6

                    const circleClass =
                        (isStart || isEnd)
                            ? 'bg-indigo-600 text-white font-bold shadow-md'
                            : inRange
                                ? 'text-indigo-900 hover:bg-indigo-200'
                                : isBooked
                                    ? 'bg-rose-100 text-rose-700 font-medium hover:bg-rose-200'
                                    : isToday
                                        ? 'text-indigo-600 font-semibold ring-2 ring-indigo-400 ring-offset-1 hover:bg-indigo-50'
                                        : 'text-gray-700 hover:bg-gray-100'

                    return (
                        <div key={ds} className="relative h-10">
                            {/* Booked band – left half */}
                            {showBookedLeft && (
                                <div className="absolute top-1.5 bottom-1.5 left-0 right-1/2 bg-rose-100" />
                            )}
                            {/* Booked band – right half */}
                            {showBookedRight && (
                                <div className="absolute top-1.5 bottom-1.5 left-1/2 right-0 bg-rose-100" />
                            )}
                            {/* Selection band – left half */}
                            {showLeft && (
                                <div className="absolute top-1.5 bottom-1.5 left-0 right-1/2 bg-indigo-100" />
                            )}
                            {/* Selection band – right half */}
                            {showRight && (
                                <div className="absolute top-1.5 bottom-1.5 left-1/2 right-0 bg-indigo-100" />
                            )}
                            {/* Date circle */}
                            <button
                                type="button"
                                onClick={() => onDayClick(ds)}
                                onMouseEnter={() => onDayHover(ds)}
                                className={`relative z-10 w-9 h-9 mx-auto flex items-center
                                            justify-center rounded-full text-sm transition-colors
                                            ${circleClass}`}
                            >
                                {day}
                            </button>
                            {/* Booked dot indicator (shown when day is booked and not in current selection) */}
                            {showBookedBand && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2
                                                 w-1 h-1 rounded-full bg-rose-400 z-20 pointer-events-none" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Main DateRangePicker component ────────────────────────────────────────────

export default function DateRangePicker({ startDate = '', endDate = '', onChange, error, bookedIntervals = [] }) {
    const now = new Date()
    // Normalize: treat endDate === startDate as no end date
    const effEnd = endDate && endDate !== startDate ? endDate : ''

    const [vy, setVy] = useState(startDate ? +startDate.slice(0, 4) : now.getFullYear())
    const [vm, setVm] = useState(startDate ? +startDate.slice(5, 7) - 1 : now.getMonth())
    const [open, setOpen] = useState(false)
    const [selecting, setSelecting] = useState(false)   // waiting for end-date click
    const [hoverDate, setHoverDate] = useState(null)

    const [vy2, vm2] = addMonths(vy, vm, 1)

    const handleDayClick = (ds) => {
        if (!selecting) {
            // First click: anchor start date, begin range selection
            onChange({ startDate: ds, endDate: '' })
            setSelecting(true)
            setHoverDate(ds)
        } else {
            // Second click: finalise range
            if (ds === startDate) {
                // Clicking same date = single-day event
                onChange({ startDate: ds, endDate: '' })
            } else {
                const [s, e] = ds > startDate ? [startDate, ds] : [ds, startDate]
                onChange({ startDate: s, endDate: e })
            }
            setSelecting(false)
            setHoverDate(null)
            setOpen(false)
        }
    }

    const handleDayHover = (ds) => {
        if (selecting) setHoverDate(ds)
    }

    const handleClear = () => {
        onChange({ startDate: '', endDate: '' })
        setSelecting(false)
        setHoverDate(null)
    }

    const prev = () => { const [y, m] = addMonths(vy, vm, -1); setVy(y); setVm(m) }
    const next = () => { const [y, m] = addMonths(vy, vm, 1); setVy(y); setVm(m) }

    const nights = startDate && effEnd
        ? Math.round((new Date(effEnd + 'T00:00:00') - new Date(startDate + 'T00:00:00')) / 86400000)
        : 0

    const displayText = startDate
        ? effEnd
            ? `${fmtLabel(startDate)}  —  ${fmtLabel(effEnd)}  ·  ${nights} night${nights !== 1 ? 's' : ''}`
            : fmtLabel(startDate)
        : null

    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                Event Date(s) *
            </label>

            {/* ── Trigger button ── */}
            <button
                type="button"
                onClick={() => { setOpen(o => !o); if (open) { setSelecting(false); setHoverDate(null) } }}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm
                            text-left border transition-all bg-white
                            ${error ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'}
                            ${open ? 'ring-2 ring-indigo-500 border-indigo-400' : 'hover:border-indigo-300'}`}
            >
                <Calendar size={16} className="text-indigo-400 shrink-0" />
                <span className={`flex-1 ${displayText ? 'text-gray-900' : 'text-gray-400'}`}>
                    {displayText ?? 'Select event date(s)'}
                </span>
                {startDate && (
                    <span
                        role="button"
                        tabIndex={-1}
                        onClick={e => { e.stopPropagation(); handleClear() }}
                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={14} />
                    </span>
                )}
            </button>

            {error && <p className="text-xs text-red-600">{error}</p>}

            {/* Hint while selecting end date */}
            {open && selecting && (
                <p className="text-xs text-indigo-600 font-medium pl-1">
                    Now select end date, or click {fmtLabel(startDate)} again for a single-day event.
                </p>
            )}

            {/* ── Calendar panel ── */}
            {open && (
                <div
                    className="border border-gray-200 rounded-2xl bg-white shadow-xl overflow-hidden"
                    onMouseLeave={() => selecting && setHoverDate(null)}
                >
                    {/* Navigation row */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-1">
                        <button type="button" onClick={prev}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs text-gray-400 font-medium select-none">
                            {selecting ? 'Select end date →' : 'Select start date →'}
                        </span>
                        <button type="button" onClick={next}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Month grids — 2 columns on md+, stacked on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 px-4 pb-2 gap-y-4 md:gap-x-0 md:divide-x divide-gray-100">
                        <MonthGrid
                            year={vy} month={vm}
                            rangeStart={startDate} rangeEnd={effEnd}
                            hoverDate={hoverDate} selecting={selecting}
                            onDayClick={handleDayClick} onDayHover={handleDayHover}
                            bookedIntervals={bookedIntervals}
                        />
                        <div className="border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <MonthGrid
                                year={vy2} month={vm2}
                                rangeStart={startDate} rangeEnd={effEnd}
                                hoverDate={hoverDate} selecting={selecting}
                                onDayClick={handleDayClick} onDayHover={handleDayHover}
                                bookedIntervals={bookedIntervals}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        {/* Legend */}
                        {bookedIntervals.length > 0 && (
                            <div className="flex items-center gap-4 mb-2.5">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                    Your selection
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-rose-500">
                                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-200 border border-rose-400" />
                                    Already booked
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <button
                                type="button" onClick={handleClear}
                                className="text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
                            >
                                Clear
                            </button>
                            <div className="flex items-center gap-2">
                                {nights > 0 && (
                                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                                        {nights} night{nights !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {startDate && !selecting && (
                                    <button
                                        type="button" onClick={() => setOpen(false)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs
                                                   font-semibold px-4 py-1.5 rounded-lg transition-colors"
                                    >
                                        Done
                                    </button>
                                )}
                                {selecting && (
                                    <button
                                        type="button"
                                        onClick={() => { setSelecting(false); setHoverDate(null); setOpen(false) }}
                                        className="bg-gray-500 hover:bg-gray-600 text-white text-xs
                                                   font-semibold px-4 py-1.5 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
