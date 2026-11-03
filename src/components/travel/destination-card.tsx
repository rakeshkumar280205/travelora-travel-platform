import Image from "next/image";

type DestinationCardProps = {
  name: string;
  region: string;
  image: string;
  featured?: boolean;
};

export function DestinationCard({
  name,
  region,
  image,
  featured = false,
}: DestinationCardProps) {
  return (
    <article className={`group relative overflow-hidden ${featured ? "sm:row-span-2 sm:min-h-[520px]" : "min-h-[250px]"}`}>
      <Image
        src={image}
        alt={`${name} landscape`}
        fill
        sizes={featured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 33vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-deep-green/85 via-deep-green/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/65">{region}</p>
        <h3 className="font-display mt-2 text-3xl text-white">{name}</h3>
      </div>
    </article>
  );
}
