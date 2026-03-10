import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button size="lg">
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
