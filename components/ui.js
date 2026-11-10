import Link from "next/link";
export function Icon({ name = "arrow", size = 20, ...props }) {
  const paths = {
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M8 3v4m8-4v4M4 11h16" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z" />
        <path d="M15 7v2m0 2v2m0 2v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 11 3 3 5-5" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5m5-13 5 5-5 5m-5-5h14" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    music: (
      <>
        <path d="M9 18V5l11-2v13M9 8l11-2" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="17" cy="16" rx="3" ry="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    flag: (
      <>
        <path d="M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
export function Star({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        d="m50 2 12 29 32-7-18 27 20 25-33-3-13 25-12-29-32 7 18-27L4 24l33 3Z"
        fill="currentColor"
        stroke="var(--paper)"
        strokeWidth="4"
      />
    </svg>
  );
}
export function Photo({ event, src, className = "", position }) {
  return (
    <div
      role="img"
      aria-label={
        event
          ? `${event.artist} concert artwork`
          : "Live music and concert atmosphere"
      }
      className={`photo ${className}`}
      style={{
        backgroundImage: `url('${src || event?.image || "/images/music.png"}')`,
        backgroundPosition: position || "center center",
      }}
    />
  );
}
export function Badge({ children, type = "" }) {
  return <span className={`badge ${type}`}>{children}</span>;
}
export function Empty({ title, children, href, label }) {
  return (
    <div className="empty">
      <Icon name="ticket" size={40} />
      <h3>{title}</h3>
      <p>{children}</p>
      {href && (
        <Link className="button" href={href}>
          {label}
          <Icon />
        </Link>
      )}
    </div>
  );
}
