"use client";
import { useModalFocus } from "./use-modal-focus";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Photo, Icon, Badge, Empty } from "./ui";
import { date, money } from "@/lib/format";
import { api } from "./api";
export default function Tickets({ orders, user }) {
  const router = useRouter();
  const [report, setReport] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  useModalFocus(Boolean(report), () => setReport(null));
  async function receive(o) {
    setBusy(true);
    setError("");
    try {
      await api(`orders/${o.id}/receive`, "PATCH", {});
      setSuccess(
        "Receipt confirmed. The payout status is simulated; no money was sent.",
      );
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("reports", "POST", {
        order_id: report,
        reason: new FormData(e.currentTarget).get("reason"),
      });
      setReport(null);
      setSuccess("Your report has been sent to the admin team.");
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="section-wrap account-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR LITTLE COLLECTION OF BIG NIGHTS</span>
          <h1>
            Hey {user.fullname.split(" ")[0]}, you’re on the list<span>.</span>
          </h1>
          <p>Your tickets, handovers, and memories in the making.</p>
        </div>
        <Link className="button outline" href="/#discover">
          Find another gig <Icon />
        </Link>
      </div>
      <div className="account-tabs">
        <span className="selected">
          <Icon name="ticket" /> My tickets ({orders.length})
        </span>
        <Link href="/sell">
          Become a seller <Icon size={16} />
        </Link>
      </div>
      <p className="simulation">
        <Icon name="ticket" size={17} /> All purchases and payouts in this
        project are simulated.
      </p>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="alert success" role="status">
          {success}
        </p>
      )}
      {!orders.length ? (
        <Empty
          title="Your next memory is waiting."
          href="/#discover"
          label="Discover concerts"
        >
          Find a ticket you love. It’ll live right here.
        </Empty>
      ) : (
        <div className="orders-grid">
          {orders.map((o) => (
            <article className="order-card" key={o.id}>
              <Photo event={{ ...o, id: o.event_id }} />
              <div className="order-body">
                <div className="order-top">
                  <Badge
                    type={o.handover_status === "received" ? "success" : ""}
                  >
                    {o.handover_status === "pending"
                      ? "Awaiting handover"
                      : o.handover_status === "sent"
                        ? "Ready to confirm"
                        : "Handover received"}
                  </Badge>
                  <span className="fine">
                    EN-{String(o.id).padStart(4, "0")}
                  </span>
                </div>
                <h2>{o.artist}</h2>
                <p>{o.title}</p>
                <div className="event-meta">
                  <span>
                    <Icon name="calendar" size={16} />
                    {date(o.event_date)}
                  </span>
                  <span>
                    <Icon name="pin" size={16} />
                    {o.venue}
                  </span>
                </div>
                <div className="order-seat">
                  <span>
                    {o.section} · Seat {o.seat}
                  </span>
                  <strong>{money(o.price)}</strong>
                </div>
                <p className="fine">Seller: {o.seller_name} · Demo purchase</p>
                {o.handover_details ? (
                  <div className="handover-box">
                    <strong>Seller’s handover details</strong>
                    <p>{o.handover_details}</p>
                  </div>
                ) : (
                  <p className="handover-placeholder">
                    Your seller will send handover details here.
                  </p>
                )}
                <div className="actions">
                  {o.handover_status === "sent" && (
                    <button
                      disabled={busy}
                      className="button small"
                      onClick={() => receive(o)}
                    >
                      Confirm received <Icon name="check" size={16} />
                    </button>
                  )}
                  {o.report_id ? (
                    <Badge>Report {o.report_status}</Badge>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => {
                        setReport(o.id);
                        setError("");
                      }}
                    >
                      <Icon name="flag" size={15} /> Report a problem
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {report && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            <button
              className="modal-close icon-button"
              onClick={() => setReport(null)}
              aria-label="Close report"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">WE’RE HERE TO HELP</span>
            <h2 id="report-title">Something not right?</h2>
            <p>
              Describe the issue with your purchased ticket. An admin will
              review it.
            </p>
            <form onSubmit={submit}>
              <label>
                What happened?
                <textarea
                  autoFocus
                  name="reason"
                  required
                  maxLength={1500}
                  rows={5}
                  placeholder="Tell us what seems wrong…"
                />
              </label>
              {error && (
                <p className="alert error" role="alert">
                  {error}
                </p>
              )}
              <button className="button" disabled={busy}>
                {busy ? "Sending…" : "Send report"}
                <Icon />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setReport(null)}
              >
                Cancel
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
