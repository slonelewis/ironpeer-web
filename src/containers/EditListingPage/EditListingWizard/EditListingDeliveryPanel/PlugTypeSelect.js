/**
 * PlugTypeSelect — custom select with inline SVG connector diagrams.
 * Each option shows a small SVG diagram of the pin layout so owners can
 * visually match the connector on their trailer.
 */
import React, { useState, useRef, useEffect } from 'react';

// ─── SVG diagrams ────────────────────────────────────────────────────────────

// ─── 7-pin ROUND: circular housing + 7 filled CIRCLE pins ───────────────────
// Round pins = solid circles. 6 around edge + 1 center.
const SevenPinRoundSvg = () => (
  <svg viewBox="0 0 64 74" width="64" height="74" aria-hidden="true">
    {/* Circular housing */}
    <circle cx="32" cy="32" r="30" fill="#ddd" stroke="#444" strokeWidth="2" />
    {/* 6 outer ROUND pins at r=19 */}
    <circle cx="32"   cy="13"  r="5" fill="#222" />  {/* top */}
    <circle cx="48.5" cy="22"  r="5" fill="#222" />  {/* top-right */}
    <circle cx="48.5" cy="42"  r="5" fill="#222" />  {/* bottom-right */}
    <circle cx="32"   cy="51"  r="5" fill="#222" />  {/* bottom */}
    <circle cx="15.5" cy="42"  r="5" fill="#222" />  {/* bottom-left */}
    <circle cx="15.5" cy="22"  r="5" fill="#222" />  {/* top-left */}
    {/* Center ROUND pin */}
    <circle cx="32" cy="32" r="5" fill="#222" />
    {/* Label */}
    <text x="32" y="70" textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">round pins</text>
  </svg>
);

// ─── 7-pin FLAT BLADE: circular housing + 7 FLAT BLADE contacts ─────────────
// Same circular housing as round, but pins are flat rectangles (blades).
// Pre-calculated positions for 6 blades on r=19 + 1 center blade.
const SevenPinFlatSvg = () => (
  <svg viewBox="0 0 64 74" width="64" height="74" aria-hidden="true">
    {/* Circular housing */}
    <circle cx="32" cy="32" r="30" fill="#ddd" stroke="#444" strokeWidth="2" />
    {/* 6 outer FLAT BLADE pins — rectangles centered at same positions as round variant */}
    {/* top (0°) */}
    <rect x="28.5" y="10" width="7" height="11" rx="1" fill="#222" />
    {/* top-right (60°) — centered at 48.5,22 */}
    <rect x="45" y="19" width="7" height="11" rx="1" fill="#222" />
    {/* bottom-right (120°) — centered at 48.5,42 */}
    <rect x="45" y="39" width="7" height="11" rx="1" fill="#222" />
    {/* bottom (180°) */}
    <rect x="28.5" y="46" width="7" height="11" rx="1" fill="#222" />
    {/* bottom-left (240°) — centered at 15.5,42 */}
    <rect x="12" y="39" width="7" height="11" rx="1" fill="#222" />
    {/* top-left (300°) — centered at 15.5,22 */}
    <rect x="12" y="19" width="7" height="11" rx="1" fill="#222" />
    {/* Center FLAT BLADE (wider — ground pin) */}
    <rect x="27" y="27" width="10" height="10" rx="1" fill="#222" />
    {/* Label */}
    <text x="32" y="70" textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">flat blades</text>
  </svg>
);

// ─── 4-pin FLAT: rectangular housing + 4 flat blade pins in a row ────────────
const FourPinFlatSvg = () => (
  <svg viewBox="0 0 80 50" width="80" height="50" aria-hidden="true">
    {/* Rectangular housing */}
    <rect x="1" y="1" width="78" height="36" rx="5" fill="#ddd" stroke="#444" strokeWidth="2" />
    {/* 4 flat blade pins */}
    <rect x="8"  y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="24" y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="43" y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="59" y="8" width="13" height="22" rx="2" fill="#222" />
    {/* Label */}
    <text x="40" y="47" textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">flat blades</text>
  </svg>
);

// ─── 5-pin FLAT: rectangular housing + 5 flat blade pins in a row ────────────
const FivePinFlatSvg = () => (
  <svg viewBox="0 0 96 50" width="96" height="50" aria-hidden="true">
    {/* Rectangular housing */}
    <rect x="1" y="1" width="94" height="36" rx="5" fill="#ddd" stroke="#444" strokeWidth="2" />
    {/* 5 flat blade pins */}
    <rect x="6"  y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="22" y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="41" y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="57" y="8" width="13" height="22" rx="2" fill="#222" />
    <rect x="76" y="8" width="13" height="22" rx="2" fill="#222" />
    {/* Label */}
    <text x="48" y="47" textAnchor="middle" fontSize="9" fill="#555" fontFamily="sans-serif">flat blades</text>
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
