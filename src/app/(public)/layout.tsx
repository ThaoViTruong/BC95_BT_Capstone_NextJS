import { AppHeader } from "@/components/layout/app-header";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      {children}
    </div>
  );
}
