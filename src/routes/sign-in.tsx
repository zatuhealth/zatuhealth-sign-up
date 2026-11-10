import { createFileRoute } from '@tanstack/react-router';
import { AccessBlocked } from '@/components/access-blocked';

export const Route = createFileRoute('/sign-in')({
  head: () => ({ meta: [
    { title: 'Sign in | ZatuHealth' },
    { name: 'description', content: 'Sign in to ZatuHealth securely with your mobile number and password.' },
    { property: 'og:title', content: 'Sign in | ZatuHealth' },
    { property: 'og:description', content: 'Access your personal ZatuHealth profile using your mobile number.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SignIn,
});
function SignIn() { return <AccessBlocked />; }