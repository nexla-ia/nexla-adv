export default function BrandMark({ size = 40 }) {
  return (
    <img
      src="/icon-app.png"
      width={size}
      height={size}
      alt="AdvoSac"
      style={{
        display: 'block',
        objectFit: 'cover',
        flexShrink: 0,
        borderRadius: size * 0.22,
      }}
    />
  )
}
