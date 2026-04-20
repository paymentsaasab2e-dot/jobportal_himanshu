'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  ALL_COUNTRY_CODES,
  countryCodeToFlag,
  formatPhoneCodeLabel,
} from '@/lib/country-codes';

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
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
  const [phoneCode, setPhoneCode] = useState(initialData?.phoneCode || '+237 (Cameroon)');
  const [isPhoneCodeOpen, setIsPhoneCodeOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState('');
  const [genderValue, setGenderValue] = useState(initialData?.gender || '');
  const [dobValue, setDobValue] = useState(initialData?.dob || '');
  const [countryValue, setCountryValue] = useState(initialData?.country || '');
  const [cityValue, setCityValue] = useState(initialData?.city || '');
  const [employmentValue, setEmploymentValue] = useState(initialData?.employment || '');
  const [passportNumberValue, setPassportNumberValue] = useState(initialData?.passportNumber || '');
  const [errors, setErrors] = useState<Partial<Record<BasicInfoFieldKey, string>>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);
  const phoneCodeRef = useRef<HTMLDivElement>(null);
  const maxDobInputValue = useMemo(() => formatDateForInput(getMaxDobDate()), []);

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
      setPhoneCode(initialData.phoneCode || '+237 (Cameroon)');
      setGenderValue(initialData.gender || '');
      setDobValue(initialData.dob || '');
      setCountryValue(initialData.country || '');
      setCityValue(initialData.city || '');
      setEmploymentValue(initialData.employment || '');
      setPassportNumberValue(initialData.passportNumber || '');
    } else {
      // Clear all fields for "Add" mode
      setFirstNameValue('');
      setMiddleNameValue('');
      setLastNameValue('');
      setEmailValue('');
      setPhoneValue('');
      setPhoneCode('+237 (Cameroon)');
      setGenderValue('');
      setDobValue('');
      setCountryValue('');
      setCityValue('');
      setEmploymentValue('');
      setPassportNumberValue('');
    }
  }, [initialData, isOpen]);

  const getTrimmed = (value: string) => value.trim();

  const buildPayload = (): BasicInfoData => ({
    firstName: getTrimmed(firstNameValue),
    middleName: getTrimmed(middleNameValue),
    lastName: getTrimmed(lastNameValue),
    email: getTrimmed(emailValue),
    phone: getTrimmed(phoneValue),
    phoneCode: getTrimmed(phoneCode),
    gender: getTrimmed(genderValue),
    dob: dobValue,
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
      if (digitsOnly.length !== expectedLength) {
        nextErrors.phone = `Phone number must be exactly ${expectedLength} digits for ${selectedPhoneCodeOption.name}.`;
      }
    }
    if (!payload.gender) nextErrors.gender = 'Gender is required.';
    if (!payload.dob) {
      nextErrors.dob = 'Date of birth is required.';
    } else if (payload.dob > maxDobInputValue) {
      nextErrors.dob = 'Candidate must be at least 18 years old.';
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
    dobValue,
    countryValue,
    cityValue,
    employmentValue,
    passportNumberValue,
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
      if (event.key === 'Escape') onClose();
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
          className="modal-placeholder-black fixed top-0 right-0 z-[10000] flex h-full w-full max-w-[520px] flex-col border-l border-gray-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] transform transition-all duration-300 ease-out translate-x-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
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
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              {/* Section 1 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">First Name *</label>
                    <input
                      type="text"
                      value={firstNameValue}
                      onChange={(e) => setFirstNameValue(e.target.value)}
                      className={`h-11 w-full rounded-lg px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none ${errors.firstName ? 'border-red-400' : 'border-gray-200'}`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Middle Name</label>
                    <input
                      type="text"
                      value={middleNameValue}
                      onChange={(e) => setMiddleNameValue(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500">Last Name</label>
                    <input
                      type="text"
                      value={lastNameValue}
                      onChange={(e) => setLastNameValue(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className={`h-11 w-full rounded-lg px-3 pr-24 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder="Enter email address"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500">Phone Number *</label>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      <div className="relative" ref={phoneCodeRef}>
                        <button
                          type="button"
                          onClick={() => setIsPhoneCodeOpen((prev) => !prev)}
                          className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-left text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{countryCodeToFlag(selectedPhoneCodeOption.code)}</span>
                            <span className="truncate text-sm">{selectedPhoneCodeOption.dialCode}</span>
                          </span>
                          <span className="text-xs text-gray-400">▼</span>
                        </button>

                        {isPhoneCodeOpen && (
                          <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[290px] max-h-[280px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-2">
                            <div className="px-3 pb-2 sticky top-0 bg-white z-10">
                              <input
                                type="text"
                                value={phoneCodeSearch}
                                onChange={(e) => setPhoneCodeSearch(e.target.value)}
                                placeholder="Search country / code"
                                className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
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
                                <span className="font-semibold text-sm w-14">{item.dialCode}</span>
                                <span className="text-sm text-gray-600 truncate">{item.name}</span>
                              </button>
                            ))}
                            {filteredPhoneCodes.length === 0 && (
                              <div className="px-3 py-2 text-sm text-gray-500">No country found</div>
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
                        className={`h-11 w-full rounded-lg px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
                        placeholder={`${selectedPhoneCodeOption.phoneLength} digits`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      {errors.phone ? (
                        <p className="text-xs text-red-600">{errors.phone}</p>
                      ) : (
                        <p className="text-xs text-gray-400">
                          {selectedPhoneCodeOption.name}: {selectedPhoneCodeOption.phoneLength} digits required
                        </p>
                      )}
                      <p className={`text-xs ${phoneValue.replace(/\D/g, '').length === selectedPhoneCodeOption.phoneLength ? 'text-green-500' : 'text-gray-400'}`}>
                        {phoneValue.replace(/\D/g, '').length}/{selectedPhoneCodeOption.phoneLength}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Gender *</label>
                    <select
                      value={genderValue}
                      onChange={(e) => setGenderValue(e.target.value)}
                      className={`h-11 w-full rounded-lg bg-white px-3 text-black font-medium shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${errors.gender ? 'border-red-400' : 'border-gray-200'}`}
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Date of Birth *</label>
                    <div className="relative">
                      <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 cursor-pointer"
                        onClick={() => dateInputRef.current?.showPicker()}
                      >
                        <Image
                          src="/calendar_icon.png"
                          alt="Calendar"
                          width={16}
                          height={16}
                          className="h-4 w-4"
                        />
                      </div>
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={dobValue}
                        max={maxDobInputValue}
                        onChange={(e) => setDobValue(e.target.value)}
                        onClick={() => dateInputRef.current?.showPicker()}
                        className={`h-11 w-full rounded-lg px-3 pl-10 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full ${errors.dob ? 'border-red-400' : 'border-gray-200'}`}
                      />
                    </div>
                    {errors.dob && <p className="text-xs text-red-600">{errors.dob}</p>}
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Location
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Current City *</label>
                    <input
                      type="text"
                      value={cityValue}
                      onChange={(e) => setCityValue(e.target.value)}
                      className={`h-11 w-full rounded-lg bg-white px-3 text-black font-medium shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none ${errors.city ? 'border-red-400' : 'border-gray-200'}`}
                      placeholder="Enter current city"
                    />
                    {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Current Country *</label>
                    <select
                      value={countryValue}
                      onChange={(e) => setCountryValue(e.target.value)}
                      className={`h-11 w-full rounded-lg bg-white px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none appearance-none ${errors.country ? 'border-red-400' : 'border-gray-200'}`}
                    >
                      <option value="">Select Country</option>
                      {ALL_COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-xs text-red-600">{errors.country}</p>}
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-4 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Professional Status
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Employment Status</label>
                    <select
                      value={employmentValue}
                      onChange={(e) => setEmploymentValue(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-black font-medium shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    >
                      <option value="">Select Status</option>
                      <option>Employed</option>
                      <option>Unemployed</option>
                      <option>Self-Employed</option>
                      <option>Student</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Passport Number</label>
                    <input
                      type="text"
                      value={passportNumberValue}
                      onChange={(e) => setPassportNumberValue(e.target.value)}
                      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-gray-900 shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter passport number"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
