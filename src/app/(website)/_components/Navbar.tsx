"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Jobs", href: "/" },
  // { name: "Courses", href: "/explore-jobs" },
  { name: "Employers", href: "/employers" },
  { 
    name: "Services", 
    href: "/services",
    categories: [
      {
        title: "For Candidates",
        links: [
          { name: "All Candidate Services", href: "/services" },
          { name: "ATS Resume Check", href: "/ats-check" },
          { name: "LMS & Upskilling", href: "/services/learning" },
          { name: "AI Resume Intelligence", href: "/services/ai-resume-intelligence" },
          { name: "Executive Services", href: "/services/executive-services" },
        ]
      },
      {
        title: "For Employers",
        links: [
          { name: "Ecosystem Overview", href: "/services/employers/ecosystem" },
          { name: "Recruitment Modules", href: "/services/employers/modules" },
          { name: "Connected Workflow", href: "/services/employers/workflow" },
          { name: "AI & Operations", href: "/services/employers/operations" },
        ]
      }
    ]
  },
];

export default function WebsiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loginSignupHref = "/whatsapp";

  // Sliding pill state
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const [isReady, setIsReady] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = navLinks.findIndex((l) => 
    pathname === l.href || 
    (l.categories && l.categories.some(c => c.links.some(s => s.href === pathname)))
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  // Update pill position whenever active tab or layout changes
  const updatePill = () => {
    const el = linkRefs.current[currentIndex];
    const container = navRef.current;
    if (!el || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillStyle({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    });
    setIsReady(true);
  };

  useEffect(() => {
    updatePill();
  }, [currentIndex, pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updatePill);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePill);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-2 shadow-sm"
          : "bg-transparent py-2.5"
      }`}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 sm:px-5 lg:px-6">

        {/* Logo */}
        <Link href="/" className="relative flex items-center group">
          <div className="relative h-9 w-32">
            <Image
              src="/SAASA%20Logo.png"
              alt="SAASA B2E"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Nav with Sliding Pill */}
        <div ref={navRef} className="hidden md:flex items-center relative">
          {/* Sliding black pill — absolutely positioned inside nav container */}
          {isReady && (
            <div
              className="absolute top-0 bottom-0 rounded-full bg-slate-900 shadow-lg pointer-events-none"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}

          {navLinks.map((link, i) => {
            const isActive = currentIndex === i;
            if (link.categories) {
              return (
                <div key={link.name} className="relative group/nav z-50">
                  <button
                    ref={(el) => { linkRefs.current[i] = el; }}
                    onClick={() => router.push(link.href)}
                    className={`relative z-10 px-5 py-2 rounded-full text-[15px] font-medium transition-colors duration-200 flex items-center gap-1 ${
                      isActive ? "text-white" : "text-black hover:text-slate-700"
                    }`}
                  >
                    {link.name}
                    <svg className="w-4 h-4 opacity-70 group-hover/nav:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 w-[440px] bg-white/95 backdrop-blur-md border border-slate-100 rounded-[20px] shadow-xl p-5 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200">
                    <div className="grid grid-cols-2 gap-6">
                      {link.categories.map((category) => (
                        <div key={category.title}>
                          <p className="text-[11px] font-black uppercase tracking-widest text-[#28A8DF] mb-3 px-3">{category.title}</p>
                          <div className="flex flex-col gap-1">
                            {category.links.map((sub) => (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                className="block px-3 py-2 rounded-xl text-[14px] font-bold !text-black hover:!text-[#28A8DF] hover:bg-sky-50 transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <button
                key={link.name}
                ref={(el) => { linkRefs.current[i] = el; }}
                onClick={() => router.push(link.href)}
                className={`relative z-10 px-5 py-2 rounded-full text-[15px] font-medium transition-colors duration-200 ${
                  isActive ? "text-white" : "text-black hover:text-slate-700"
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href={loginSignupHref}
            className="border-2 border-black !text-black px-6 py-2 rounded-full text-[15px] font-bold hover:bg-black hover:!text-white transition-all"
          >
            Login/Signup
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 h-[calc(100vh-80px)] overflow-y-auto">
          {navLinks.map((link) => (
            <div key={link.name} className="flex flex-col gap-2">
              <Link
                href={link.href}
                className={`text-lg font-bold ${pathname === link.href ? "text-blue-600" : "text-slate-800"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
              {link.categories && (
                <div className="flex flex-col gap-4 pl-4 border-l-2 border-slate-100 ml-2 mt-2">
                  {link.categories.map((category) => (
                    <div key={category.title} className="flex flex-col gap-2">
                       <p className="text-[11px] font-black uppercase tracking-widest text-[#28A8DF]">{category.title}</p>
                       <div className="flex flex-col gap-3">
                        {category.links.map(sub => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`text-[15px] font-bold ${pathname === sub.href ? "!text-blue-600" : "!text-black"}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          <div className="flex flex-col gap-3 mt-2">
            <Link
              href={loginSignupHref}
              className="border-2 border-black !text-black text-center py-4 rounded-[18px] font-bold text-lg hover:bg-black hover:!text-white transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login/Signup
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
