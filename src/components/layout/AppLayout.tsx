import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 overflow-auto pb-[var(--nav-height)]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
