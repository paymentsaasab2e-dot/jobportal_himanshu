"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Mail, AlertCircle, Sparkles, TrendingUp, CheckCircle2, Star } from "lucide-react";

import { API_BASE_URL } from '@/lib/api-base';
import { showSuccessToast } from '@/components/common/toast/toast';

const countries = [
  { code: "AF", dialCode: "+93", name: "Afghanistan" },
  { code: "AL", dialCode: "+355", name: "Albania" },
  { code: "DZ", dialCode: "+213", name: "Algeria" },
  { code: "AD", dialCode: "+376", name: "Andorra" },
  { code: "AO", dialCode: "+244", name: "Angola" },
  { code: "AG", dialCode: "+1", name: "Antigua and Barbuda" },
  { code: "AR", dialCode: "+54", name: "Argentina" },
  { code: "AM", dialCode: "+374", name: "Armenia" },
  { code: "AU", dialCode: "+61", name: "Australia" },
  { code: "AT", dialCode: "+43", name: "Austria" },
  { code: "AZ", dialCode: "+994", name: "Azerbaijan" },
  { code: "BS", dialCode: "+1", name: "Bahamas" },
  { code: "BH", dialCode: "+973", name: "Bahrain" },
  { code: "BD", dialCode: "+880", name: "Bangladesh" },
  { code: "BB", dialCode: "+1", name: "Barbados" },
  { code: "BY", dialCode: "+375", name: "Belarus" },
  { code: "BE", dialCode: "+32", name: "Belgium" },
  { code: "BZ", dialCode: "+501", name: "Belize" },
  { code: "BJ", dialCode: "+229", name: "Benin" },
  { code: "BT", dialCode: "+975", name: "Bhutan" },
  { code: "BO", dialCode: "+591", name: "Bolivia" },
  { code: "BA", dialCode: "+387", name: "Bosnia and Herzegovina" },
  { code: "BW", dialCode: "+267", name: "Botswana" },
  { code: "BR", dialCode: "+55", name: "Brazil" },
  { code: "BN", dialCode: "+673", name: "Brunei" },
  { code: "BG", dialCode: "+359", name: "Bulgaria" },
  { code: "BF", dialCode: "+226", name: "Burkina Faso" },
  { code: "BI", dialCode: "+257", name: "Burundi" },
  { code: "KH", dialCode: "+855", name: "Cambodia" },
  { code: "CM", dialCode: "+237", name: "Cameroon" },
  { code: "CA", dialCode: "+1", name: "Canada" },
  { code: "CV", dialCode: "+238", name: "Cape Verde" },
  { code: "CF", dialCode: "+236", name: "Central African Republic" },
  { code: "TD", dialCode: "+235", name: "Chad" },
  { code: "CL", dialCode: "+56", name: "Chile" },
  { code: "CN", dialCode: "+86", name: "China" },
  { code: "CO", dialCode: "+57", name: "Colombia" },
  { code: "KM", dialCode: "+269", name: "Comoros" },
  { code: "CG", dialCode: "+242", name: "Congo" },
  { code: "CR", dialCode: "+506", name: "Costa Rica" },
  { code: "HR", dialCode: "+385", name: "Croatia" },
  { code: "CU", dialCode: "+53", name: "Cuba" },
  { code: "CY", dialCode: "+357", name: "Cyprus" },
  { code: "CZ", dialCode: "+420", name: "Czech Republic" },
  { code: "DK", dialCode: "+45", name: "Denmark" },
  { code: "DJ", dialCode: "+253", name: "Djibouti" },
  { code: "DM", dialCode: "+1", name: "Dominica" },
  { code: "DO", dialCode: "+1", name: "Dominican Republic" },
  { code: "EC", dialCode: "+593", name: "Ecuador" },
  { code: "EG", dialCode: "+20", name: "Egypt" },
  { code: "SV", dialCode: "+503", name: "El Salvador" },
  { code: "GQ", dialCode: "+240", name: "Equatorial Guinea" },
  { code: "ER", dialCode: "+291", name: "Eritrea" },
  { code: "EE", dialCode: "+372", name: "Estonia" },
  { code: "ET", dialCode: "+251", name: "Ethiopia" },
  { code: "FJ", dialCode: "+679", name: "Fiji" },
  { code: "FI", dialCode: "+358", name: "Finland" },
  { code: "FR", dialCode: "+33", name: "France" },
  { code: "GA", dialCode: "+241", name: "Gabon" },
  { code: "GM", dialCode: "+220", name: "Gambia" },
  { code: "GE", dialCode: "+995", name: "Georgia" },
  { code: "DE", dialCode: "+49", name: "Germany" },
  { code: "GH", dialCode: "+233", name: "Ghana" },
  { code: "GR", dialCode: "+30", name: "Greece" },
  { code: "GD", dialCode: "+1", name: "Grenada" },
  { code: "GT", dialCode: "+502", name: "Guatemala" },
  { code: "GN", dialCode: "+224", name: "Guinea" },
  { code: "GW", dialCode: "+245", name: "Guinea-Bissau" },
  { code: "GY", dialCode: "+592", name: "Guyana" },
  { code: "HT", dialCode: "+509", name: "Haiti" },
  { code: "HN", dialCode: "+504", name: "Honduras" },
  { code: "HK", dialCode: "+852", name: "Hong Kong" },
  { code: "HU", dialCode: "+36", name: "Hungary" },
  { code: "IS", dialCode: "+354", name: "Iceland" },
  { code: "IN", dialCode: "+91", name: "India" },
  { code: "ID", dialCode: "+62", name: "Indonesia" },
  { code: "IR", dialCode: "+98", name: "Iran" },
  { code: "IQ", dialCode: "+964", name: "Iraq" },
  { code: "IE", dialCode: "+353", name: "Ireland" },
  { code: "IL", dialCode: "+972", name: "Israel" },
  { code: "IT", dialCode: "+39", name: "Italy" },
  { code: "JM", dialCode: "+1", name: "Jamaica" },
  { code: "JP", dialCode: "+81", name: "Japan" },
  { code: "JO", dialCode: "+962", name: "Jordan" },
  { code: "KZ", dialCode: "+7", name: "Kazakhstan" },
  { code: "KE", dialCode: "+254", name: "Kenya" },
  { code: "KI", dialCode: "+686", name: "Kiribati" },
  { code: "KW", dialCode: "+965", name: "Kuwait" },
  { code: "KG", dialCode: "+996", name: "Kyrgyzstan" },
  { code: "LA", dialCode: "+856", name: "Laos" },
  { code: "LV", dialCode: "+371", name: "Latvia" },
  { code: "LB", dialCode: "+961", name: "Lebanon" },
  { code: "LS", dialCode: "+266", name: "Lesotho" },
  { code: "LR", dialCode: "+231", name: "Liberia" },
  { code: "LY", dialCode: "+218", name: "Libya" },
  { code: "LI", dialCode: "+423", name: "Liechtenstein" },
  { code: "LT", dialCode: "+370", name: "Lithuania" },
  { code: "LU", dialCode: "+352", name: "Luxembourg" },
  { code: "MO", dialCode: "+853", name: "Macao" },
  { code: "MG", dialCode: "+261", name: "Madagascar" },
  { code: "MW", dialCode: "+265", name: "Malawi" },
  { code: "MY", dialCode: "+60", name: "Malaysia" },
  { code: "MV", dialCode: "+960", name: "Maldives" },
  { code: "ML", dialCode: "+223", name: "Mali" },
  { code: "MT", dialCode: "+356", name: "Malta" },
  { code: "MH", dialCode: "+692", name: "Marshall Islands" },
  { code: "MR", dialCode: "+222", name: "Mauritania" },
  { code: "MU", dialCode: "+230", name: "Mauritius" },
  { code: "MX", dialCode: "+52", name: "Mexico" },
  { code: "FM", dialCode: "+691", name: "Micronesia" },
  { code: "MD", dialCode: "+373", name: "Moldova" },
  { code: "MC", dialCode: "+377", name: "Monaco" },
  { code: "MN", dialCode: "+976", name: "Mongolia" },
  { code: "ME", dialCode: "+382", name: "Montenegro" },
  { code: "MA", dialCode: "+212", name: "Morocco" },
  { code: "MZ", dialCode: "+258", name: "Mozambique" },
  { code: "MM", dialCode: "+95", name: "Myanmar" },
  { code: "NA", dialCode: "+264", name: "Namibia" },
  { code: "NR", dialCode: "+674", name: "Nauru" },
  { code: "NP", dialCode: "+977", name: "Nepal" },
  { code: "NL", dialCode: "+31", name: "Netherlands" },
  { code: "NZ", dialCode: "+64", name: "New Zealand" },
  { code: "NI", dialCode: "+505", name: "Nicaragua" },
  { code: "NE", dialCode: "+227", name: "Niger" },
  { code: "NG", dialCode: "+234", name: "Nigeria" },
  { code: "KP", dialCode: "+850", name: "North Korea" },
  { code: "MK", dialCode: "+389", name: "North Macedonia" },
  { code: "NO", dialCode: "+47", name: "Norway" },
  { code: "OM", dialCode: "+968", name: "Oman" },
  { code: "PK", dialCode: "+92", name: "Pakistan" },
  { code: "PW", dialCode: "+680", name: "Palau" },
  { code: "PA", dialCode: "+507", name: "Panama" },
  { code: "PG", dialCode: "+675", name: "Papua New Guinea" },
  { code: "PY", dialCode: "+595", name: "Paraguay" },
  { code: "PE", dialCode: "+51", name: "Peru" },
  { code: "PH", dialCode: "+63", name: "Philippines" },
  { code: "PL", dialCode: "+48", name: "Poland" },
  { code: "PT", dialCode: "+351", name: "Portugal" },
  { code: "QA", dialCode: "+974", name: "Qatar" },
  { code: "RO", dialCode: "+40", name: "Romania" },
  { code: "RU", dialCode: "+7", name: "Russia" },
  { code: "RW", dialCode: "+250", name: "Rwanda" },
  { code: "KN", dialCode: "+1", name: "Saint Kitts and Nevis" },
  { code: "LC", dialCode: "+1", name: "Saint Lucia" },
  { code: "VC", dialCode: "+1", name: "Saint Vincent and the Grenadines" },
  { code: "WS", dialCode: "+685", name: "Samoa" },
  { code: "SM", dialCode: "+378", name: "San Marino" },
  { code: "ST", dialCode: "+239", name: "Sao Tome and Principe" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia" },
  { code: "SN", dialCode: "+221", name: "Senegal" },
  { code: "RS", dialCode: "+381", name: "Serbia" },
  { code: "SC", dialCode: "+248", name: "Seychelles" },
  { code: "SL", dialCode: "+232", name: "Sierra Leone" },
  { code: "SG", dialCode: "+65", name: "Singapore" },
  { code: "SK", dialCode: "+421", name: "Slovakia" },
  { code: "SI", dialCode: "+386", name: "Slovenia" },
  { code: "SB", dialCode: "+677", name: "Solomon Islands" },
  { code: "SO", dialCode: "+252", name: "Somalia" },
  { code: "ZA", dialCode: "+27", name: "South Africa" },
  { code: "KR", dialCode: "+82", name: "South Korea" },
  { code: "SS", dialCode: "+211", name: "South Sudan" },
  { code: "ES", dialCode: "+34", name: "Spain" },
  { code: "LK", dialCode: "+94", name: "Sri Lanka" },
  { code: "SD", dialCode: "+249", name: "Sudan" },
  { code: "SR", dialCode: "+597", name: "Suriname" },
  { code: "SZ", dialCode: "+268", name: "Eswatini" },
  { code: "SE", dialCode: "+46", name: "Sweden" },
  { code: "CH", dialCode: "+41", name: "Switzerland" },
  { code: "SY", dialCode: "+963", name: "Syria" },
  { code: "TW", dialCode: "+886", name: "Taiwan" },
  { code: "TJ", dialCode: "+992", name: "Tajikistan" },
  { code: "TZ", dialCode: "+255", name: "Tanzania" },
  { code: "TH", dialCode: "+66", name: "Thailand" },
  { code: "TL", dialCode: "+670", name: "Timor-Leste" },
  { code: "TG", dialCode: "+228", name: "Togo" },
  { code: "TO", dialCode: "+676", name: "Tonga" },
  { code: "TT", dialCode: "+1", name: "Trinidad and Tobago" },
  { code: "TN", dialCode: "+216", name: "Tunisia" },
  { code: "TR", dialCode: "+90", name: "Turkey" },
  { code: "TM", dialCode: "+993", name: "Turkmenistan" },
  { code: "TV", dialCode: "+688", name: "Tuvalu" },
  { code: "UG", dialCode: "+256", name: "Uganda" },
  { code: "UA", dialCode: "+380", name: "Ukraine" },
  { code: "AE", dialCode: "+971", name: "United Arab Emirates" },
  { code: "GB", dialCode: "+44", name: "United Kingdom" },
  { code: "US", dialCode: "+1", name: "United States" },
  { code: "UY", dialCode: "+598", name: "Uruguay" },
  { code: "UZ", dialCode: "+998", name: "Uzbekistan" },
  { code: "VU", dialCode: "+678", name: "Vanuatu" },
  { code: "VA", dialCode: "+379", name: "Vatican City" },
  { code: "VE", dialCode: "+58", name: "Venezuela" },
  { code: "VN", dialCode: "+84", name: "Vietnam" },
  { code: "YE", dialCode: "+967", name: "Yemen" },
  { code: "ZM", dialCode: "+260", name: "Zambia" },
  { code: "ZW", dialCode: "+263", name: "Zimbabwe" },
];

const PHONE_LENGTH = 10;

function countryCodeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function WhatsAppLogin() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(
    countries.find((c) => c.code === "CM") || countries[0]
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [whatsappNumberValue, setWhatsappNumberValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpDisplay, setOtpDisplay] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setCountrySearch("");
  };

  const filteredCountries = countries.filter((country) => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return true;
    return (
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.includes(query.replace(/\s/g, ""))
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpDisplay("");

    // Validation
    if (!whatsappNumberValue.trim()) {
      setError("Please enter your WhatsApp number");
      return;
    }

    if (!emailValue.trim()) {
      setError("Please enter your Gmail address");
      return;
    }

    const normalizedEmail = emailValue.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(normalizedEmail)) {
      setError("Please enter a valid Gmail address");
      return;
    }

    const cleanNumber = whatsappNumberValue.replace(/\D/g, "");
    if (cleanNumber.length !== PHONE_LENGTH) {
      setError("Please enter exactly 10 digits for WhatsApp number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsappNumber: cleanNumber,
          countryCode: selectedCountry.dialCode,
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP");
      }

      // Store WhatsApp number and country code in sessionStorage for verify page
      sessionStorage.setItem("whatsappNumber", cleanNumber);
      sessionStorage.setItem("countryCode", selectedCountry.dialCode);
      sessionStorage.setItem("fullWhatsAppNumber", `${selectedCountry.dialCode}${cleanNumber}`);
      sessionStorage.setItem("otpEmail", normalizedEmail);

      // In development, show OTP on screen
      if (data.data.otp) {
        setOtpDisplay(data.data.otp);
        sessionStorage.setItem("otpPreview", data.data.otp);
      } else {
        sessionStorage.removeItem("otpPreview");
      }

      showSuccessToast("OTP sent", "Check your email for the verification code.");

      // Navigate to verify page
      router.push("/whatsapp/verify");
    } catch (err: unknown) {
      const isNetworkFail =
        err instanceof TypeError &&
        (err.message === "Failed to fetch" || err.message.includes("fetch"));
      setError(
        isNetworkFail
          ? `Cannot reach the API (${API_BASE_URL}). Start the backend on port 5000.`
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      );
      console.error("Error sending OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCFF] text-slate-900 flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.12)_0%,rgba(255,255,255,0)_70%)] opacity-80" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.06)_0%,rgba(255,255,255,0)_70%)] opacity-80" />
      </div>

      {/* Header (Cleaned up, no floating Help) */}
      <header className="flex flex-none items-center justify-between px-8 py-8 relative z-10 w-full max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Image
            src="/SAASA%20Logo.png"
            alt="SAASA B2E"
            width={130}
            height={38}
            className="h-9 w-auto hover:opacity-90 transition-opacity"
          />
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center relative z-10 w-full max-w-[1440px] px-6 lg:px-16 pb-16 mx-auto gap-12 lg:gap-20">
        
        {/* LEFT COMPONENT: The Card Shell */}
        <div className="w-full lg:w-[480px] flex flex-col items-center lg:items-end z-10">
          
          <div className="w-full bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_24px_60px_rgba(0,0,0,0.04)] border border-slate-100/80 p-8 sm:p-12 relative overflow-visible">
            
            <div className="mb-8 text-center">
              <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                Create your account
              </h1>
              <p className="mt-3 text-[15px] font-medium text-slate-500 leading-relaxed px-2">
                Enter your standard contact details safely. We'll send a code to your email.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSendOTP}>
              
              {/* WhatsApp number input group */}
              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">WhatsApp Number</label>
                <div className="flex relative rounded-[16px] border border-slate-200 shadow-sm overflow-visible bg-white focus-within:ring-4 focus-within:ring-sky-100/50 focus-within:border-sky-400 transition-all">
                  
                  {/* Country Dropdown trigger inside input */}
                  <div className="relative flex-shrink-0" ref={dropdownRef}>
                    <button
                      type="button"
                      className="flex h-[56px] px-4 items-center gap-2 hover:bg-slate-50 transition-colors rounded-l-[16px] text-slate-700 font-medium text-[15px]"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="text-[22px] leading-none">{countryCodeToFlag(selectedCountry.code)}</span>
                      <span className="text-slate-400 text-[10px] ml-1">▼</span>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-[240px] max-h-[300px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] py-2">
                        <div className="px-3 pb-2 sticky top-0 bg-white z-10">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country / code"
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                          />
                        </div>

                        {filteredCountries.map((country) => (
                          <div
                            key={country.code}
                            className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                            onClick={() => handleCountrySelect(country)}
                          >
                            <span className="text-[20px] leading-none">{countryCodeToFlag(country.code)}</span>
                            <span className="font-bold text-slate-800 w-12 text-[14px]">{country.dialCode}</span>
                            <span className="text-[13px] font-semibold text-slate-600 truncate">{country.name}</span>
                          </div>
                        ))}
                        {filteredCountries.length === 0 && (
                          <div className="px-4 py-3 text-[13px] font-medium text-slate-500">
                            No country found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider inside input */}
                  <div className="w-px h-7 bg-slate-200 my-auto" />

                  {/* Input itself */}
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-0 bottom-0 flex items-center text-slate-400 pointer-events-none font-semibold text-[15px]">
                      {selectedCountry.dialCode}
                    </div>
                    <input
                      type="tel"
                      value={whatsappNumberValue}
                      onChange={(e) => setWhatsappNumberValue(e.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH))}
                      maxLength={PHONE_LENGTH}
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      className="w-full h-[56px] pl-[56px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[16px] placeholder:text-slate-300 placeholder:font-semibold rounded-r-[16px]"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
              </div>

              {/* Email input group */}
              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">Gmail Address</label>
                <div className="relative rounded-[16px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-sky-100/50 focus-within:border-sky-400 transition-all">
                  <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full h-[56px] pl-[52px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[16px] placeholder:text-slate-300 placeholder:font-semibold"
                    placeholder="name@gmail.com"
                  />
                </div>
              </div>

              {/* Errors */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start mt-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[13px] font-bold text-red-700 leading-snug pt-0.5">{error}</p>
                </div>
              )}

              {/* Dev Mode OTP */}
              {otpDisplay && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 mt-4">
                  <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-3">Development Mode</p>
                  <div className="flex items-center gap-4">
                    <span className="bg-white border border-emerald-200 text-emerald-800 font-mono font-black text-xl px-4 py-2 rounded-xl shadow-sm tracking-[0.2em]">
                      {otpDisplay}
                    </span>
                    <p className="text-[13px] font-semibold text-emerald-700 leading-snug flex-1">
                      OTP delivery bypassed.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[56px] flex justify-center items-center gap-2 rounded-[16px] bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-black text-[15px] shadow-[0_8px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_12px_24px_rgba(14,165,233,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 hover:-translate-y-0.5 transform"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Trust Strip */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-[13px] font-bold text-slate-500 tracking-tight">
                Secure passwordless entry
              </p>
            </div>

          </div>
          
          {/* Help & Terms Restructured Below */}
          <div className="mt-8 flex flex-col items-center lg:items-end w-full max-w-[440px] gap-3 px-2">
            <a href="#" className="text-[14px] font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1.5 hover:underline decoration-sky-300 underline-offset-4">
              Need help entering?
            </a>
            <p className="text-center lg:text-right text-[13px] font-semibold text-slate-400 leading-relaxed max-w-[320px]">
              By continuing, you agree to our <a href="#" className="text-slate-600 hover:text-sky-600 transition-colors">Terms of Service</a> & <a href="#" className="text-slate-600 hover:text-sky-600 transition-colors">Privacy Policy</a>
            </p>
          </div>

        </div>

        {/* RIGHT COMPONENT: Visual Storytelling */}
        <div className="hidden lg:flex flex-1 flex-col justify-center items-start relative pl-12 pr-6 z-10 lg:mt-[-40px]">
          
          <div className="w-full max-w-[540px] relative">
            {/* Atmospheric Glow behind cards */}
            <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-200/40 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-[40px] font-black text-slate-900 tracking-tight leading-[1.1] mb-5 relative z-10 drop-shadow-sm">
              Enter the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-300">intelligent era</span><br />of hiring.
            </h2>
            <p className="text-[18px] font-medium text-slate-500 leading-relaxed mb-16 relative z-10 max-w-[420px]">
              Our OS builds your AI profile, validates your experience, and matches you with top-tier opportunities instantly.
            </p>

            <div className="relative w-full h-[320px]">
              
              {/* Card 1: ATS Match Score (Dark Mode) */}
              <div className="absolute top-0 left-0 w-[240px] bg-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.2)] rounded-[24px] p-6 text-white z-20 border border-slate-700/50 transform hover:-translate-y-2 transition-transform duration-500">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[11px] font-bold tracking-widest uppercase bg-white/10 px-3 py-1.5 rounded-full text-slate-300">ATS Match</span>
                 </div>
                 <p className="text-[46px] font-black leading-none mb-1 tracking-tighter">94<span className="text-[24px] text-slate-400 font-bold ml-1">%</span></p>
                 <p className="text-[14px] font-semibold text-slate-400">Exceptional Fit Profile</p>
              </div>

              {/* Card 2: Skill Engine (Glassmorphism overlap) */}
              <div className="absolute top-[50px] left-[180px] w-[300px] bg-white/95 backdrop-blur-xl border border-slate-100/80 shadow-[0_24px_50px_rgba(0,0,0,0.06)] rounded-[24px] p-6 z-10 transform hover:-translate-y-1 transition-transform duration-500">
                 <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100">
                       <Sparkles className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Extraction</p>
                       <p className="text-[16px] font-black text-slate-800 tracking-tight leading-none">Skills Validated</p>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[13px] font-bold text-slate-700">React</span>
                    <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[13px] font-bold text-slate-700">TypeScript</span>
                    <span className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[13px] font-bold text-slate-700">Node</span>
                    <span className="bg-sky-50 text-sky-600 border border-sky-200 px-3 py-1.5 rounded-lg text-[13px] font-black">+12</span>
                 </div>
              </div>

              {/* Card 3: Profile Strength Signal */}
              <div className="absolute bottom-[20px] left-[40px] w-[340px] bg-white/90 backdrop-blur-xl border border-white shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[20px] p-5 z-30 flex items-center gap-5 transform hover:scale-[1.02] transition-transform duration-500">
                 <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                 </div>
                 <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-1.5">
                         <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                         <span className="text-[13px] font-black text-slate-800 tracking-tight">Top 5% Candidate</span>
                       </div>
                       <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-right shrink-0">Strong</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 w-[95%] rounded-full shadow-sm" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}
