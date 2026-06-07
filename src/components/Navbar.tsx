import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("");
  
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const handleScroll = () => {
      const sections = ["pack", "leaderboard", "how-it-works"];
      let current = "";
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            current = section;
          }
        }
      }
      
      if (window.scrollY < 100) {
        current = "";
      }

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);
  
  const navItems = [
    { name: "Packs", hash: "pack" },
    { name: "Leaderboard", hash: "leaderboard" },
    { name: "How It Works", hash: "how-it-works" },
  ];

  const handleNavClick = (hash: string) => {
    if (location.pathname !== "/") {
      navigate("/#" + hash);
    } else {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", "/#" + hash);
      setActiveSection(hash);
    }
  };

  return (
      <nav className="fixed top-4 inset-x-0 z-[110] flex justify-center px-2 sm:px-4">
      <div 
        className="w-full max-w-5xl bg-white px-3 sm:px-6 py-2 flex sm:py-2.5 items-center justify-between transition-all overflow-x-auto gap-2"
        style={{
          border: "4px solid #2d2d2d",
          boxShadow: "-1px 3px 0px 1px rgba(0,0,0,0.15)",
          borderRadius: "0px",
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <Link 
          to="/" 
          onClick={() => {
            window.dispatchEvent(new Event('close-reward'));
            window.scrollTo({ top: 0, behavior: "smooth" });
            history.pushState(null, "", "/");
            setActiveSection("");
          }}
          className="flex items-center gap-2 group flex-shrink-0"
        >
          <div className="relative w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg width="0" height="0" className="absolute">
              <filter id="remove-black" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="
                  1   0   0   0   0
                  0   1   0   0   0
                  0   0   1   0   0
                  33  33  33  0  -3
                " />
              </filter>
            </svg>
            <video 
              autoPlay
              loop
              muted
              playsInline
              src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/logo.mp4" 
              className="w-full h-full object-cover scale-[1.5] origin-center"
              style={{ filter: "url(#remove-black)", imageRendering: "pixelated" }}
            />
          </div>
          <span 
            className="text-[1.1rem] sm:text-[1.35rem] tracking-wide text-[#f74170] hidden sm:inline-block"
            style={{ fontFamily: "ByteBounce, monospace", textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}
          >
            PokeGrails
          </span>
        </Link>
        
        <div className="flex flex-nowrap items-center gap-3 sm:gap-6 flex-shrink-0 ml-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === "/" && activeSection === item.hash;
            return (
              <button
                key={item.hash}
                onClick={() => handleNavClick(item.hash)}
                className={cn(
                  "text-[1rem] sm:text-[1.1rem] transition-transform hover:-translate-y-[1px] cursor-pointer whitespace-nowrap",
                  isActive ? "text-[#002f6c] font-bold border-b-2 border-[#002f6c]" : "text-[#003b87]"
                )}
                style={{ fontFamily: "ByteBounce, monospace" }}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
          <Link
            to="/vault"
            className={cn(
              "text-[1rem] sm:text-[1.1rem] transition-transform hover:-translate-y-[1px] whitespace-nowrap",
              location.pathname === "/vault" ? "text-[#002f6c] font-bold border-b-2 border-[#002f6c]" : "text-[#003b87] bg-yellow-300 px-2 rounded-sm shadow-sm border border-yellow-500 hover:bg-yellow-400"
            )}
            style={{ fontFamily: "ByteBounce, monospace" }}
          >
             <span>My Vault</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

