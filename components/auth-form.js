"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon, Star } from "./ui";
export default function AuthForm({ register = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false),
    [created, setCreated] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const fields = Object.fromEntries(new FormData(e.currentTarget));
      const r = await fetch(`/api/auth/${register ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.message);
      if (register) {
        setCreated(true);
        return;
      }
      window.location.href =
        data.role === "admin"
          ? "/admin"
          : data.role === "seller"
            ? "/seller"
            : "/tickets";
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout section-wrap">
      <aside className="auth-aside">
        <span className="eyebrow">WELCOME TO THE FAN CLUB</span>
        <h1>
          Your next
          <br />
          “I was there”
          <br />
          starts here<span>.</span>
        </h1>
        <Star className="auth-star" />
        <p>
          A little closer to the stage.
          <br />A lot closer to your people.
        </p>
        <div className="auth-ticket">
          <Icon name="ticket" size={30} />
          <span>
            ONE ACCOUNT.
            <br />
            <strong>SO MANY GOOD NIGHTS.</strong>
          </span>
        </div>
      </aside>
      <section className="auth-card">
        <span className="eyebrow">
          {register ? "LET’S MAKE SOME MEMORIES" : "GOOD TO SEE YOU AGAIN"}
        </span>
        <h2>{register ? "Join the crowd." : "Welcome back."}</h2>
        <p>
          {register
            ? "Create a buyer account. You can apply to sell later."
            : "Your favourite nights are waiting."}
        </p>
        {created ? (
          <div className="success-block">
            <Icon name="check" size={36} />
            <h3>You’re in!</h3>
            <p>Your account is ready. Sign in to discover your next gig.</p>
            <Link className="button" href="/login">
              Sign in <Icon />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="fullname"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="What should we call you?"
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                maxLength={190}
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 8 : 1}
                  maxLength={100}
                  placeholder={
                    register ? "At least 8 characters" : "Your password"
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <button className="button full" disabled={busy}>
              {busy
                ? "One moment…"
                : register
                  ? "Create my account"
                  : "Let me in"}
              <Icon />
            </button>
          </form>
        )}
        <p className="auth-switch">
          {register ? "Already in the fan club?" : "New around here?"}{" "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Join Encore"}
          </Link>
        </p>
        {!register && (
          <div className="demo-box">
            <strong>Take Encore for a spin</strong>
            <p>Demo accounts · fictional tickets · no real payments</p>
            <div className="demo-buttons">
              {["buyer", "seller", "admin"].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => {
                    setEmail(`${role}@encore.test`);
                    setPassword("Encore2026!");
                  }}
                >
                  {role}
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <small>Choose a role, then select “Let me in”.</small>
          </div>
        )}
      </section>
    </div>
  );
}
