/** Brand mark + wordmark, from design-handoff/design-system. */

export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="IndieWork"
      className={className}
    >
      <rect width="100" height="100" rx="24" fill="var(--accent)" />
      <rect x="26" y="26" width="48" height="48" rx="13" fill="none" stroke="#fff" strokeWidth="6" />
      <rect x="37.5" y="38.5" width="7" height="23" rx="3.5" fill="#fff" />
    </svg>
  );
}

/** "indie**work**.space" — weight contrast from the design (.lw/.hw/.tw). */
export function Wordmark({ withTld = true }: { withTld?: boolean }) {
  return (
    <span className="login-wordmark">
      <span className="lw">indie</span>
      <span className="hw">work</span>
      {withTld && <span className="tw">.space</span>}
    </span>
  );
}
