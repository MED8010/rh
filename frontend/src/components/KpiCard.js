import React from 'react';

const KpiCard = ({ title, value, unit, icon, trend, subLabel, variant = 'primary', onClick }) => {
  const isPositive = trend > 0;
  const trendColor = isPositive ? 'var(--success)' : 'var(--danger)';
  const trendIcon = isPositive ? '↑' : '↓';

  return (
    <div 
      className={`kpi-card kpi-${variant} animate-fade-in`} 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s ease', position: 'relative' }}
    >
      <div className="kpi-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="kpi-icon-box" style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ color: trendColor, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            {trendIcon} {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <p className="kpi-label" style={{ fontSize: 12.5, marginBottom: 6, fontWeight: 600 }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <p className="kpi-value" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{value}</p>
          {unit && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>}
        </div>
        <p className="kpi-subtitle" style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>{subLabel}</p>
      </div>

      {onClick && (
        <div style={{ position: 'absolute', right: 16, bottom: 16, fontSize: 18, opacity: 0.3 }}>
          🔍
        </div>
      )}
    </div>
  );
};

export default KpiCard;
