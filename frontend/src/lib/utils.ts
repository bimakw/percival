import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: string | undefined): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project Status
    Planning: 'bg-blue-100 text-blue-800',
    Active: 'bg-green-100 text-green-800',
    OnHold: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-gray-100 text-gray-800',
    Cancelled: 'bg-red-100 text-red-800',
    // Task Status
    Todo: 'bg-slate-100 text-slate-800',
    inprogress: 'bg-blue-100 text-blue-800',
    Review: 'bg-purple-100 text-purple-800',
    Done: 'bg-green-100 text-green-800',
    Blocked: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    Low: 'bg-slate-100 text-slate-800',
    Medium: 'bg-blue-100 text-blue-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}
