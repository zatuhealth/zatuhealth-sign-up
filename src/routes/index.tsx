import { createFileRoute } from "@tanstack/react-router";
import { AccessBlocked } from '@/components/access-blocked';
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'Create your account | ZatuHealth' },
    { name: 'description', content: 'Create your ZatuHealth account, verify your mobile number and complete your personal health profile.' },
    { property: 'og:title', content: 'Create your account | ZatuHealth' },
    { property: 'og:description', content: 'Start your ZatuHealth journey with secure mobile registration.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
function Index() {
  return <AccessBlocked />;
}
