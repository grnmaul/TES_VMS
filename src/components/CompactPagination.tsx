'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function CompactPagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className 
}: CompactPaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageButtons = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // Number of pages to show around current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return (
          <span 
            key={`dots-${index}`} 
            className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs font-bold"
          >
            ...
          </span>
        );
      }

      const isCurrent = currentPage === page;

      return (
        <button
          key={`page-${page}`}
          onClick={() => onPageChange(page as number)}
          className={cn(
            "w-8 h-8 rounded-xl text-xs font-black transition-all",
            isCurrent 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
              : "text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          )}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
        title="Sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-1">
        {renderPageButtons()}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 text-gray-400 hover:text-emerald-600 disabled:opacity-20 transition-colors"
        title="Selanjutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
