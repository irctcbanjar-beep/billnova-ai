import React from 'react';

const variants = {
  'Paid': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Overdue': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Draft': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Partially Paid': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Sent': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Active': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Inactive': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Low Stock': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Free': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Starter': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Pro': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Enterprise': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function Badge({ label, variant }) {
  const cls = variants[variant || label] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
