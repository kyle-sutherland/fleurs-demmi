export default function ScallopedPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mt-8 md:mt-0 w-full mx-auto md:mx-0">
      <svg viewBox="-12 -12 124 124" style={{ display: "block", width: "100%", height: "auto" }}>
        <image
          href={src}
          x="0" y="0" width="100" height="100"
          preserveAspectRatio="xMidYMid slice"
        />
        <path
          fillRule="evenodd"
          fill="#f9a8d4"
          d="M 0 0 A 10 10 0 0 1 20 0 A 10 10 0 0 1 40 0 A 10 10 0 0 1 60 0 A 10 10 0 0 1 80 0 A 10 10 0 0 1 100 0 A 10 10 0 0 1 100 20 A 10 10 0 0 1 100 40 A 10 10 0 0 1 100 60 A 10 10 0 0 1 100 80 A 10 10 0 0 1 100 100 A 10 10 0 0 1 80 100 A 10 10 0 0 1 60 100 A 10 10 0 0 1 40 100 A 10 10 0 0 1 20 100 A 10 10 0 0 1 0 100 A 10 10 0 0 1 0 80 A 10 10 0 0 1 0 60 A 10 10 0 0 1 0 40 A 10 10 0 0 1 0 20 A 10 10 0 0 1 0 0 Z M 0 0 L 100 0 L 100 100 L 0 100 Z"
        />
      </svg>
    </div>
  );
}
