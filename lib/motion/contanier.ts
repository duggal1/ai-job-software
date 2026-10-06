export const EASE_LUXE = [0.22, 1, 0.36, 1] as const;

export const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.07,
        },
    },
};

export const item = {
    hidden: { opacity: 0, y: 6, filter: "blur(7px)" },
    show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: EASE_LUXE },
    },
};