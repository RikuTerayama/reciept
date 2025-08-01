'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width = 'w-full', height = 'h-4' }: SkeletonProps) {
  return (
    <div
      className={`
        bg-surface-700 rounded animate-pulse
        ${width} ${height} ${className}
      `}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="h-4"
          className={index === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface-800 rounded-lg p-6 border border-surface-700 ${className}`}>
      <div className="space-y-4">
        <Skeleton height="h-6" className="w-1/2" />
        <SkeletonText lines={2} />
        <div className="flex space-x-2">
          <Skeleton height="h-8" className="w-20" />
          <Skeleton height="h-8" className="w-24" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-800 rounded-lg border border-surface-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-900/50 border-b border-surface-700">
            <tr>
              {Array.from({ length: 6 }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left">
                  <Skeleton height="h-4" className="w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 6 }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    <Skeleton height="h-4" className="w-16" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonForm({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton height="h-4" className="w-16" />
          <Skeleton height="h-12" />
        </div>
        <div className="space-y-2">
          <Skeleton height="h-4" className="w-20" />
          <Skeleton height="h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height="h-4" className="w-24" />
        <Skeleton height="h-12" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Skeleton height="h-4" className="w-12" />
          <Skeleton height="h-12" />
        </div>
        <div className="space-y-2">
          <Skeleton height="h-4" className="w-16" />
          <Skeleton height="h-12" />
        </div>
        <div className="space-y-2">
          <Skeleton height="h-4" className="w-20" />
          <Skeleton height="h-12" />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6">
        <Skeleton height="h-12" className="w-24" />
        <Skeleton height="h-12" className="w-20" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ items = 6 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-surface-800 rounded-lg p-6 border border-surface-700">
          <div className="text-center">
            <Skeleton height="h-8" className="w-24 mx-auto mb-2" />
            <Skeleton height="h-4" className="w-20 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
} 
