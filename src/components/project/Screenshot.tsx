import Image from "next/image";

export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className="mt-8">
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={800}
        className="rounded-lg border border-line"
      />
      <figcaption className="mt-2 text-sm text-faint">{caption}</figcaption>
    </figure>
  );
}
