import { MarketingNavbar } from '@/components/marketing/navbar';
import { MarketingFooter } from '@/components/marketing/footer';

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <MarketingNavbar />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
