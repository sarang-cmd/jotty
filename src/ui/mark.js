/** Inline mascot mark for shadow DOM, where extension images need a URL. */
export function mascotSvg(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M32 7.5c11.6 0 20.4 8.4 21.2 19.6.5 7.4-1.9 13.9-6.1 18.4-3.7 4-9.2 6.2-15.1 6.2s-11.4-2.2-15.1-6.2c-4.2-4.5-6.6-11-6.1-18.4C11.6 15.9 20.4 7.5 32 7.5Z" fill="#AFC6A6" stroke="#87A083" stroke-width="2.2"/>
  <ellipse cx="26.2" cy="27.8" rx="1.9" ry="2.5" fill="#2B342B"/>
  <ellipse cx="37.8" cy="27.8" rx="1.9" ry="2.5" fill="#2B342B"/>
  <path d="M28.6 34.4c1.1 1.4 2.2 2 3.4 2s2.3-.6 3.4-2" stroke="#2B342B" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M21.4 33.2c-1.3-.4-2.5.1-3 1.2M42.6 33.2c1.3-.4 2.5.1 3 1.2" stroke="#2B342B" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
  <g transform="rotate(16 46 34)">
    <rect x="43" y="24" width="5.6" height="16" rx="0.6" fill="#E0A96B" stroke="#B9813F" stroke-width="1.2"/>
    <rect x="43" y="24" width="5.6" height="2.8" fill="#C98C4E"/>
    <path d="M43 40h5.6l-2.8 5.4L43 40Z" fill="#F2E8D4" stroke="#B9813F" stroke-width="1.2"/>
    <path d="M45 44.2 45.8 46l.8-1.8H45Z" fill="#333B33"/>
  </g>
</svg>`;
}

/** A small arrow used on the "back to task" action. */
export function arrowSvg() {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
