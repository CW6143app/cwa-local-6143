import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { SITE, STORIES, EVENTS } from "@/lib/siteData";
import StoryCard from "@/components/mobile/StoryCard";
import EventCard from "@/components/mobile/EventCard";

export default function Home() {
  return (
    <div>
      <section className="relative h-[300px] w-full overflow-hidden">
        <Image src={SITE.hero} alt="CWA Local 6143" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2545] via-[#0b2545]/70 to-[#0b2545]/20" />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 px-6 pb-7"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ff8a9b]">
            {SITE.city}
          </p>
          <h1 className="mt-2 text-4xl font-semibold leading-[1.05] tracking-tight text-white">
            CWA<br />Local 6143
          </h1>
          <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-white/70">
            Building a movement for economic justice and democracy, every day.
          </p>
        </motion.div>
      </section>

      <section className="px-6 pt-9">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b2545]">
            Featured Stories
          </h2>
        </div>
        <div className="mt-5 space-y-5">
          {STORIES.map((s, i) => (
            <StoryCard key={s.title} story={s} index={i} />
          ))}
        </div>
      </section>

      <section className="px-6 pt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0b2545]">
          Upcoming Events
        </h2>
        <div className="mt-5 space-y-4">
          {EVENTS.slice(0, 2).map((e, i) => (
            <EventCard key={e.month} event={e} index={i} />
          ))}
        </div>
        <Link
          to="/events"
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c8102e]"
        >
          View all events <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}