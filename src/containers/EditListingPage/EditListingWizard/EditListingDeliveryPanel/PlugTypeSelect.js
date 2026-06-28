/**
 * PlugTypeSelect — custom select with inline SVG connector diagrams.
 * Each option shows a small SVG diagram of the pin layout so owners can
 * visually match the connector on their trailer.
 */
import React, { useState, useRef, useEffect } from 'react';

// ─── SVG diagrams ────────────────────────────────────────────────────────────

const SevenPinFlatSvg = () => (
  <svg viewBox="0 0 44 30" width="44" height="30" fill="none" aria-hidden="true">
    {/* Housing */}
    <rect x="1.5" y="1.5" width="41" height="27" rx="3" stroke="currentColor" strokeWidth="1.2" />
    {/* Top row — 3 pins */}
    <rect x="9"  y="6.5" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="19.5" y="6.5" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="30" y="6.5" width="5" height="9" rx="1" stroke="currentColor" strokeWidth="1" />
    {/* Bottom row — 4 pins */}
    <rect x="4"  y="18.5" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="13" y="18.5" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="26" y="18.5" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="35" y="18.5" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const FourPinFlatSvg = () => (
  <svg viewBox="0 0 44 22" width="44" height="22" fill="none" aria-hidden="true">
    {/* Housing */}
    <rect x="1.5" y="1.5" width="41" height="19" rx="3" stroke="currentColor" strokeWidth="1.2" />
    {/* 4 pins in a single row */}
    <rect x="4"  y="6" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="14" y="6" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="24" y="6" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="34" y="6" width="7" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const SevenPinRoundSvg = () => (
  <svg viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true">
    {/* Round housing */}
    <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.3" />
    {/* 6 outer pins at 0°, 60°, 120°, 180°, 240°, 300° on r=12 */}
    <circle cx="32"   cy="20"   r="2.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="26"   cy="9.6"  r="2.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="14"   cy="9.6"  r="2.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="8"    cy="20"   r="2.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="14"   cy="30.4" r="2.5" stroke="currentColor" strokeWidth="1" />
    <circle cx="26"   cy="30.4" r="2.5" stroke="currentColor" strokeWidth="1" />
    {/* Center pin */}
    <circle cx="20" cy="20" r="2.5" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const FivePinFlatSvg = () => (
  <svg viewBox="0 0 44 22" width="44" height="22" fill="none" aria-hidden="true">
    {/* Housing */}
    <rect x="1.5" y="1.5" width="41" height="19" rx="3" stroke="currentColor" strokeWidth="1.2" />
    {/* 5 pins in a single row */}
    <rect x="3"   y="6" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="11.5" y="6" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="20"  y="6" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="28.5" y="6" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
    <rect x="37"  y="6" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// ─── Option definitions ───────────────────────────────────────────────────────

const PLUG_OPTIONS = [
  {
    value: '7pin-flat',
    label: '7-pin flat blade',
    sublabel: 'Most common — modern trucks',
    Diagram: SevenPinFlatSvg,
  },
  {
    value: '4pin-flat',
    label: '4-pin flat',
    sublabel: 'Small / light trailers — lights only',
    Diagram: FourPinFlatSvg,
  },
  {
    value: '7pin-round',
    label: '7-pin round',
    sublabel: 'Older & heavy-duty trucks',
    Diagram: SevenPinRoundSvg,
  },
  {
    value: '5pin-flat',
    label: '5-pin flat',
    sublabel: 'Mid-size trailers with brakes',
    Diagram: FivePinFlatSvg,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const PlugTypeSelect = ({ value, onChange, id }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = PLUG_OPTIONS.find(o => o.value === value) || null;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerStyle = {
    position: 'relative',
    width: '100%',
  };

  const triggerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.875rem',
    color: '#111827',
    boxSizing: 'border-box',
  };

  const placeholderStyle = {
    color: '#9ca3af',
    fontSize: '0.875rem',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 100,
    overflow: 'hidden',
  };

  const optionStyle = (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    background: isSelected ? '#fff8f0' : '#fff',
    borderBottom: '1px solid #f3f4f6',
  });

  const diagramWrapStyle = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
  };

  const labelBlockStyle = {
    flex: 1,
  };

  const labelStyle = {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#111827',
    display: 'block',
  };

  const sublabelStyle = {
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'block',
    marginTop: '1px',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      <button
        type="button"
        id={id}
        style={triggerStyle}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span style={diagramWrapStyle}>
              <selected.Diagram />
            </span>
            <span style={{ flex: 1, fontWeight: 500 }}>{selected.label}</span>
          </>
        ) : (
          <span style={placeholderStyle}>Select plug type...</span>
        )}
        <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: '0.7rem' }}>▾</span>
      </button>

      {open && (
        <div style={dropdownStyle} role="listbox" aria-label="Plug type">
          <div
            style={{ ...optionStyle(false), color: '#9ca3af' }}
            onClick={() => { onChange(''); setOpen(false); }}
            role="option"
            aria-selected={!value}
          >
            <span>Select plug type...</span>
          </div>
          {PLUG_OPTIONS.map(opt => (
            <div
              key={opt.value}
              style={optionStyle(value === opt.value)}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              role="option"
              aria-selected={value === opt.value}
            >
              <span style={diagramWrapStyle}>
                <opt.Diagram />
              </span>
              <span style={labelBlockStyle}>
                <span style={labelStyle}>{opt.label}</span>
                <span style={sublabelStyle}>{opt.sublabel}</span>
              </span>
              {value === opt.value && (
                <span style={{ color: '#E8450A', fontWeight: 700, fontSize: '0.9rem' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlugTypeSelect;
