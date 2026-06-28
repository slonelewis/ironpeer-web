import React from 'react';

/**
 * Inline SVG of a flatbed trailer (side view).
 * Stroke-based, monochrome, ~22×13 px default size.
 *
 * @param {Object} props
 * @param {number} [props.width=22]
 * @param {number} [props.height=13]
 * @param {string} [props.className]
 * @param {Object} [props.style]
 */
const FlatbedTrailerIcon = ({ width = 22, height = 13, className, style }) => (
  <svg
    viewBox="0 0 24 13"
    width={width}
    height={height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={{ display: 'inline', verticalAlign: 'middle', ...style }}
  >
    {/* Deck / flat bed */}
    <rect x="4" y="2.5" width="18" height="3" rx="0.4" stroke="currentColor" strokeWidth="0.9" />
    {/* Headboard at rear (right end) */}
    <rect x="20.8" y="1.2" width="1.4" height="5" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    {/* Tongue — angled down-left toward hitch */}
    <line x1="4" y1="4" x2="1" y2="6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    {/* Hitch coupler */}
    <circle cx="0.8" cy="6.9" r="0.65" fill="currentColor" />
    {/* Tandem rear wheels */}
    <circle cx="17" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="0.9" />
    <circle cx="10.5" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="0.9" />
  </svg>
);

export default FlatbedTrailerIcon;
