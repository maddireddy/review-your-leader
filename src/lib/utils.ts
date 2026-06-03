import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function getPartyColor(party: string): string {
  const colors: Record<string, string> = {
    BJP: '#FF6B00',
    INC: '#19AAED',
    AAP: '#0066FF',
    TMC: '#267EC2',
    SP: '#FF0000',
    BSP: '#1B7F4F',
    JDU: '#005B96',
    'Shiv Sena': '#FF8C00',
    NCP: '#C02942',
    CPI: '#CC0000',
    'CPI(M)': '#FF0000',
    YSRCP: '#0073B1',
    TDP: '#FFDE00',
    AIADMK: '#00AF12',
    DMK: '#CC0000',
    Independent: '#808080',
  };
  return colors[party] || '#6366f1';
}

export function getAttendanceColor(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#eab308';
  return '#ef4444';
}
