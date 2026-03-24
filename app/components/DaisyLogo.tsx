import Image from "next/image";

export default function DaisyLogo({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/Green.png"
      alt="Fleurs d'Emmi logo"
      width={size}
      height={size}
    />
  );
}
