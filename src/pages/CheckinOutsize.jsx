import React from 'react'

const CheckinOutsize = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: 320,
        maxWidth: '90vw',
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="32" fill="#E0E7FF"/>
          <path d="M32 20V36" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="32" cy="44" r="2.5" fill="#6366F1"/>
        </svg>
        <h2 style={{
          margin: '24px 0 8px 0',
          fontSize: 24,
          fontWeight: 700,
          color: '#3730A3',
          textAlign: 'center'
        }}>
          Coming Soon!
        </h2>
        <p style={{
          color: '#6B7280',
          fontSize: 16,
          textAlign: 'center'
        }}>
          This feature is under development.<br />
          Stay tuned for updates.
        </p>
      </div>
    </div>
  )
}

export default CheckinOutsize