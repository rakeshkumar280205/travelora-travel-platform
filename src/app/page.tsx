import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DestinationCard } from "@/components/travel/destination-card";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeaturedJourneys } from "@/features/packages/featured-journeys";
import { FeaturedJourneysSkeleton } from "@/features/packages/featured-journeys-skeleton";
import { ResilientImage } from "@/components/ui/resilient-image";

const destinations = [
  {
    name: "Munnar",
    region: "Kerala",
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Thekkady",
    region: "Kerala",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1532664189809-02133fee698d?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Alleppey",
    region: "Kerala",
    image:
      "https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Madurai",
    region: "Tamil Nadu",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Rameswaram",
    region: "Tamil Nadu",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85",
  },
  {
    name: "Kanyakumari",
    region: "Tamil Nadu",
    image:
      "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=1200&q=85",
    fallback:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Header />

      <main>
        <section className="relative isolate min-h-[min(760px,88vh)] bg-deep-green text-white">
          <div className="absolute inset-0 -z-10">
            <ResilientImage
              src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2200&q=90"
              alt=""
              fill
              priority
              sizes="100vw"
              className="h-full w-full object-cover object-center opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-deep-green via-deep-green/65 to-deep-green/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-green/75 via-transparent to-deep-green/20" />
          </div>

          <div className="mx-auto flex min-h-[min(760px,88vh)] max-w-7xl items-end px-6 pb-16 pt-32 sm:px-10 sm:pb-24 lg:px-16">
            <div className="max-w-3xl">
              <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
                <span className="h-px w-10 bg-gold" />
                Journeys beyond ordinary
              </p>
              <h1 className="font-display max-w-3xl text-5xl leading-[0.98] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
                Discover South India, beyond the ordinary.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Thoughtfully crafted journeys through misty hills, temple towns
                and quiet waters — made for the way you want to travel.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button href="/packages">Explore journeys</Button>
                <Button href="#enquire" variant="light">
                  Plan your trip <span aria-hidden="true">↗</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-ivory px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <SectionHeading
              eyebrow="The southern story"
              title="A slower, richer way to see India."
            />
            <p className="max-w-xl text-base leading-8 text-charcoal/65 lg:justify-self-end">
              From tea-scented mornings in Munnar to the last light over
              Kanyakumari, South India rewards the curious. We connect you to
              the character of each place through considered stays, local
              insight and unrushed days.
            </p>
          </div>
        </section>

        <section className="bg-forest px-6 py-24 text-white sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Places with a pulse"
              title="Go where the landscape changes you."
              tone="dark"
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination, index) => (
                <DestinationCard
                  key={destination.name}
                  {...destination}
                  featured={index === 0}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="journeys" className="bg-ivory px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                eyebrow="Curated journeys"
                title="A beautiful beginning."
              />
              <Link
                href="/packages"
                className="text-sm font-medium text-forest underline decoration-gold underline-offset-8 transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded"
              >
                View all journeys
              </Link>
            </div>
            <div className="mt-12">
              <Suspense fallback={<FeaturedJourneysSkeleton />}>
                <FeaturedJourneys />
              </Suspense>
            </div>
          </div>
        </section>

        <section id="about" className="border-y border-charcoal/10 bg-white px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              eyebrow="The Travelora way"
              title="Details matter. The feeling matters more."
            />
            <div className="grid gap-10 sm:grid-cols-2">
              {[
                {
                  number: "01",
                  title: "Thoughtfully paced",
                  text: "Room to wander, pause and take in the places between the highlights.",
                },
                {
                  number: "02",
                  title: "Deeply considered",
                  text: "Stays, routes and experiences chosen for their sense of place.",
                },
                {
                  number: "03",
                  title: "Human by design",
                  text: "A real person to listen, refine and help you travel with confidence.",
                },
                {
                  number: "04",
                  title: "Made for you",
                  text: "A considered starting point, shaped around your pace and curiosity.",
                },
              ].map((item) => (
                <div key={item.number} className="border-t border-charcoal/15 pt-5">
                  <span className="text-xs tracking-[0.2em] text-gold">{item.number}</span>
                  <h3 className="font-display mt-5 text-2xl text-forest">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-charcoal/60">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="enquire" className="bg-gold px-6 py-24 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-deep-green/70">
                Your next chapter
              </p>
              <h2 className="font-display mt-5 text-5xl leading-none tracking-[-0.03em] text-deep-green sm:text-7xl">
                Let&apos;s make it memorable.
              </h2>
            </div>
            <EnquiryForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
