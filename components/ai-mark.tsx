/**
 * The one mark for every AI surface.
 *
 * A solid four-point spark, sized by class. It is the only place orange is
 * allowed to appear outside an error, so an AI affordance is recognisable
 * before the label is read.
 */
export function SparkIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.4c.7 5.1 3.3 7.7 8.4 8.4-5.1.7-7.7 3.3-8.4 8.4-.7-5.1-3.3-7.7-8.4-8.4 5.1-.7 7.7-3.3 8.4-8.4Z"
        fill="currentColor"
      />
      <path
        d="M19 14.6c.26 1.9 1.24 2.88 3.14 3.14-1.9.26-2.88 1.24-3.14 3.14-.26-1.9-1.24-2.88-3.14-3.14 1.9-.26 2.88-1.24 3.14-3.14Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
