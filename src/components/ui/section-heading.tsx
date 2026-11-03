type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  tone?: "light" | "dark";
};

export function SectionHeading({
  eyebrow,
  title,
  tone = "light",
}: SectionHeadingProps) {
  const dark = tone === "dark";

  return (
    <div>
      <p className={`flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] ${dark ? "text-gold" : "text-gold"}`}>
        <span className="h-px w-8 bg-current" />
        {eyebrow}
      </p>
      <h2 className={`font-display mt-5 max-w-xl text-4xl leading-[1.05] tracking-[-0.025em] sm:text-6xl ${dark ? "text-white" : "text-forest"}`}>
        {title}
      </h2>
    </div>
  );
}
