import { X, Pencil } from 'lucide-react'

const TAG_PALETTES = [
  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' },
  { bg: '#FDF2F8', color: '#9D174D', border: '#FBCFE8' },
  { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  { bg: '#ECFEFF', color: '#0E7490', border: '#A5F3FC' },
  { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
]

export function tagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTES[h % TAG_PALETTES.length]
}

export function TagBadge({ tag, onRemove, onEdit, small }) {
  const { bg, color, border } = tagColor(tag)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 20, padding: small ? '1px 7px' : '2px 9px',
      fontSize: small ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap',
      lineHeight: '16px',
    }}>
      {tag}
      {onEdit && (
        <button onClick={onEdit} title="Editar etiqueta" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color, display: 'inline-flex', alignItems: 'center', opacity: 0.7,
        }}>
          <Pencil size={9} />
        </button>
      )}
      {onRemove && (
        <button onClick={onRemove} title="Remover" style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          color, display: 'inline-flex', alignItems: 'center', opacity: 0.7,
        }}>
          <X size={10} />
        </button>
      )}
    </span>
  )
}
