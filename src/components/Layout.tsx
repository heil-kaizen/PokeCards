import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div 
      className="min-h-screen text-slate-800 font-sans relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url("https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/pokedex-background.webp")' }}
    >
      {/* Background ambient effects - Optimized for scroll performance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-200/20 blur-3xl animate-pulse" style={{ animationDuration: '8s', willChange: 'opacity' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-200/20 blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s', willChange: 'opacity' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-violet-200/20 blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s', willChange: 'opacity' }} />
      </div>
      
      <Navbar />
      
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
