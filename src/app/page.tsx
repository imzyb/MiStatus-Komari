import { ClientNavbar } from "@/components/client-navbar";
import { ServerFooter } from "@/components/server-footer";
import { ClientDashboardStats } from "@/components/client-dashboard-stats";
import { ClientServerSection } from "@/components/client-server-section";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen smooth-scroll">
      <ClientNavbar />
      <main className="flex-1 flex flex-col items-center smooth-scroll">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10 content-container">
          <ClientDashboardStats />
          <ClientServerSection />
        </div>
      </main>
      <ServerFooter />
    </div>
  );
}
