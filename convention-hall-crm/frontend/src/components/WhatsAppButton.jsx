import { useState } from 'react'
import { MessageCircle, CheckCircle, X, Send, Copy, Check, Heart } from 'lucide-react'
import {
    buildConfirmationMessage, buildConfirmationWhatsAppUrl,
    buildReminderMessage, buildReminderWhatsAppUrl,
    buildThankYouMessage, buildThankYouWhatsAppUrl,
} from '../api/bookingApi'

/**
 * mode="confirm"   → preview + send booking confirmation
 * mode="reminder"  → preview + send payment reminder
 * mode="thankyou"  → preview + send thank-you + feedback message
 */
export default function WhatsAppButton({ booking, mode = 'reminder', label, className = '' }) {
    const [showPreview, setShowPreview] = useState(false)
    const [copied, setCopied] = useState(false)

    const isConfirm = mode === 'confirm'
    const isThankyou = mode === 'thankyou'
    const message = isConfirm
        ? buildConfirmationMessage(booking)
        : isThankyou
            ? buildThankYouMessage(booking)
            : buildReminderMessage(booking)
    const whatsappUrl = isConfirm
        ? buildConfirmationWhatsAppUrl(booking)
        : isThankyou
            ? buildThankYouWhatsAppUrl(booking)
            : buildReminderWhatsAppUrl(booking)
    const defaultLabel = isConfirm ? 'Send Confirmation' : isThankyou ? 'Thank You' : 'Send Reminder'
    const Icon = isConfirm ? CheckCircle : isThankyou ? Heart : MessageCircle
    const baseClass = isConfirm
        ? 'bg-emerald-500 hover:bg-emerald-600'
        : isThankyou
            ? 'bg-pink-500 hover:bg-pink-600'
            : 'bg-green-500 hover:bg-green-600'

    const handleCopy = () => {
        navigator.clipboard.writeText(message).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`inline-flex items-center gap-1.5 ${baseClass} text-white
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${className}`}
            >
                <Icon size={15} />
                {label ?? defaultLabel}
            </button>

            {showPreview && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center
                               justify-center p-0 md:p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false) }}
                >
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl
                                    shadow-2xl flex flex-col max-h-[92vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4
                                        border-b border-gray-100 shrink-0">
                            <div>
                                <h3 className="font-bold text-gray-900">
                                    {isConfirm ? 'Booking Confirmation' : isThankyou ? 'Thank You Message' : 'Payment Reminder'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Review before sending to {booking.customerName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Message preview */}
                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            <div
                                className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap
                                           bg-gray-50 border border-gray-200 rounded-xl p-4
                                           break-words font-sans"
                            >
                                {message}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 border-2 border-gray-200
                                           text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold
                                           hover:bg-gray-50 transition-colors"
                            >
                                {copied
                                    ? <><Check size={16} className="text-green-600" /> Copied</>
                                    : <><Copy size={16} /> Copy</>
                                }
                            </button>
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowPreview(false)}
                                className="flex-1 flex items-center justify-center gap-2
                                           bg-green-600 hover:bg-green-700 text-white
                                           px-4 py-2.5 rounded-xl text-sm font-semibold
                                           transition-colors shadow-sm"
                            >
                                <Send size={16} />
                                Send via WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

