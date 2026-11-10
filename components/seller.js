"use client";
import { useModalFocus } from "./use-modal-focus";
import { useState, useEffect } from "react";
import { Icon, Badge, Empty } from "./ui";
import Workspace from "./workspace";
import { api } from "./api";
import { money, date } from "@/lib/format";
export default function Seller({ user }) {
  const [tab, setTab] = useState("listings"),
    [listings, setListings] = useState([]),
    [sales, setSales] = useState([]),
    [events, setEvents] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [eventId, setEventId] = useState("");
  useModalFocus(Boolean(modal), () => setModal(null));
  async function load() {
    try {
      const [l, s, e] = await Promise.all([
        api("seller/listings"),
        api("seller/sales"),
        api("events"),
      ]);
      setListings(l);
      setSales(s);
      setEvents(e);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
  async function action(path, method, body, msg) {
    setBusy(true);
    setError("");
    try {
      await api(path, method, body);
      setModal(null);
      setNotice(msg);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openNew() {
    setModal({ type: "listing" });
    setEventId(String(events[0]?.id || ""));
    setError("");
  }
  async function save(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    if (modal.type === "handover")
      await action(
        `orders/${modal.order.id}/handover`,
        "PATCH",
        { details: f.details },
        "Handover details sent to the buyer.",
      );
    else
      await action(
        `seller/listings${modal.listing ? `/${modal.listing.id}` : ""}`,
        modal.listing ? "PATCH" : "POST",
        f,
        modal.listing
          ? "Listing updated."
          : "Your ticket is live. Let’s make someone’s night!",
      );
  }
  const chosenEvent = events.find((e) => String(e.id) === eventId);
  return (
    <Workspace mode="seller" user={user} tab={tab} setTab={setTab}>
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">YOUR TICKETS. THEIR NEXT GREAT NIGHT.</span>
          <h1>
            {tab === "listings" ? "Your seller era." : "Make the handover."}
          </h1>
          <p>
            {tab === "listings"
              ? "A little backstage space for your listings."
              : "Keep your buyers in the loop."}
          </p>
        </div>
        <button className="button" onClick={openNew}>
          <Icon name="plus" /> List a ticket
        </button>
      </div>
      <div className="stats">
        <div>
          <span>LIVE LISTINGS</span>
          <strong>
            {listings.filter((l) => l.status === "available").length}
            <Icon name="ticket" />
          </strong>
          <small>Ready for their next fan</small>
        </div>
        <div>
          <span>TICKETS SOLD</span>
          <strong>
            {sales.length}
            <Icon name="music" />
          </strong>
          <small>More nights made</small>
        </div>
        <div>
          <span>DEMO SALES TOTAL</span>
          <strong>
            {money(sales.reduce((n, s) => n + Number(s.price), 0))}
          </strong>
          <small>Simulated · no real earnings</small>
        </div>
      </div>
      {error && !modal && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert success" role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="loading">Getting your studio ready…</p>
      ) : tab === "listings" ? (
        <section className="data-panel">
          <div className="panel-heading">
            <h2>
              All your listings <Badge>{listings.length}</Badge>
            </h2>
            <span className="fine">One listing, one ticket.</span>
          </div>
          {!listings.length ? (
            <Empty title="Got a spare ticket?">
              List it and let another fan be there.
            </Empty>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CONCERT</th>
                    <th>SEAT</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.artist}</strong>
                        <small>{date(l.event_date)}</small>
                      </td>
                      <td>
                        {l.section}
                        <small>Seat {l.seat}</small>
                      </td>
                      <td>
                        <strong>{money(l.price)}</strong>
                      </td>
                      <td>
                        <Badge type={l.status === "available" ? "success" : ""}>
                          {l.status}
                        </Badge>
                      </td>
                      <td>
                        {l.status === "available" ? (
                          <div className="actions">
                            <button
                              className="text-button"
                              onClick={() => {
                                setModal({ type: "listing", listing: l });
                                setEventId(String(l.event_id));
                                setError("");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-button danger"
                              disabled={busy}
                              onClick={() => {
                                setModal({ type: "cancel", listing: l });
                                setError("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="fine">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="data-panel">
          <div className="panel-heading">
            <h2>Sales & handover</h2>
            <Badge>Simulated payments</Badge>
          </div>
          {!sales.length ? (
            <Empty title="The crowd is on its way.">
              Your sales will appear here.
            </Empty>
          ) : (
            <div className="sales-list">
              {sales.map((s) => (
                <article className="sale-row" key={s.id}>
                  <div>
                    <Badge>Order EN-{String(s.id).padStart(4, "0")}</Badge>
                    <h3>{s.artist}</h3>
                    <p>
                      {s.section} · Seat {s.seat} · Buyer: {s.buyer_name}
                    </p>
                    <p className="fine">
                      Handover: {s.handover_status} · Payout:{" "}
                      {s.payout_status === "simulated"
                        ? "simulated (no money sent)"
                        : "pending"}
                    </p>
                    {s.handover_details && (
                      <p className="handover-box">{s.handover_details}</p>
                    )}
                  </div>
                  <div>
                    <strong>{money(s.price)}</strong>
                    {s.handover_status === "pending" && (
                      <button
                        className="button small"
                        onClick={() => {
                          setModal({ type: "handover", order: s });
                          setError("");
                        }}
                      >
                        Send handover <Icon />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {modal && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-modal"
          >
            <button
              className="icon-button modal-close"
              onClick={() => setModal(null)}
              aria-label="Close dialog"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">PASS ON THE GOOD VIBES</span>
            <h2 id="seller-modal">
              {modal.type === "cancel"
                ? "Cancel this listing?"
                : modal.type === "handover"
                  ? "Over to the next fan."
                  : modal.listing
                    ? "Fine-tune your listing."
                    : "One ticket. A whole night."}
            </h2>
            {modal.type === "cancel" ? (
              <>
                <p>This removes your available ticket from discovery.</p>
                <button
                  disabled={busy}
                  className="button"
                  onClick={() =>
                    action(
                      `seller/listings/${modal.listing.id}`,
                      "DELETE",
                      undefined,
                      "Listing cancelled.",
                    )
                  }
                >
                  Confirm cancellation
                </button>
                <button className="text-button" onClick={() => setModal(null)}>
                  Keep listing
                </button>
              </>
            ) : (
              <form onSubmit={save}>
                {modal.type === "handover" ? (
                  <>
                    <label>
                      Handover instructions
                      <textarea
                        autoFocus
                        name="details"
                        required
                        maxLength={1500}
                        rows={5}
                        placeholder="Describe the demo handover arrangement…"
                      />
                    </label>
                    <p className="fine">
                      Demo only. Don’t share real ticket barcodes or sensitive
                      details.
                    </p>
                  </>
                ) : (
                  <>
                    <label>
                      Concert
                      <select
                        name="event_id"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        disabled={!!modal.listing}
                      >
                        {events.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.artist} · {date(e.event_date)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="field-row">
                      <label>
                        Section
                        <input
                          autoFocus
                          name="section"
                          required
                          maxLength={80}
                          defaultValue={modal.listing?.section}
                          placeholder="Zone A"
                        />
                      </label>
                      <label>
                        Seat
                        <input
                          name="seat"
                          required
                          maxLength={60}
                          defaultValue={modal.listing?.seat}
                          placeholder="A12 / Standing"
                        />
                      </label>
                    </div>
                    <label>
                      Resale price (THB)
                      <input
                        name="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={chosenEvent?.price_cap || 100000}
                        defaultValue={modal.listing?.price}
                        required
                        placeholder="2400"
                      />
                    </label>
                    <div className="cap-note">
                      <Icon name="shield" />
                      <span>
                        Event price cap:{" "}
                        <strong>{money(chosenEvent?.price_cap || 0)}</strong>
                      </span>
                    </div>
                  </>
                )}
                {error && (
                  <p className="alert error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button full" disabled={busy}>
                  {busy
                    ? "Saving…"
                    : modal.type === "handover"
                      ? "Send to buyer"
                      : modal.listing
                        ? "Save changes"
                        : "Publish my ticket"}
                  <Icon />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </Workspace>
  );
}
