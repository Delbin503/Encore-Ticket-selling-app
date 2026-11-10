"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="section-wrap empty">
      <h1>A little technical intermission.</h1>
      <p>
        We couldn’t load this page. Check that the database is running and try
        again.
      </p>
      <button className="button" onClick={reset}>
        Try again ↻
      </button>
    </div>
  );
}
