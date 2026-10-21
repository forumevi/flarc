interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export default function Logo({ size = 32, className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark: stylized flame + F */}
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="flare-grad" x1="8" y1="2" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c4a3ff" />
            <stop offset="50%" stopColor="#9b6dff" />
            <stop offset="100%" stopColor="#6c3dfe" />
          </linearGradient>
          <linearGradient id="flare-glow" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9b6dff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6c3dfe" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Background circle with glow */}
        <circle cx="20" cy="20" r="19" fill="url(#flare-glow)" />
        <circle cx="20" cy="20" r="19" stroke="url(#flare-grad)" strokeWidth="1.5" fill="rgba(155,109,255,0.08)" />
        {/* Flame shape */}
        <path
          d="M20 6C20 6 27 13 27 20C27 24.4 24.2 27.8 20 29C15.8 27.8 13 24.4 13 20C13 17 15 14.5 15 14.5C15 14.5 14.5 18 17 19.5C17 19.5 16 15 20 6Z"
          fill="url(#flare-grad)"
          opacity="0.9"
        />
        {/* Inner flame */}
        <path
          d="M20 13C20 13 23.5 17 23.5 21C23.5 23.2 22 24.8 20 25.5C18 24.8 16.5 23.2 16.5 21C16.5 19 18 17.5 18 17.5C18 17.5 17.8 19.5 19 20C19 20 18.5 17 20 13Z"
          fill="white"
          opacity="0.6"
        />
      </svg>
      {showText && (
        <span
          className="display font-bold tracking-tight"
          style={{
            fontSize: size * 0.65,
            background: 'linear-gradient(135deg, #c4a3ff 0%, #9b6dff 60%, #7c4dff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          flarc
        </span>
      )}
    </div>
  )
}
