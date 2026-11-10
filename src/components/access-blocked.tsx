import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function AccessBlocked() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">ZatuHealth is not open yet</h1>
        <p className="text-muted-foreground">Sign-up and sign-in are temporarily closed while we test. Please check back soon.</p>
        <Button asChild variant="outline"><Link to="/test">Team test access</Link></Button>
      </div>
    </main>
  );
}
