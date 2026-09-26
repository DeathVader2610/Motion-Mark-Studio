import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty-state">
      <p className="eyebrow">404 / OUT OF FRAME</p>
      <h1>This story isn’t here.</h1>
      <p>The page may have moved or hasn’t been published yet.</p>
      <Link href="/" className="button">
        Back to the studio ↗
      </Link>
    </div>
  );
}
