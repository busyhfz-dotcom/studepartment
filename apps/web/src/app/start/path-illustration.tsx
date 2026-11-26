import Image from "next/image";

const artwork = {
  find: { src: "/images/start/find-research.webp", width: 459, height: 300 },
  post: { src: "/images/start/post-position.webp", width: 480, height: 290 },
};

export function PathIllustration({ posting = false }: { posting?: boolean }) {
  return <Image {...artwork[posting ? "post" : "find"]} alt="" unoptimized />;
}
