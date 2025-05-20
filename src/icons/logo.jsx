import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex justify-center mb-2">
      <Image src="/images/nyansapo_logo.jpeg" alt="Nyansapo AI Logo" width={120} height={120} priority />
    </div>
  );
}