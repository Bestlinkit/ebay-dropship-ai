import React from 'react';
import { cn } from '../lib/utils';

export const Shimmer = ({ className }) => (
  <div className={cn("animate-pulse bg-slate-100 rounded-lg", className)} />
);

export const CardSkeleton = ({ height = "120px" }) => (
  <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-4" style={{ height }}>
    <div className="flex justify-between items-center">
       <Shimmer className="h-3 w-20" />
       <Shimmer className="h-8 w-8 rounded-xl" />
    </div>
    <div className="flex justify-between items-end">
       <Shimmer className="h-8 w-32" />
       <Shimmer className="h-4 w-12" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-6 border-b border-slate-50 gap-4">
    <div className="flex items-center gap-4 flex-1">
       <Shimmer className="h-10 w-10 rounded-xl" />
       <div className="space-y-2 flex-1">
          <Shimmer className="h-3 w-3/4" />
          <Shimmer className="h-2 w-1/4 opacity-50" />
       </div>
    </div>
    <Shimmer className="h-4 w-20 hidden md:block" />
    <Shimmer className="h-4 w-16" />
    <Shimmer className="h-8 w-8 rounded-lg" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white p-8 rounded-[1.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col gap-6">
    <div className="flex justify-between items-center">
       <div className="space-y-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-2 w-48" />
       </div>
       <div className="flex gap-2">
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-8 w-16" />
       </div>
    </div>
    <div className="flex-1 flex items-end gap-4 pb-4">
       {Array(10).fill(0).map((_, i) => (
         <Shimmer 
            key={i} 
            className="flex-1 rounded-t-xl" 
            style={{ height: `${Math.random() * 60 + 20}%` }} 
         />
       ))}
    </div>
  </div>
);
