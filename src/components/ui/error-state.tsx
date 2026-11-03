type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = "Journeys are taking a moment",
  message = "We could not load the latest journeys right now. Please try again shortly.",
}: ErrorStateProps) {
  return (
    <div className="border border-charcoal/15 bg-white p-8 text-center">
      <p className="font-display text-2xl text-forest">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-charcoal/60">{message}</p>
    </div>
  );
}
