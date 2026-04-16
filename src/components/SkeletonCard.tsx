const shimmer: React.CSSProperties = {
  backgroundColor: '#f0e4d8',
  borderRadius: '4px',
  animation: 'shimmer 1.6s ease-in-out infinite',
}

export function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px 28px',
      border: '1px solid #f0e4d8',
      boxShadow: '0 2px 12px rgba(180, 120, 80, 0.07)',
      marginBottom: '16px',
    }}>
      {/* Number */}
      <div style={{ ...shimmer, width: '20px', height: '10px', marginBottom: '8px', opacity: 0.6 }} />

      {/* Title */}
      <div style={{ ...shimmer, width: '65%', height: '22px', marginBottom: '20px' }} />

      {/* Section 1 */}
      <div style={{ ...shimmer, width: '52px', height: '8px', marginBottom: '6px' }} />
      <div style={{ ...shimmer, width: '100%', height: '13px', marginBottom: '4px' }} />
      <div style={{ ...shimmer, width: '80%', height: '13px' }} />

      {/* Section 2 */}
      <div style={{ ...shimmer, width: '80px', height: '8px', marginBottom: '6px', marginTop: '18px' }} />
      <div style={{ ...shimmer, width: '100%', height: '13px', marginBottom: '4px' }} />
      <div style={{ ...shimmer, width: '70%', height: '13px' }} />

      {/* Example block */}
      <div style={{ marginTop: '18px' }}>
        <div style={{ ...shimmer, width: '52px', height: '8px', marginBottom: '6px' }} />
        <div style={{
          backgroundColor: '#fdf4ee',
          borderLeft: '3px solid #f0c8a8',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          height: '56px',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}
