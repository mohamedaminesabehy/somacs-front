import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getVisiblePages(totalPages, currentPage) {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
}

export default function CompactPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  className = 'px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
}) {
  if (totalPages <= 1) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const pages = getVisiblePages(totalPages, currentPage)

  return (
    <div className={className}>
      <p className="text-xs text-slate-500 font-medium">
        {start}–{end} sur {totalItems}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={() => onPageChange((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all">
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, index) => (
          <span key={page}>
            {index > 0 && pages[index - 1] !== page - 1 && <span className="text-slate-300 px-1">…</span>}
            <button onClick={() => onPageChange(page)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{page}</button>
          </span>
        ))}
        <button onClick={() => onPageChange((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
