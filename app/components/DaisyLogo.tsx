export default function DaisyLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fleurs d'Emmi daisy logo"
    >
      {/* Purple background */}
      <rect width="100" height="100" rx="6" fill="#9b7fc7" />
      {/* 7 white petals rotated around center */}
      {Array.from({ length: 7 }).map((_, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="26"
          rx="7"
          ry="14"
          fill="white"
          transform={`rotate(${(360 / 7) * i} 50 50)`}
        />
      ))}
      {/* White center circle */}
      <circle cx="50" cy="50" r="12" fill="white" />
      {/* Purple spiral center detail */}
      <path
        d="M50 44 C54 44 57 47 57 51 C57 55 54 58 50 58 C47 58 45 56 45 53"
        stroke="#9b7fc7"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
