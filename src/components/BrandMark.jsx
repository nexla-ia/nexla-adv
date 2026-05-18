export default function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="AdvoSac">
      <defs>
        <linearGradient id="advo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3B82F6"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#advo-bg)"/>
      {/* Chat bubble */}
      <rect x="10" y="8" width="74" height="60" rx="12" stroke="white" strokeWidth="4.5" fill="none" opacity="0.92"/>
      <path d="M16 68 L10 84 L32 68" fill="white" opacity="0.92"/>
      {/* Balança */}
      <line x1="50" y1="18" x2="50" y2="54" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="27" y1="29" x2="73" y2="29" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="27" y1="29" x2="27" y2="44" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M19 44 Q27 53 35 44" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <line x1="73" y1="29" x2="73" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M65 42 Q73 51 81 42" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <line x1="43" y1="54" x2="57" y2="54" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  )
}
