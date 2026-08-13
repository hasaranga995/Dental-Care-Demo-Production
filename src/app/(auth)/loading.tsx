/** Avoid the root dental PageLoader hanging over auth routes on refresh. */
export default function AuthLoading() {
  return <div className="min-h-screen bg-background" aria-hidden />;
}
