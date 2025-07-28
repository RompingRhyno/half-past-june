"use client";

import { useState, useEffect, useRef } from "react";
import { HiOutlineX } from "react-icons/hi";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1 after 50% scroll
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const heroHeight = heroRef.current.clientHeight;
      const scrollY = window.scrollY;

      // Calculate scroll progress after 50% of hero height
      const startFade = heroHeight * 0.5;
      const endFade = heroHeight;

      if (scrollY <= startFade) {
        setScrollProgress(0);
      } else if (scrollY >= endFade) {
        setScrollProgress(1);
      } else {
        // Normalize between 0 and 1 for the fade range (50% to 100%)
        const progress = (scrollY - startFade) / (endFade - startFade);
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logo opacity (fade from 0 to 1 between 50% and 100%)
  const opacity = scrollProgress;

  // Logo color: white until fully scrolled, then black instantly
  const logoColor = scrollProgress < 1 ? "#fff" : "#000";

  // Hamburger color: same logic as logo
  const hamburgerColor = scrollProgress < 1 ? "#fff" : "#000";

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sticky Transparent Top Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between bg-transparent px-4 py-3 min-h-[60px]">
        {!sidebarOpen && (
          <button
            aria-label="Toggle menu"
            className="text-2xl transition-colors duration-300"
            onClick={() => setSidebarOpen(true)}
            style={{ color: hamburgerColor }}
          >
            &#9776; {/* Hamburger icon (☰) */}
          </button>
        )}

        {/* Centered Logo Placeholder with fade and color transition */}
        <div
          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold text-xl transition-opacity duration-300 transition-colors"
          style={{ opacity, color: logoColor }}
        >
          Half Past June
        </div>

        {/* Empty space right side so logo can be centered */}
        <div style={{ width: 24 }}></div>
      </header>

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 z-50 w-64 h-[30vh] bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4">
          <button
            aria-label="Close menu"
            className="text-3xl mb-6"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX />
          </button>

          <ul className="flex flex-col gap-4 text-lg px-1">
            <li>
              <a href="#" onClick={() => setSidebarOpen(false)}>
                Home
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setSidebarOpen(false)}>
                Sustainability
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setSidebarOpen(false)}>
                About Us
              </a>
            </li>
            <li>
              <a href="#" onClick={() => setSidebarOpen(false)}>FAQ</a>
            </li>
            <li>
              <a href="#" onClick={() => setSidebarOpen(false)}>Contact</a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section
        ref={heroRef}
        className="h-screen bg-cover bg-center flex items-center text-white"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1620599375518-dde1c6500091?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        <div className="p-8 max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Half Past June</h1>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="max-w-3xl mx-auto p-8 text-gray-800">
        <h2 className="text-2xl font-semibold mb-2">Our Brand Values</h2>
        <p className="mb-4">
          We are committed to sustainability, quality, and authenticity in everything
          we do.
          <a href="#" className="text-blue-600 hover:underline ml-1">
            Continue reading →
          </a>
        </p>
      </section>

      {/* Lorem Ipsum Content for Scroll Testing */}
      <section className="max-w-3xl mx-auto p-8 text-gray-700">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
          malesuada orci nec tortor dignissim, non ultricies magna pulvinar. Sed
          tincidunt lorem vitae velit vulputate, at ultricies nulla cursus. Donec
          euismod, lorem nec consectetur vehicula, augue libero tincidunt elit, a
          fermentum velit elit a lorem. Suspendisse potenti.
        </p>
        <p className="mt-4">
          Nullam eget dictum sem, nec gravida urna. Aliquam erat volutpat. Praesent
          sed venenatis elit. Morbi dignissim velit sed felis consectetur, a tempus
          erat convallis. Etiam at turpis nec purus pulvinar varius.
        </p>
      </section>

      <section className="max-w-3xl mx-auto p-8 text-gray-700">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
          malesuada orci nec tortor dignissim, non ultricies magna pulvinar. Sed
          tincidunt lorem vitae velit vulputate, at ultricies nulla cursus. Donec
          euismod, lorem nec consectetur vehicula, augue libero tincidunt elit, a
          fermentum velit elit a lorem. Suspendisse potenti.
        </p>
        <p className="mt-4">
          Nullam eget dictum sem, nec gravida urna. Aliquam erat volutpat. Praesent
          sed venenatis elit. Morbi dignissim velit sed felis consectetur, a tempus
          erat convallis. Etiam at turpis nec purus pulvinar varius.
        </p>
      </section>
      <section className="max-w-3xl mx-auto p-8 text-gray-700">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
          malesuada orci nec tortor dignissim, non ultricies magna pulvinar. Sed
          tincidunt lorem vitae velit vulputate, at ultricies nulla cursus. Donec
          euismod, lorem nec consectetur vehicula, augue libero tincidunt elit, a
          fermentum velit elit a lorem. Suspendisse potenti.
        </p>
        <p className="mt-4">
          Nullam eget dictum sem, nec gravida urna. Aliquam erat volutpat. Praesent
          sed venenatis elit. Morbi dignissim velit sed felis consectetur, a tempus
          erat convallis. Etiam at turpis nec purus pulvinar varius.
        </p>
      </section>
      <section className="max-w-3xl mx-auto p-8 text-gray-700">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
          malesuada orci nec tortor dignissim, non ultricies magna pulvinar. Sed
          tincidunt lorem vitae velit vulputate, at ultricies nulla cursus. Donec
          euismod, lorem nec consectetur vehicula, augue libero tincidunt elit, a
          fermentum velit elit a lorem. Suspendisse potenti.
        </p>
        <p className="mt-4">
          Nullam eget dictum sem, nec gravida urna. Aliquam erat volutpat. Praesent
          sed venenatis elit. Morbi dignissim velit sed felis consectetur, a tempus
          erat convallis. Etiam at turpis nec purus pulvinar varius.
        </p>
      </section>

      {/* Main page content placeholder */}
      <main className="p-8">
        <h1>Welcome to Half Past June</h1>
        <p>This is your homepage content.</p>
      </main>
    </>
  );
}
