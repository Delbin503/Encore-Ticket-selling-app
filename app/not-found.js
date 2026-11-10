import Link from "next/link";
export default function Page() {
  return (
    <div className="section-wrap empty">
      <span className="eyebrow">404 · WRONG STAGE</span>
      <h1>This gig isn’t here.</h1>
      <p>Let’s get you back to the crowd.</p>
      <Link className="button" href="/">
        Back to Encore →
      </Link>
    </div>
  );
}
