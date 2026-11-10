"use client";
import { useModalFocus } from "./use-modal-focus";
import { useEffect, useState } from "react";
import { api } from "./api";
import Workspace from "./workspace";
import { Badge, Icon, Empty } from "./ui";
import { money } from "@/lib/format";
const headings = {
  overview: [
    "A good night starts backstage.",
    "A little oversight. A better experience for every fan.",
  ],
  sellers: [
    "Meet the next seller crew.",
    "Review applications before sellers can publish.",
  ],
  listings: [
    "Keep the listings in tune.",
    "Review tickets across the marketplace.",
  ],
  caps: [
    "Fairer prices. Fuller crowds.",
    "Set a maximum resale price for each concert.",
  ],
  reports: [
    "Hear your fans out.",
    "Investigate reported purchases and record your decision.",
  ],
  users: [
    "The people behind the music.",
    "Manage account access and marketplace roles.",
  ],
};
export default function Admin({ user }) {
  const [tab, setTab] = useState("overview"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(null),
    [search, setSearch] = useState("");
  useModalFocus(Boolean(modal), () => setModal(null));
  async function load() {
    try {
      setData(await api("admin/overview"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => {
      active = false;
    };
  }, []);
  async function act(path, method, body, msg) {
    setBusy(true);
    setError("");
    try {
      const r = await api(path, method, body);
      setNotice(
        `${msg}${r.removed ? ` ${r.removed} over-cap listing(s) removed.` : ""}`,
      );
      setModal(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (modal.type === "cap")
      await act(
        `admin/events/${modal.item.id}`,
        "PATCH",
        values,
        "Price cap updated.",
      );
    if (modal.type === "report")
      await act(
        `admin/reports/${modal.item.id}`,
        "PATCH",
        values,
        "Report decision recorded.",
      );
    if (modal.type === "role")
      await act(
        `admin/users/${modal.item.id}`,
        "PATCH",
        { action: "role", role: values.role },
        "User role updated.",
      );
  }
  const pending =
    data?.users.filter(
      (u) =>
        u.seller_application === "pending" &&
        u.status === "active" &&
        u.role === "buyer",
    ) || [];
  const open = data?.reports.filter((r) => r.status === "open") || [];
  const [heading, description] = headings[tab];
  return (
    <Workspace
      mode="admin"
      user={user}
      tab={tab}
      setTab={(t) => {
        setTab(t);
        setSearch("");
      }}
    >
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">THE ENCORE CONTROL ROOM</span>
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
        <Badge type="success">
          <span className="status-dot" /> Admin access
        </Badge>
      </div>
      {error && !modal && (
        <p role="alert" className="alert error">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert success" role="status">
          {notice}
        </p>
      )}
      {!data ? (
        <p className="loading">Opening the control room…</p>
      ) : (
        <>
          <div className="stats">
            <div>
              <span>SELLER APPLICATIONS</span>
              <strong>
                {pending.length}
                <Icon name="users" />
              </strong>
              <small>Waiting for your review</small>
            </div>
            <div>
              <span>LIVE TICKETS</span>
              <strong>
                {data.listings.filter((l) => l.status === "available").length}
                <Icon name="ticket" />
              </strong>
              <small>Across {data.events.length} concerts</small>
            </div>
            <div>
              <span>OPEN REPORTS</span>
              <strong>
                {open.length}
                <Icon name="flag" />
              </strong>
              <small>A little attention goes a long way</small>
            </div>
          </div>
          {tab === "overview" && (
            <>
              <div className="admin-banner">
                <div>
                  <span className="eyebrow">FANS FIRST. ALWAYS.</span>
                  <h2>
                    You keep the
                    <br />
                    good nights going.
                  </h2>
                  <p>
                    Start with seller applications, then check in on reports.
                  </p>
                  <button className="button" onClick={() => setTab("sellers")}>
                    Review applications <Icon />
                  </button>
                </div>
                <span className="banner-asterisk">✳</span>
              </div>
              <div className="overview-grid">
                <button
                  className="overview-card"
                  onClick={() => setTab("sellers")}
                >
                  <Icon name="users" />
                  <h3>
                    {pending.length} seller application
                    {pending.length === 1 ? "" : "s"}
                  </h3>
                  <p>Meet the fans ready to pass on their tickets.</p>
                  <span>
                    Review the queue <Icon />
                  </span>
                </button>
                <button
                  className="overview-card"
                  onClick={() => setTab("reports")}
                >
                  <Icon name="flag" />
                  <h3>
                    {open.length} open report{open.length === 1 ? "" : "s"}
                  </h3>
                  <p>Help resolve a fan’s ticket issue.</p>
                  <span>
                    Check reports <Icon />
                  </span>
                </button>
              </div>
              <p className="fine">
                Demo marketplace · fictional events · payments and payouts are
                simulated.
              </p>
            </>
          )}
          {tab === "sellers" && (
            <section className="data-panel">
              <div className="panel-heading">
                <h2>
                  Seller applications <Badge>{pending.length}</Badge>
                </h2>
                <span className="fine">
                  Application notes · prototype review
                </span>
              </div>
              {!pending.length ? (
                <Empty title="All caught up.">
                  New seller applications will appear here.
                </Empty>
              ) : (
                pending.map((u) => (
                  <article className="application-row" key={u.id}>
                    <div className="mini-avatar">{u.fullname[0]}</div>
                    <div className="application-info">
                      <h3>{u.fullname}</h3>
                      <p className="fine">{u.email}</p>
                      <p>
                        {u.application_note ||
                          "Demo seller application for a spare concert ticket."}
                      </p>
                    </div>
                    <div className="actions">
                      <button
                        className="button small"
                        disabled={busy}
                        onClick={() =>
                          act(
                            `admin/users/${u.id}`,
                            "PATCH",
                            { action: "approve" },
                            "Seller approved. They can now publish listings.",
                          )
                        }
                      >
                        Approve <Icon name="check" size={16} />
                      </button>
                      <button
                        className="button small outline"
                        disabled={busy}
                        onClick={() =>
                          act(
                            `admin/users/${u.id}`,
                            "PATCH",
                            { action: "reject" },
                            "Application rejected.",
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
          {tab === "listings" && (
            <section className="data-panel">
              <div className="panel-heading">
                <h2>Marketplace listings</h2>
                <label className="table-search">
                  <Icon name="search" size={16} />
                  <input
                    aria-label="Search listings"
                    placeholder="Find concert or seller"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>CONCERT / SELLER</th>
                      <th>SEAT</th>
                      <th>PRICE</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listings
                      .filter((l) =>
                        `${l.artist} ${l.seller_name}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((l) => (
                        <tr key={l.id}>
                          <td>
                            <strong>{l.artist}</strong>
                            <small>{l.seller_name}</small>
                          </td>
                          <td>
                            {l.section} · {l.seat}
                          </td>
                          <td>{money(l.price)}</td>
                          <td>
                            <Badge
                              type={l.status === "available" ? "success" : ""}
                            >
                              {l.status}
                            </Badge>
                          </td>
                          <td>
                            {l.status === "available" ? (
                              <button
                                className="text-button danger"
                                onClick={() => {
                                  setModal({ type: "remove", item: l });
                                  setError("");
                                }}
                              >
                                Remove
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "caps" && (
            <section className="data-panel">
              <div className="panel-heading">
                <h2>Event price caps</h2>
              </div>
              <p className="panel-description">
                Lowering a cap removes available listings priced above it. Sold
                tickets keep their recorded purchase price.
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>CONCERT</th>
                      <th>VENUE</th>
                      <th>MAXIMUM PRICE</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <strong>{e.artist}</strong>
                          <small>{e.title}</small>
                        </td>
                        <td>{e.venue}</td>
                        <td>
                          <strong>{money(e.price_cap)}</strong>
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => {
                              setModal({ type: "cap", item: e });
                              setError("");
                            }}
                          >
                            Edit cap ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {tab === "reports" && (
            <section className="data-panel">
              <div className="panel-heading">
                <h2>
                  Ticket reports <Badge>{data.reports.length}</Badge>
                </h2>
              </div>
              {!data.reports.length ? (
                <Empty title="No reports to review.">
                  Reports from buyers will appear here.
                </Empty>
              ) : (
                data.reports.map((r) => (
                  <article className="report-row" key={r.id}>
                    <div className="section-head compact">
                      <h3>
                        {r.artist} · Order EN-
                        {String(r.order_id).padStart(4, "0")}
                      </h3>
                      <Badge type={r.status === "open" ? "warning" : ""}>
                        {r.status}
                      </Badge>
                    </div>
                    <p className="fine">
                      Buyer: {r.buyer_name} · Seller: {r.seller_name}
                    </p>
                    <p className="report-reason">{r.reason}</p>
                    {r.decision && (
                      <p>
                        <strong>Decision:</strong> {r.decision}
                      </p>
                    )}
                    <div className="actions">
                      {r.status === "open" && (
                        <button
                          className="button small"
                          onClick={() => {
                            setModal({ type: "report", item: r });
                            setError("");
                          }}
                        >
                          Record decision <Icon />
                        </button>
                      )}
                      <button
                        className="text-button danger"
                        onClick={() => {
                          setModal({
                            type: "ban",
                            item: { id: r.seller_id, fullname: r.seller_name },
                          });
                          setError("");
                        }}
                      >
                        Suspend seller
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
          {tab === "users" && (
            <section className="data-panel">
              <div className="panel-heading">
                <h2>User management</h2>
                <label className="table-search">
                  <Icon name="search" size={16} />
                  <input
                    aria-label="Search users"
                    placeholder="Name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>PERSON</th>
                      <th>ROLE</th>
                      <th>ACCOUNT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users
                      .filter((u) =>
                        `${u.fullname} ${u.email}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                      )
                      .map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong>
                              {u.fullname}
                              {u.id === user.id ? " (you)" : ""}
                            </strong>
                            <small>{u.email}</small>
                          </td>
                          <td>
                            <Badge>{u.role}</Badge>
                          </td>
                          <td>
                            <Badge
                              type={
                                u.status === "active" ? "success" : "warning"
                              }
                            >
                              {u.status}
                            </Badge>
                          </td>
                          <td>
                            {u.id === user.id ? (
                              <span className="fine">Your account</span>
                            ) : (
                              <div className="actions">
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    setModal({ type: "role", item: u });
                                    setError("");
                                  }}
                                >
                                  Change role
                                </button>
                                {u.status === "active" ? (
                                  <button
                                    className="text-button danger"
                                    onClick={() => {
                                      setModal({ type: "ban", item: u });
                                      setError("");
                                    }}
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() =>
                                      act(
                                        `admin/users/${u.id}`,
                                        "PATCH",
                                        { action: "restore" },
                                        "Account restored.",
                                      )
                                    }
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
      {modal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal"
          >
            <button
              className="icon-button modal-close"
              onClick={() => setModal(null)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">ADMIN ACTION</span>
            <h2 id="admin-modal">
              {modal.type === "cap"
                ? "Keep it within reach."
                : modal.type === "report"
                  ? "Record your review."
                  : modal.type === "role"
                    ? "Update access."
                    : modal.type === "ban"
                      ? "Suspend this account?"
                      : "Remove this listing?"}
            </h2>
            <p>{modal.item.fullname || modal.item.artist}</p>
            {["cap", "report", "role"].includes(modal.type) ? (
              <form onSubmit={submit}>
                {modal.type === "cap" && (
                  <>
                    <label>
                      Maximum resale price (THB)
                      <input
                        autoFocus
                        name="price_cap"
                        type="number"
                        required
                        min="0.01"
                        max="100000"
                        step="0.01"
                        defaultValue={modal.item.price_cap}
                      />
                    </label>
                    <p className="fine">
                      Available listings over the new cap will be removed.
                    </p>
                  </>
                )}
                {modal.type === "report" && (
                  <>
                    <label>
                      Decision
                      <select name="status">
                        <option value="confirmed">Confirmed issue</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </label>
                    <label>
                      Review note
                      <textarea
                        autoFocus
                        name="decision"
                        required
                        maxLength={500}
                        rows={4}
                      />
                    </label>
                  </>
                )}
                {modal.type === "role" && (
                  <>
                    <label>
                      Role
                      <select name="role" defaultValue={modal.item.role}>
                        <option value="buyer">Buyer</option>
                        <option
                          value="seller"
                          disabled={
                            modal.item.seller_application !== "approved"
                          }
                        >
                          Seller (approval required)
                        </option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <p className="fine">
                      Changes apply on the user’s next request.
                    </p>
                  </>
                )}
                {error && (
                  <p className="alert error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button" disabled={busy}>
                  {busy ? "Saving…" : "Save changes"}
                  <Icon name="check" />
                </button>
              </form>
            ) : (
              <>
                <p>
                  {modal.type === "ban"
                    ? "This immediately blocks access and hides this seller’s available tickets."
                    : "This available ticket will be hidden from the marketplace."}
                </p>
                {error && (
                  <p role="alert" className="alert error">
                    {error}
                  </p>
                )}
                <button
                  className="button danger-button"
                  disabled={busy}
                  onClick={() =>
                    modal.type === "ban"
                      ? act(
                          `admin/users/${modal.item.id}`,
                          "PATCH",
                          { action: "ban" },
                          "Account suspended.",
                        )
                      : act(
                          `admin/listings/${modal.item.id}`,
                          "DELETE",
                          undefined,
                          "Listing removed.",
                        )
                  }
                >
                  {busy
                    ? "Saving…"
                    : modal.type === "ban"
                      ? "Confirm suspension"
                      : "Confirm removal"}
                </button>
                <button className="text-button" onClick={() => setModal(null)}>
                  Cancel
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </Workspace>
  );
}
