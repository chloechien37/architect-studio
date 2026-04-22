export default function GeminiLogo({ size = 20, spin = false, className = '', style = {} }) {
  const id = `grad-${Math.random().toString(36).slice(2, 9)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{
        display: 'inline-block',
        flexShrink: 0,
        animation: spin ? 'gemini-spin 6s linear infinite' : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4285F4" />
          <stop offset="35%"  stopColor="#9B72F6" />
          <stop offset="65%"  stopColor="#E05D8B" />
          <stop offset="100%" stopColor="#FBBC04" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 C12 7, 17 12, 22 12 C17 12, 12 17, 12 22 C12 17, 7 12, 2 12 C7 12, 12 7, 12 2 Z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}
