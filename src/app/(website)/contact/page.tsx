"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";

const styles = `
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(to right, #4f46e5, #9333ea, #db2777);
  }
  
  .fade-in-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fade-in-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .hero-bg-glow {
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(252, 252, 253, 0) 70%);
      z-index: 0;
      pointer-events: none;
  }
`;

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(".fade-in-up");
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to your backend
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="relative min-h-screen bg-[#fcfcfd] text-[#111827] font-inter overflow-x-hidden pt-20">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="hero-bg-glow"></div>

      <section className="max-w-7xl mx-auto px-6 relative z-10 pt-4 pb-0">
        <div className="text-center mb-2 fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 tracking-tight text-gray-900">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about our platform or services? Our team is here to help you navigate your career journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 mb-0">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {[
              {
                title: "Email Us",
                value: "support@hryantra.com",
                desc: "We usually respond within 24 hours.",
                icon: Mail,
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                title: "Call Us",
                value: "+91 98765 43210",
                desc: "Mon - Fri, 9am - 6pm IST",
                icon: Phone,
                color: "text-purple-600",
                bg: "bg-purple-50"
              },
              {
                title: "Visit Us",
                value: "SAASA B2E Tech Hub",
                desc: "New Delhi, India",
                icon: MapPin,
                color: "text-pink-600",
                bg: "bg-pink-50"
              }
            ].map((item, i) => (
              <div key={item.title} className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm fade-in-up" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-900 font-semibold mb-1">{item.value}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-[2rem] shadow-xl relative overflow-hidden fade-in-up [transition-delay:300ms]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 blur-3xl rounded-full"></div>
              
              <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-3">
                Send us a Message <MessageCircle className="text-accent-primary" />
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="How can we help?"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us more about your inquiry..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-all flex items-center justify-center gap-3 group"
                >
                  Send Message
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl p-6 text-center text-white fade-in-up mt-4">
           <h2 className="text-2xl font-bold mb-2">Need Immediate Support?</h2>
           <p className="text-white/80 mb-4 max-w-lg mx-auto text-sm">Check out our Help Center for quick answers to common questions about resumes, interviews, and more.</p>
           <Link href="/help" className="px-10 py-4 bg-white text-accent-primary rounded-full font-bold hover:bg-gray-100 transition-all inline-block">
             Visit Help Center
           </Link>
        </div>
      </section>
    </div>
  );
}
