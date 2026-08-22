import React from 'react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeType?: 'default' | 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
  progress?: number;
  progressColor?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  footerText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  badge,
  badgeType = 'default',
  progress,
  progressColor = 'bg-[#00f2ff]',
  accentColor,
  icon,
  footerText,
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'cyan':
        return 'bg-[#00f2ff]/10 text-[#00f2ff] border-[#00f2ff]/30';
      case 'purple':
        return 'bg-[#bd00ff]/10 text-[#bd00ff] border-[#bd00ff]/30';
      case 'emerald':
        return 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30';
      case 'amber':
        return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
      case 'rose':
        return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30';
      default:
        return 'bg-[#2d333d] text-[#94a3b8] border-[#3b4452]';
    }
  };

  return (
    <div
      id={id}
      className="bg-[#151921] border border-[#2d333d] rounded-xl p-5 flex flex-col justify-between hover:border-[#3d4553] transition-all shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">{title}</span>
        {badge ? (
          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${getBadgeClass()}`}>
            {badge}
          </span>
        ) : (
          icon && <div className="text-[#94a3b8]">{icon}</div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div
          className="text-2xl sm:text-3xl font-bold tracking-tight font-sans"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {value}
        </div>
        {subtitle && <span className="text-xs font-medium text-[#94a3b8] font-mono">{subtitle}</span>}
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="w-full bg-[#1a202c] rounded-full h-1.5 overflow-hidden border border-[#2d333d]/40">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {footerText && (
        <div className="mt-2.5 pt-2 border-t border-[#2d333d]/50 text-[11px] text-[#94a3b8] font-mono flex items-center justify-between">
          <span>{footerText}</span>
        </div>
      )}
    </div>
  );
};
