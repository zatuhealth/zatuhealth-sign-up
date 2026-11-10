import { createFileRoute } from '@tanstack/react-router';
import { AccountExperience } from '@/components/account-experience';

export const Route = createFileRoute('/test_/sign-in')({
  head: () => ({ meta: [
    { title: 'Test mobile sign-in | ZatuHealth' },
    { name: 'description', content: 'Team test sign-in with mobile number and password.' },
    { property: 'og:title', content: 'Test mobile sign-in | ZatuHealth' },
    { property: 'og:description', content: 'Team test sign-in for ZatuHealth.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <AccountExperience mode="signin" key="signin" signInPath="/test/sign-in" registerPath="/test/register" />,
});
