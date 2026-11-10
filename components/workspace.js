"use client";
import Link from "next/link";
import { Icon } from "./ui";
export default function Workspace({ user, mode, tab, setTab, children }) {
  const tabs =
    mode === "admin"
      ? [
          ["overview", "grid", "Overview"],
          ["sellers", "users", "Seller applications"],
          ["listings", "ticket", "Ticket listings"],
          ["caps", "shield", "Price caps"],
          ["reports", "flag", "Reports"],
          ["users", "users", "User management"],
        ]
      : [
          ["listings", "ticket", "My listings"],
          ["sales", "music", "Sales & handover"],
        ];
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-title">
          <span className="eyebrow">BACKSTAGE AT ENCORE</span>
          <h2>
            {mode === "admin" ? "Admin studio" : "Seller studio"}
            <span>✳</span>
          </h2>
        </div>
        <nav aria-label={`${mode} sections`}>
          {tabs.map(([key, icon, label]) => (
            <button
              key={key}
              className={tab === key ? "selected" : ""}
              onClick={() => setTab(key)}
            >
              <Icon name={icon} />
              {label}
              {tab === key && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Icon name="ticket" size={30} />
          <strong>
            {mode === "admin"
              ? "Keep the crowd in good hands."
              : "You bring the ticket. We bring the crowd."}
          </strong>
          <p>Good nights start with good people.</p>
          <Link href="/">
            Back to Encore <Icon size={16} />
          </Link>
        </div>
        <div className="sidebar-user">
          <span className="mini-avatar">{user.fullname[0]}</span>
          <span>
            <strong>{user.fullname}</strong>
            <small>
              {mode === "admin" ? "Platform admin" : "Approved seller"}
            </small>
          </span>
        </div>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
