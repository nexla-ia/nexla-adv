/**
 * BrandMark — monograma NexlaAdv
 *
 * Quadrado fino com serifa "N" no centro e barra ornamental abaixo.
 * Inspiração: selos de tipografia editorial / colofão de livro jurídico.
 */
export default function BrandMark({ size = 32, color = '#14110F', strokeWidth = 1.4 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="NexlaAdv"
    >
      {/* Frame quadrado externo (rule fina) */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        stroke={color}
        strokeWidth={strokeWidth * 0.7}
        fill="none"
      />
      {/* Frame interno (rule ainda mais fina, cria efeito de moldura dupla) */}
      <rect
        x="11"
        y="11"
        width="78"
        height="78"
        stroke={color}
        strokeWidth={strokeWidth * 0.4}
        opacity="0.55"
        fill="none"
      />
      {/* "N" serifado no centro — composto por hastes verticais com serifas + diagonal */}
      <g stroke={color} strokeWidth={strokeWidth * 1.6} strokeLinecap="square" fill="none">
        {/* Haste esquerda */}
        <line x1="30" y1="28" x2="30" y2="62" />
        {/* Serifas haste esquerda */}
        <line x1="25" y1="28" x2="35" y2="28" />
        <line x1="25" y1="62" x2="35" y2="62" />
        {/* Haste direita */}
        <line x1="70" y1="28" x2="70" y2="62" />
        {/* Serifas haste direita */}
        <line x1="65" y1="28" x2="75" y2="28" />
        <line x1="65" y1="62" x2="75" y2="62" />
        {/* Diagonal */}
        <line x1="30" y1="28" x2="70" y2="62" />
      </g>
      {/* Marca tipográfica de "advocacia" — barra ornamental + traço */}
      <g stroke={color} strokeWidth={strokeWidth * 0.7}>
        <line x1="34" y1="74" x2="66" y2="74" />
        <circle cx="50" cy="74" r="1.6" fill={color} stroke="none" />
      </g>
    </svg>
  )
}
