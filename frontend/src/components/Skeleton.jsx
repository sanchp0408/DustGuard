import React from 'react';

export const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 rounded-2xl ${className}`} />
);

export const MetricSkeleton = () => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
        <Skeleton className="w-12 h-12" />
        <div className="space-y-2">
            <Skeleton className="w-24 h-3" />
            <Skeleton className="w-32 h-8" />
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 h-80 flex flex-col gap-8">
        <div className="flex justify-between">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="flex-1 w-full" />
    </div>
);

export const TableSkeleton = () => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-20 h-4" />
        </div>
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between py-4 border-b border-slate-50">
                    <Skeleton className="w-48 h-10" />
                    <Skeleton className="w-20 h-6" />
                    <Skeleton className="w-16 h-8" />
                    <Skeleton className="w-32 h-6" />
                </div>
            ))}
        </div>
    </div>
);
