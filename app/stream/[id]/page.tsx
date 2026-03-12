import { redirect } from 'next/navigation';

interface StreamRedirectProps {
  params: { id?: string };
}

// This is a server component so the redirect happens before the page is rendered.
export default function StreamRedirect({ params }: StreamRedirectProps) {
  const id = params?.id;
  if (id) {
    redirect(`/live-stream/${id}`);
  }
  // in case someone hits /stream without id we just show not found (could also redirect to /live-stream)
  return null;
}
