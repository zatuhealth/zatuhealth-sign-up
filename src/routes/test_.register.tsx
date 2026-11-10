import { createFileRoute } from '@tanstack/react-router';
import { AccountExperience } from '@/components/account-experience';

export const Route = createFileRoute('/test_/register')({
  head: () => ({ meta: [
    { title: 'Test sign-up | ZatuHealth' },
    { name: 'description', content: 'Team test sign-up with mobile number and SMS code.' },
    { property: 'og:title', content: 'Test sign-up | ZatuHealth' },
    { property: 'og:description', content: 'Team test sign-up for ZatuHealth.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }),
  component: () => <AccountExperience key="register" signInPath="/test/sign-in" registerPath="/test/register" />,
});
