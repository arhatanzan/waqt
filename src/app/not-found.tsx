import Link from "next/link";

export default function NotFound() {
  return <div className="empty panel"><h1>Page not found</h1><p>This page or reference is not available.</p><Link className="button" href="/hadith">Browse the hadith library</Link></div>;
}
