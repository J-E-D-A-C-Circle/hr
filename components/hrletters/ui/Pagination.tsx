"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 6,
  onPageChange,
}) => {
  if (totalItems === 0 || totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers
  const pages: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div
      className="flex items-center justify-between px-5 py-3 border-t flex-wrap gap-3"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="text-xs" style={{ color: "var(--color-text-3)" }}>
        Showing <span className="font-semibold text-[--color-text-1]">{startItem}</span> to{" "}
        <span className="font-semibold text-[--color-text-1]">{endItem}</span> of{" "}
        <span className="font-semibold text-[--color-text-1]">{totalItems}</span> entries
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeft className="w-4 h-4" />}
          title="Previous Page"
        >
          Prev
        </Button>

        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer border ${
                currentPage === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "hover:bg-[--color-border-subtle] border-transparent"
              }`}
              style={
                currentPage !== p
                  ? { color: "var(--color-text-2)", borderColor: "var(--color-border)" }
                  : undefined
              }
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-xs text-[--color-text-4]">
              ...
            </span>
          )
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          iconRight={<ChevronRight className="w-4 h-4" />}
          title="Next Page"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
