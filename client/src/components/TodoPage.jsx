import { Hammer } from 'lucide-react';
import { PageHeader } from './ui/index.js';

export function TodoPage({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card flex items-center gap-3 p-6 text-base text-muted">
        <Hammer className="size-5 text-accent" aria-hidden />This section is coming soon.
      </div>
    </>
  );
}
