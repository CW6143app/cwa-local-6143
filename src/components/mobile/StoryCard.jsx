import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function StoryCard({ story, index = 0 }) {
  return (
    <motion.a
      href={story.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
      className="block overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(11,37,69,0.06),0_12px_32px_-20px_rgba(11,37,69,0.35)]"
    >
      <Image src={story.image} alt={story.title} className="h-44 w-full" />
      <div className="p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
          <span className="text-[#c8102e] font-semibold">{story.category}</span>
          <span>·</span>
          <span>{story.date}</span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-[#0b2545]">
          {story.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-3">
          {story.excerpt}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0b2545]">
          Read more <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </motion.a>
  );
}