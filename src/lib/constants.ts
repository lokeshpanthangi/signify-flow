/**
 * Shared Constants
 * ================
 * Reusable constants used across multiple pages/components.
 */

/* ─── A4 Paper Dimensions (at 96 DPI) ─── */
export const A4_WIDTH = 816;
export const A4_HEIGHT = 1056;

/* ─── Recipient Color Palette ─── */

/** Full color objects (Tailwind classes + hex) — used in template builder */
export const RECIPIENT_COLORS = [
    { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', dot: 'bg-green-500', ring: 'ring-green-400', hex: '#22c55e', avatar: 'bg-green-500' },
    { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', dot: 'bg-blue-500', ring: 'ring-blue-400', hex: '#3b82f6', avatar: 'bg-blue-500' },
    { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', dot: 'bg-amber-500', ring: 'ring-amber-400', hex: '#f59e0b', avatar: 'bg-amber-500' },
    { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', dot: 'bg-purple-500', ring: 'ring-purple-400', hex: '#a855f7', avatar: 'bg-purple-500' },
    { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', dot: 'bg-rose-500', ring: 'ring-rose-400', hex: '#f43f5e', avatar: 'bg-rose-500' },
    { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', dot: 'bg-teal-500', ring: 'ring-teal-400', hex: '#14b8a6', avatar: 'bg-teal-500' },
];

/** Just hex strings — used in signing interface & sign form detail */
export const RECIPIENT_HEX_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6'];

/* ─── Document Status Colors ─── */
export const STATUS_COLORS: Record<string, string> = {
    signed: 'text-green-600',
    pending: 'text-amber-600',
    declined: 'text-red-500',
    draft: 'text-stone-400',
    completed: 'text-green-600',
};
