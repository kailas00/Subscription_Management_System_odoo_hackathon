import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold">This page doesn't exist</h1>
      <Link to="/" className="mt-4 text-base font-medium text-brand hover:underline">Go to your home page</Link>
    </div>
  );
}
