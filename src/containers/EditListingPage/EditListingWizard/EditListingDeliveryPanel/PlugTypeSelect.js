/**
 * PlugTypeSelect — custom select with inline SVG connector diagrams.
 * Each option shows a small SVG diagram of the pin layout so owners can
 * visually match the connector on their trailer.
 */
import React, { useState, useRef, useEffect } from 'react';

// ─── SVG diagrams ────────────────────────────────────────────────────────────

// 7-pin round: circular housing, 6 round pins around perimeter + 1 center
const SevenPinRoundSvg = () => (
  <svg viewBox="0 0 54 54" width="54" height="54" aria-hidden="true">
    {/* Housing face */}
    <circle cx="27" cy="27" r="25" fill="#e8e8e8" stroke="#555" strokeWidth="1.5" />
    {/* 6 outer pins evenly spaced on r=16 */}
    <circle cx="27"    cy="11"   r="4" fill="#333" />
    <circle cx="40.9"  cy="19"   r="4" fill="#333" />
    <circle cx="40.9"  cy="35"   r="4" fill="#333" />
    <circle cx="27"    cy="43"   r="4" fill="#333" />
    <circle cx="13.1"  cy="35"   r="4" fill="#333" />
    <circle cx="13.1"  cy="19"   r="4" fill="#333" />
    {/* Center pin */}
    <circle cx="27" cy="27" r="4" fill="#333" />
  </svg>
);

// 7-pin flat blade: round housing, 7 flat blade contacts (standard SAE layout)
const SevenPinFlatSvg = () => (
  <svg viewBox="0 0 54 54" width="54" height="54" aria-hidden="true">
    {/* Housing face */}
    <circle cx="27" cy="27" r="25" fill="#e8e8e8" stroke="#555" strokeWidth="1.5" />
    {/* 6 outer blade pins (flat rectangles) on r=16 — rotated to point toward center */}
    {/* Top */}
    <rect x="24" y="9" width="6" height="10" rx="1" fill="#333" />
    {/* Top-right */}
    <rect x="37" y="15" width="6" height="10" rx="1" fill="#333" transform="rotate(60 40 20)" />
    {/* Bottom-right */}
    <rect x="37" y="29" width="6" height="10" rx="1" fill="#333" transform="rotate(120 40 34)" />
    {/* Bottom */}
    <rect x="24" y="35" width="6" height="10" rx="1" fill="#333" />
    {/* Bottom-left */}
    <rect x="11" y="29" width="6" height="10" rx="1" fill="#333" transform="rotate(-120 14 34)" />
    {/* Top-left */}
    <rect x="11" y="15" width="6" height="10" rx="1" fill="#333" transform="rotate(-60 14 20)" />
    {/* Center blade (ground — larger) */}
    <rect x="23" y="22" width="8" height="10" rx="1" fill="#333" />
  </svg>
);

// 4-pin flat: small rectangular housing, 4 flat pins in a row
const FourPinFlatSvg = () => (
  <svg viewBox="0 0 70 32" width="70" height="32" aria-hidden="true">
    {/* Housing */}
    <rect x="1" y="1" width="68" height="30" rx="4" fill="#e8e8e8" stroke="#555" strokeWidth="1.5" />
    {/* 4 flat blade pins */}
    <rect x="7"  y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="21" y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="38" y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="52" y="8" width="11" height="16" rx="1.5" fill="#333" />
  </svg>
);

// 5-pin flat: rectangular housing, 5 flat pins in a row
const FivePinFlatSvg = () => (
  <svg viewBox="0 0 82 32" width="82" height="32" aria-hidden="true">
    {/* Housing */}
    <rect x="1" y="1" width="80" height="30" rx="4" fill="#e8e8e8" stroke="#555" strokeWidth="1.5" />
    {/* 5 flat blade pins */}
    <rect x="5"  y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="20" y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="35" y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="50" y="8" width="11" height="16" rx="1.5" fill="#333" />
    <rect x="65" y="8" width="11" height="16" rx="1.5" fill="#333" />
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
