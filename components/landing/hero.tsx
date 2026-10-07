"use client";

import { motion } from "motion/react";
import { container, item } from "@/lib/motion/contanier";
import { useState, useCallback } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { authClient } from "@/lib/auth-client";
import { getCareerUrl } from "@/lib/actions/get-career-url";

export function Hero() {
  const [authOpen, setAuthOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const goToDashboard = useCallback(() => {
    getCareerUrl().then((url) => {
      window.location.href = url;
    });
  }, []);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="relative z-10 flex flex-1 flex-col items-center overflow-hidden px-6 pt-[8vh] text-center"
    >
      <motion.h1
        variants={item}
        className="max-w-3xl font-heading font-normal leading-[1.05] tracking-tighter text-foreground antialiased [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] text-6xl sm:text-6xl md:text-[3.8rem]"
      >
        Job post infrastructure
        <br />
        for serious teams
      </motion.h1>
      <motion.p
        variants={item}
        className="mt-6 hidden max-w-xl text-balance font-sans font-normal leading-relaxed tracking-tight text-muted-foreground antialiased [-webkit-font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] text-base sm:block sm:text-lg"
      >
        The hiring infrastructure for AI Startups that need to move fast
        and attract the right people.
      </motion.p>
      <motion.div variants={item} className="mt-8">
        {isPending ? (
          <span
            className="inline-block h-9 w-44 animate-pulse rounded-lg bg-stone-200/70"
            aria-label="Checking sign-in status"
          />
        ) : session ? (
          <button
            onClick={goToDashboard}
            className="cursor-pointer rounded-lg bg-stone-900 px-8 py-1.5 text-[15px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] transition-all hover:underline hover:underline-offset-2"
          >
            Go to Dashboard
          </button>
        ) : (
          <>
            <button
              onClick={() => setAuthOpen(true)}
               className="w-fit cursor-pointer rounded-lg hover:underline bg-stone-900 px-8 py-1.5 text-[14px] font-normal text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.12)] hover:bg-stone-950"
            >
              Post a job opening
            </button>

            <AuthDialog
              open={authOpen}
              onOpenChange={setAuthOpen}
              onAuthenticated={goToDashboard}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}