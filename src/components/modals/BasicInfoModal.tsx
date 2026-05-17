'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  ALL_COUNTRY_CODES,
  countryCodeToFlag,
  formatPhoneCodeLabel,
} from '@/lib/country-codes';
import { profileCancelBtnClass, profileFieldClass, profileSaveBtnClass } from '@/lib/profile-modal-ui';

function isValidCalendarYmd(year: number, month: number, day: number) {
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

/** Strict DD/MM/YYYY → ISO YYYY-MM-DD */
function parseDdMmYyyyToIso(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (!isValidCalendarYmd(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function formatDobDigitsAsDdMmYyyy(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function dateToIsoYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

// --- Nominatim (OpenStreetMap) city autocomplete --------------------------------

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
};

type NominatimPlace = {
  display_name: string;
  address?: NominatimAddress;
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function extractLocality(addr: NominatimAddress | undefined, displayName: string): string {
  if (!addr) return displayName.split(',')[0]?.trim() || '';
  const raw =
    (addr.city || addr.town || addr.village || addr.county || '').trim();
  if (raw) return raw;
  return displayName.split(',')[0]?.trim() || '';
}

function formatPlaceSuggestionLine(place: NominatimPlace): string {
  const addr = place.address;
  const locality = extractLocality(addr, place.display_name);
  const state = addr?.state || addr?.region;
  const country = addr?.country;
  const parts = [locality, state, country].filter(Boolean);
  if (parts.length >= 2) return parts.join(', ');
  const bits = place.display_name
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  return bits.join(', ');
}

function resolveCountryToSelectValue(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  const n = raw.trim();
  const lower = n.toLowerCase();
  const aliases: Record<string, string> = {
    'united states of america': 'United States',
    usa: 'United States',
    'russian federation': 'Russia',
    czechia: 'Czech Republic',
    'türkiye': 'Turkey',
    turkiye: 'Turkey',
    'great britain': 'United Kingdom',
    uk: 'United Kingdom',
    england: 'United Kingdom',
    scotland: 'United Kingdom',
    wales: 'United Kingdom',
  };
  const mapped = aliases[lower];
  const candidate = mapped || n;
  const cLower = candidate.toLowerCase();
  const exact = ALL_COUNTRY_CODES.find((c) => c.name.toLowerCase() === cLower);
  if (exact) return exact.name;
  const contains = ALL_COUNTRY_CODES.find(
    (c) => cLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(cLower)
  );
  return contains?.name || '';
}

async function fetchNominatimPlaces(query: string, signal: AbortSignal): Promise<NominatimPlace[]> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'JobPortalBasicInfoModal/1.0 (CRM; contact: local)',
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as NominatimPlace[];
  return Array.isArray(data) ? data : [];
}

interface BasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BasicInfoData) => void | Promise<void>;
  initialData?: BasicInfoData;
}

export interface BasicInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  gender: string;
  /** ISO YYYY-MM-DD for API; modal shows a single DD/MM/YYYY field */
  dob: string;
  country: string;
  city: string;
  employment: string;
  passportNumber?: string;
  whatsappNumber?: string;
}

type BasicInfoFieldKey =
  | 'firstName'
  | 'email'
  | 'phone'
  | 'gender'
  | 'dob'
  | 'city'
  | 'country';

export default function BasicInfoModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: BasicInfoModalProps) {
  const getMaxDobDate = () => {
    const now = new Date();
    const maxDob = new Date(now);
    maxDob.setFullYear(now.getFullYear() - 18);
    return maxDob;
  };

  const [firstNameValue, setFirstNameValue] = useState(initialData?.firstName || '');
  const [middleNameValue, setMiddleNameValue] = useState(initialData?.middleName || '');
  const [lastNameValue, setLastNameValue] = useState(initialData?.lastName || '');
  const [emailValue, setEmailValue] = useState(initialData?.email || '');
  const [phoneValue, setPhoneValue] = useState(initialData?.phone || '');
  const [phoneCode, setPhoneCode] = useState(initialData?.phoneCode || '+91 (India)');
  const [isPhoneCodeOpen, setIsPhoneCodeOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState('');
  const [genderValue, setGenderValue] = useState(initialData?.gender || '');
  const [dobDisplay, setDobDisplay] = useState('');
  const [countryValue, setCountryValue] = useState(initialData?.country || '');
  const [cityValue, setCityValue] = useState(initialData?.city || '');
  const [employmentValue, setEmploymentValue] = useState(initialData?.employment || '');
  const [passportNumberValue, setPassportNumberValue] = useState(initialData?.passportNumber || '');
  const [errors, setErrors] = useState<Partial<Record<BasicInfoFieldKey, string>>>({});
  const phoneCodeRef = useRef<HTMLDivElement>(null);
  const hiddenDobPickerRef = useRef<HTMLInputElement>(null);
  const cityAutocompleteRef = useRef<HTMLDivElement>(null);
  const cityAbortRef = useRef<AbortController | null>(null);
  const citySuggestOpenRef = useRef(false);

  const [citySuggestions, setCitySuggestions] = useState<NominatimPlace[]>([]);
  const [citySuggestLoading, setCitySuggestLoading] = useState(false);
  const [citySuggestError, setCitySuggestError] = useState<string | null>(null);
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);
  const [cityHighlight, setCityHighlight] = useState(-1);

  const maxDob = useMemo(() => getMaxDobDate(), []);
  const maxDobIso = useMemo(() => dateToIsoYmd(maxDob), [maxDob]);

  const selectedPhoneCodeOption = useMemo(() => {
    const directMatch = ALL_COUNTRY_CODES.find((item) => formatPhoneCodeLabel(item) === phoneCode);
    if (directMatch) return directMatch;
    const dialPrefix = phoneCode.split(' ')[0];
    return ALL_COUNTRY_CODES.find((item) => item.dialCode === dialPrefix) || ALL_COUNTRY_CODES.find(c => c.code === 'CM') || ALL_COUNTRY_CODES[0];
  }, [phoneCode]);

  const filteredPhoneCodes = useMemo(() => {
    const rawQuery = phoneCodeSearch.trim().toLowerCase();
    if (!rawQuery) return ALL_COUNTRY_CODES;

    const compactQuery = rawQuery.replace(/\s+/g, '');
    const queryDigits = compactQuery.replace(/[^\d]/g, '');
    const isNumericQuery = queryDigits.length > 0 && /^[+\d\s]+$/.test(rawQuery);

    return ALL_COUNTRY_CODES.filter((item) => {
      const itemName = item.name.toLowerCase();
      const itemCode = item.code.toLowerCase();
      const itemDialCompact = item.dialCode.replace(/\s+/g, '').toLowerCase();
      const itemDialDigits = itemDialCompact.replace(/[^\d]/g, '');

      if (isNumericQuery) {
        if (compactQuery.startsWith('+')) {
          return itemDialCompact.startsWith(compactQuery);
        }
        return itemDialDigits.startsWith(queryDigits);
      }

      return (
        itemName.includes(rawQuery) ||
        itemCode.includes(rawQuery) ||
        itemDialCompact.includes(compactQuery)
      );
    });
  }, [phoneCodeSearch]);

  // Update values when initialData changes
  useEffect(() => {
    if (initialData) {
      setFirstNameValue(initialData.firstName || '');
      setMiddleNameValue(initialData.middleName || '');
      setLastNameValue(initialData.lastName || '');
      setEmailValue(initialData.email || '');
      setPhoneValue(initialData.phone || '');
      setPhoneCode(initialData.phoneCode || '+91 (India)');
      setGenderValue(initialData.gender || '');
      setDobDisplay(initialData.dob ? isoToDdMmYyyy(initialData.dob) : '');
      setCountryValue(initialData.country || '');
      setCityValue(initialData.city || '');
      setEmploymentValue(initialData.employment || '');
      setPassportNumberValue(initialData.passportNumber || '');
      setCitySuggestOpen(false);
      setCitySuggestions([]);
      setCitySuggestError(null);
      setCityHighlight(-1);
      setCitySuggestLoading(false);
      cityAbortRef.current?.abort();
    } else {
      // Clear all fields for "Add" mode
      setFirstNameValue('');
      setMiddleNameValue('');
      setLastNameValue('');
      setEmailValue('');
      setPhoneValue('');
      setPhoneCode('+91 (India)');
      setGenderValue('');
      setDobDisplay('');
      setCountryValue('');
      setCityValue('');
      setEmploymentValue('');
      setPassportNumberValue('');
      setCitySuggestOpen(false);
      setCitySuggestions([]);
      setCitySuggestError(null);
      setCityHighlight(-1);
      setCitySuggestLoading(false);
      cityAbortRef.current?.abort();
    }
  }, [initialData, isOpen]);

  const applyCitySuggestion = useCallback((place: NominatimPlace) => {
    const addr = place.address;
    const locality = extractLocality(addr, place.display_name);
    const countrySelect = resolveCountryToSelectValue(addr?.country);
    setCityValue(locality);
    if (countrySelect) setCountryValue(countrySelect);
    setCitySuggestOpen(false);
    setCitySuggestions([]);
    setCityHighlight(-1);
    setCitySuggestError(null);
  }, []);

  useEffect(() => {
    citySuggestOpenRef.current = citySuggestOpen;
  }, [citySuggestOpen]);

  useEffect(() => {
    if (!citySuggestOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (cityAutocompleteRef.current && !cityAutocompleteRef.current.contains(event.target as Node)) {
        setCitySuggestOpen(false);
        setCityHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [citySuggestOpen]);

  useEffect(() => {
    if (!isOpen) {
      cityAbortRef.current?.abort();
      setCitySuggestLoading(false);
      setCitySuggestOpen(false);
      setCitySuggestError(null);
      setCityHighlight(-1);
      setCitySuggestions([]);
      return;
    }

    const q = cityValue.trim();
    if (q.length < 2) {
      cityAbortRef.current?.abort();
      setCitySuggestLoading(false);
      setCitySuggestOpen(false);
      setCitySuggestError(null);
      setCityHighlight(-1);
      setCitySuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      cityAbortRef.current?.abort();
      const ac = new AbortController();
      cityAbortRef.current = ac;
      setCitySuggestError(null);
      setCitySuggestLoading(true);
      setCitySuggestOpen(true);
      setCityHighlight(-1);
      setCitySuggestions([]);

      void (async () => {
        try {
          const list = await fetchNominatimPlaces(q, ac.signal);
          if (ac.signal.aborted) return;
          setCitySuggestions(list);
          setCityHighlight(-1);
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          if (!ac.signal.aborted) {
            setCitySuggestions([]);
            setCitySuggestError('Could not load suggestions.');
          }
        } finally {
          if (!ac.signal.aborted) setCitySuggestLoading(false);
        }
      })();
    }, 500);

    return () => {
      window.clearTimeout(timer);
      cityAbortRef.current?.abort();
    };
  }, [cityValue, isOpen]);

  useEffect(() => {
    if (cityHighlight < 0 || !cityAutocompleteRef.current) return;
    const node = cityAutocompleteRef.current.querySelector(`[data-city-suggest-index="${cityHighlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [cityHighlight]);

  const getTrimmed = (value: string) => value.trim();

  const buildPayload = (): BasicInfoData => ({
    firstName: getTrimmed(firstNameValue),
    middleName: getTrimmed(middleNameValue),
    lastName: getTrimmed(lastNameValue),
    email: getTrimmed(emailValue),
    phone: getTrimmed(phoneValue),
    phoneCode: getTrimmed(phoneCode),
    gender: getTrimmed(genderValue),
    dob: parseDdMmYyyyToIso(dobDisplay) || '',
    country: getTrimmed(countryValue),
    city: getTrimmed(cityValue),
    employment: getTrimmed(employmentValue),
    passportNumber: getTrimmed(passportNumberValue),
  });

  const validate = (payload: BasicInfoData) => {
    const nextErrors: Partial<Record<BasicInfoFieldKey, string>> = {};

    if (!payload.firstName) nextErrors.firstName = 'First name is required.';
    if (!payload.email) nextErrors.email = 'Email is required.';
    if (!payload.phone) {
      nextErrors.phone = 'Phone number is required.';
    } else {
      const expectedLength = selectedPhoneCodeOption.phoneLength;
      const digitsOnly = payload.phone.replace(/\D/g, '');
      // Only validate length if phoneLength is defined and > 0
      if (expectedLength && expectedLength > 0 && digitsOnly.length > 0 && digitsOnly.length !== expectedLength) {
        nextErrors.phone = `Phone number must be exactly ${expectedLength} digits for ${selectedPhoneCodeOption.name}.`;
      }
    }
    if (!payload.gender) nextErrors.gender = 'Gender is required.';
    if (!dobDisplay.trim()) {
      nextErrors.dob = 'Date of birth is required.';
    } else {
      const iso = parseDdMmYyyyToIso(dobDisplay.trim());
      if (!iso) {
        nextErrors.dob = 'Enter a valid date as DD/MM/YYYY (e.g. 15/03/1998).';
      } else {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
        if (!m) {
          nextErrors.dob = 'Enter a valid date as DD/MM/YYYY.';
        } else {
          const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
          if (birth > maxDob) {
            nextErrors.dob = 'Candidate must be at least 18 years old.';
          }
        }
      }
    }
    if (!payload.city) nextErrors.city = 'City is required.';
    if (!payload.country) nextErrors.country = 'Country is required.';

    return nextErrors;
  };

  const isFormValid = useMemo(() => {
    const payload = buildPayload();
    return Object.keys(validate(payload)).length === 0;
  }, [
    firstNameValue,
    middleNameValue,
    lastNameValue,
    emailValue,
    phoneValue,
    phoneCode,
    genderValue,
    dobDisplay,
    countryValue,
    cityValue,
    employmentValue,
    passportNumberValue,
    maxDob,
  ]);

  useEffect(() => {
    if (!isPhoneCodeOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (phoneCodeRef.current && !phoneCodeRef.current.contains(event.target as Node)) {
        setIsPhoneCodeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPhoneCodeOpen]);

  const handleSave = async () => {
    const payload = buildPayload();
    const nextErrors = validate(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSave(payload);
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (citySuggestOpenRef.current) {
          event.preventDefault();
          setCitySuggestOpen(false);
          setCityHighlight(-1);
          return;
        }
        onClose();
      }
    };

    // Scroll Lock
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow || 'auto';
      document.documentElement.style.overflow = previousHtmlOverflow || 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999]">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          className="profile-modal-typography profile-modal-chrome fixed top-0 right-0 z-[10000] flex h-full w-full max-w-[520px] flex-col border-l border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] transform transition-all duration-300 ease-out translate-x-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
            <h2 className="profile-modal-title">
              {initialData ? 'Edit Basic Information' : 'Add Basic Information'}
            </h2>
            <button
              onClick={onClose}
              className="text-[#9095A1] hover:text-gray-600"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="profile-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-col">
              {/* Section 1 */}
              <section className="profile-modal-section">
                <h3 className="profile-modal-section-title">
                  Personal Details
                </h3>
                <div className="profile-modal-form-grid profile-modal-form-grid--split">
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">First Name *</label>
                    <input
                      type="text"
                      value={firstNameValue}
                      onChange={(e) => setFirstNameValue(e.target.value)}
                      className={profileFieldClass(!firstNameValue.trim() || Boolean(errors.firstName))}
                      placeholder="Enter first name"
                    />
                    {!firstNameValue.trim() && (
                      <p className="profile-modal-helper mt-1 text-amber-600">First name is required</p>
                    )}
                    {errors.firstName && <p className="profile-modal-helper text-red-600">{errors.firstName}</p>}
                  </div>
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Middle Name</label>
                    <input
                      type="text"
                      value={middleNameValue}
                      onChange={(e) => setMiddleNameValue(e.target.value)}
                      className={profileFieldClass()}
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="profile-modal-field-group profile-modal-form-grid__full">
                    <label className="profile-modal-label">Last Name</label>
                    <input
                      type="text"
                      value={lastNameValue}
                      onChange={(e) => setLastNameValue(e.target.value)}
                      className={profileFieldClass()}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="profile-modal-section">
                <h3 className="profile-modal-section-title">
                  Contact Information
                </h3>
                <div className="profile-modal-form-grid profile-modal-form-grid--split">
                  <div className="profile-modal-field-group profile-modal-form-grid__full">
                    <label className="profile-modal-label">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className={profileFieldClass(!emailValue.trim() || Boolean(errors.email))}
                        placeholder="Enter email address"
                      />
                    </div>
                    {!emailValue.trim() && (
                      <p className="profile-modal-helper mt-1 text-amber-600">Email address is required</p>
                    )}
                    {errors.email && <p className="profile-modal-helper text-red-600">{errors.email}</p>}
                  </div>
                  <div className="profile-modal-field-group profile-modal-form-grid__full">
                    <label className="profile-modal-label">Phone Number *</label>
                    <div className="profile-modal-phone-row">
                      <div className="relative min-w-0" ref={phoneCodeRef}>
                        <button
                          type="button"
                          onClick={() => setIsPhoneCodeOpen((prev) => !prev)}
                          className="profile-modal-phone-code-btn shadow-sm transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="shrink-0 text-sm leading-none">
                              {countryCodeToFlag(selectedPhoneCodeOption.code)}
                            </span>
                            <span className="truncate font-medium">{selectedPhoneCodeOption.dialCode}</span>
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400" aria-hidden>
                            ▼
                          </span>
                        </button>

                        {isPhoneCodeOpen && (
                          <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[290px] max-h-[280px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-2">
                            <div className="px-3 pb-2 sticky top-0 bg-white z-10">
                              <input
                                type="text"
                                value={phoneCodeSearch}
                                onChange={(e) => setPhoneCodeSearch(e.target.value)}
                                placeholder="Search country / code"
                                className={profileFieldClass()}
                              />
                            </div>
                            {filteredPhoneCodes.map((item) => (
                              <button
                                key={`${item.code}-${item.dialCode}`}
                                type="button"
                                onClick={() => {
                                  setPhoneCode(formatPhoneCodeLabel(item));
                                  setIsPhoneCodeOpen(false);
                                  setPhoneCodeSearch('');
                                  // Clear phone when country changes to prevent invalid length
                                  setPhoneValue('');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <span className="text-base">{countryCodeToFlag(item.code)}</span>
                                <span className="w-14 font-semibold">{item.dialCode}</span>
                                <span className="truncate text-slate-600">{item.name}</span>
                              </button>
                            ))}
                            {filteredPhoneCodes.length === 0 && (
                              <div className="profile-modal-helper px-3 py-2 text-slate-500">No country found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          const maxLength = selectedPhoneCodeOption.phoneLength;
                          setPhoneValue(digitsOnly.slice(0, maxLength));
                        }}
                        maxLength={selectedPhoneCodeOption.phoneLength}
                        className={profileFieldClass(!phoneValue.trim() || Boolean(errors.phone))}
                        placeholder={`${selectedPhoneCodeOption.phoneLength} digits`}
                      />
                    </div>
                    <div className="profile-modal-phone-meta">
                      {errors.phone ? (
                        <p className="profile-modal-helper text-red-600">{errors.phone}</p>
                      ) : (
                        <p className="profile-modal-helper text-slate-500">
                          {selectedPhoneCodeOption.name}: {selectedPhoneCodeOption.phoneLength} digits required
                        </p>
                      )}
                      <p className={`profile-modal-helper ${phoneValue.replace(/\D/g, '').length === selectedPhoneCodeOption.phoneLength ? 'text-green-600' : 'text-slate-500'}`}>
                        {phoneValue.replace(/\D/g, '').length}/{selectedPhoneCodeOption.phoneLength}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="profile-modal-section">
                <h3 className="profile-modal-section-title">
                  Basic Details
                </h3>
                <div className="profile-modal-form-grid profile-modal-form-grid--split">
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Gender *</label>
                    <select
                      value={genderValue}
                      onChange={(e) => setGenderValue(e.target.value)}
                      className={`${profileFieldClass(!genderValue || Boolean(errors.gender))} appearance-none`}
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="profile-modal-helper text-red-600">{errors.gender}</p>}
                  </div>
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Date of Birth *</label>
                    <div className="relative">
                      <div
                        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 cursor-pointer"
                        onClick={() => hiddenDobPickerRef.current?.showPicker?.()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            hiddenDobPickerRef.current?.showPicker?.();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Open date picker"
                      >
                        <Image
                          src="/calendar_icon.png"
                          alt="Open calendar"
                          width={16}
                          height={16}
                          className="h-4 w-4"
                        />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="bday"
                        placeholder="DD/MM/YYYY"
                        value={dobDisplay}
                        onChange={(e) => setDobDisplay(formatDobDigitsAsDdMmYyyy(e.target.value))}
                        className={`${profileFieldClass(!dobDisplay.trim() || Boolean(errors.dob))} !pl-10`}
                      />
                      <input
                        ref={hiddenDobPickerRef}
                        type="date"
                        className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
                        tabIndex={-1}
                        aria-hidden
                        max={maxDobIso}
                        value={parseDdMmYyyyToIso(dobDisplay.trim()) || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) setDobDisplay(isoToDdMmYyyy(v));
                        }}
                      />
                    </div>
                    {errors.dob && <p className="profile-modal-helper text-red-600">{errors.dob}</p>}
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="profile-modal-section">
                <h3 className="profile-modal-section-title">
                  Location
                </h3>
                <div className="profile-modal-form-grid profile-modal-form-grid--split">
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Current City *</label>
                    <div className="relative" ref={cityAutocompleteRef}>
                      <input
                        type="text"
                        value={cityValue}
                        autoComplete="off"
                        onChange={(e) => setCityValue(e.target.value)}
                        onFocus={() => {
                          if (citySuggestions.length > 0 || citySuggestLoading || citySuggestError) {
                            setCitySuggestOpen(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            if (!citySuggestOpen && citySuggestions.length > 0) {
                              setCitySuggestOpen(true);
                            }
                            if (citySuggestOpen && citySuggestions.length > 0) {
                              e.preventDefault();
                              setCityHighlight((i) => Math.min(i + 1, citySuggestions.length - 1));
                            }
                          } else if (e.key === 'ArrowUp') {
                            if (citySuggestOpen && citySuggestions.length > 0) {
                              e.preventDefault();
                              setCityHighlight((i) => Math.max(i - 1, 0));
                            }
                          } else if (e.key === 'Enter') {
                            if (citySuggestOpen && cityHighlight >= 0 && citySuggestions[cityHighlight]) {
                              e.preventDefault();
                              applyCitySuggestion(citySuggestions[cityHighlight]);
                            }
                          } else if (e.key === 'Escape' && citySuggestOpen) {
                            e.preventDefault();
                            e.stopPropagation();
                            setCitySuggestOpen(false);
                            setCityHighlight(-1);
                          }
                        }}
                        className={profileFieldClass(!cityValue.trim() || Boolean(errors.city))}
                        placeholder="Enter current city"
                      />
                      {citySuggestOpen ? (
                        <div className="absolute top-[calc(100%+6px)] left-0 z-50 max-h-[min(280px,50vh)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                          {citySuggestLoading ? (
                            <div className="profile-modal-helper px-3 py-2 text-slate-500">Searching…</div>
                          ) : citySuggestError ? (
                            <div className="profile-modal-helper px-3 py-2 text-red-600">{citySuggestError}</div>
                          ) : citySuggestions.length === 0 ? (
                            <div className="profile-modal-helper px-3 py-2 text-slate-500">No places found</div>
                          ) : (
                            citySuggestions.map((place, idx) => (
                              <button
                                key={`${place.display_name}-${idx}`}
                                type="button"
                                data-city-suggest-index={idx}
                                onMouseEnter={() => setCityHighlight(idx)}
                                onMouseDown={(ev) => {
                                  ev.preventDefault();
                                  applyCitySuggestion(place);
                                }}
                                className={`w-full px-3 py-2 text-left text-gray-900 hover:bg-gray-50 ${cityHighlight === idx ? 'bg-gray-50' : ''}`}
                              >
                                {formatPlaceSuggestionLine(place)}
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                    {errors.city && <p className="profile-modal-helper text-red-600">{errors.city}</p>}
                  </div>
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Current Country *</label>
                    <select
                      value={countryValue}
                      onChange={(e) => setCountryValue(e.target.value)}
                      className={`${profileFieldClass(!countryValue || Boolean(errors.country))} appearance-none`}
                    >
                      <option value="">Select Country</option>
                      {ALL_COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="profile-modal-helper text-red-600">{errors.country}</p>}
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="profile-modal-section">
                <h3 className="profile-modal-section-title">
                  Professional Status
                </h3>
                <div className="profile-modal-form-grid profile-modal-form-grid--split">
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Employment Status</label>
                    <select
                      value={employmentValue}
                      onChange={(e) => setEmploymentValue(e.target.value)}
                      className={`${profileFieldClass()} appearance-none`}
                    >
                      <option value="">Select Status</option>
                      <option>Employed</option>
                      <option>Unemployed</option>
                      <option>Self-Employed</option>
                      <option>Student</option>
                    </select>
                  </div>
                  <div className="profile-modal-field-group">
                    <label className="profile-modal-label">Passport Number</label>
                    <input
                      type="text"
                      value={passportNumberValue}
                      onChange={(e) => setPassportNumberValue(e.target.value)}
                      className={profileFieldClass()}
                      placeholder="Enter passport number"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className={profileCancelBtnClass}>
                Cancel
              </button>
              <button type="button" onClick={handleSave} className={profileSaveBtnClass}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
