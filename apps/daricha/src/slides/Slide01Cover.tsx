"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideFrame } from "@/components/SlideFrame";
import { Reveal } from "@/components/Reveal";
import { GoldRule } from "@/components/Typo";

export function Slide01Cover({ active }: { active: boolean }) {
  return (
    <SlideFrame variant="cover" active={active} justify="center">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Reveal active={active} order={0}>
          <Image
            src="/daricha-logo.png"
            alt="Daricha Sundari"
            width={170}
            height={100}
            className="mx-auto h-auto w-[150px] brightness-0 invert sm:w-[170px]"
            priority
          />
        </Reveal>

        <Reveal active={active} order={1} className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            Iniciação e Qualificação em
          </p>
          <h1 className="mt-2 font-display text-[2.15rem] font-medium leading-[1.1] text-cream-50 sm:text-5xl">
            Terapêutica Tântrica
          </h1>
          <p className="mt-3 font-display text-lg italic text-coral-300">
            Método Daricha Sundari
          </p>
        </Reveal>

        <Reveal active={active} order={2} className="mt-8">
          <GoldRule className="mx-auto" />
        </Reveal>

        <Reveal active={active} order={3} className="mt-8 max-w-sm">
          <p className="font-display text-xl italic leading-snug text-cream-100/90 sm:text-2xl">
            &ldquo;Você viveu a experiência. Agora pode descobrir o que existe por trás
            dela.&rdquo;
          </p>
        </Reveal>

        <Reveal active={active} order={4} className="mt-9">
          <p className="text-sm tracking-wide text-cream-100/70">
            06 de outubro a 10 de novembro de 2026
          </p>
        </Reveal>
      </div>

      <Reveal
        active={active}
        order={5}
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-cream-100/70"
        >
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.25em]">
            Toque para começar
          </span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path
              d="M1 1l7 7 7-7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </Reveal>
    </SlideFrame>
  );
}
