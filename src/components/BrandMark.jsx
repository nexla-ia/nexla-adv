/**
 * BrandMark — Monograma "NA" NexlaAdv
 * Círculo com "N" + "A" estilizados em traços finos elegantes (cor padrão cobre).
 * Mesmo estilo visual da versão NexlaADV, adaptado pra NexlaAdv.
 */
export default function BrandMark({ size = 32, color = '#C9A074', strokeWidth = 1.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-label="NexlaAdv">
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth={strokeWidth * 0.85} />
      {/* N esquerdo */}
      <path
        d="M23 68 L23 34 L45 68 L45 34"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="none"
      />
      {/* A direito */}
      <path
        d="M55 68 L66 34 L77 68"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="miter"
        strokeLinecap="square"
        fill="none"
      />
      {/* Travessão do A */}
      <path
        d="M59 56 L73 56"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  )
}
