'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';

interface VaccinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VaccinationData) => void;
  initialData?: VaccinationData;
}

export interface VaccinationData {
  vaccineType?: string;
  lastVaccinationDate?: string;
  validityMonth?: string;
  validityYear?: string;
  certificate?: File | string;
}

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
};

export default function VaccinationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: VaccinationModalProps) {
  const [vaccineType, setVaccineType] = useState(initialData?.vaccineType || '');
  const [lastVaccinationDate, setLastVaccinationDate] = useState(initialData?.lastVaccinationDate || '');
  const [validityMonth, setValidityMonth] = useState(initialData?.validityMonth || '');
  const [validityYear, setValidityYear] = useState(initialData?.validityYear || '');
  const [certificate, setCertificate] = useState<File | string | null>(initialData?.certificate || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setVaccineType(initialData.vaccineType || '');
      setLastVaccinationDate(initialData.lastVaccinationDate || '');
      setValidityMonth(initialData.validityMonth || '');
      setValidityYear(initialData.validityYear || '');
      setCertificate(initialData.certificate || null);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setVaccineType('');
    setLastVaccinationDate('');
    setValidityMonth('');
    setValidityYear('');
    setCertificate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      // Check file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, PNG, or JPG file');
        return;
      }
      setCertificate(file);
    }
  };

  const handleRemoveFile = () => {
    setCertificate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormComplete = Boolean(
    vaccineType.trim() &&
    lastVaccinationDate &&
    validityMonth &&
    validityYear
  );

  const handleSave = () => {
    onSave({
      vaccineType: vaccineType.trim() || undefined,
      lastVaccinationDate: lastVaccinationDate || undefined,
      validityMonth: validityMonth || undefined,
      validityYear: validityYear || undefined,
      certificate: certificate || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Vaccination Details"
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {isFormComplete && (
            <button
              onClick={handleSave}
              className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Save & Update
            </button>
          )}
        </div>
      )}
    >
            <p className="text-sm text-gray-600 mb-6">
              Provide your vaccination status if required for specific job roles or workplace policies.
            </p>

            <div className="space-y-6">
              {/* Vaccine Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaccine Type
                </label>
                <input
                  type="text"
                  value={vaccineType}
                  onChange={(e) => setVaccineType(e.target.value)}
                  placeholder="eg. Yellow Fever"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Last Vaccination Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Vaccination Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={lastVaccinationDate}
                    onChange={(e) => setLastVaccinationDate(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9095A1] pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Optional. The date of your last vaccination.
                </p>
              </div>

              {/* Validity of Vaccination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validity of Vaccination
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Month</label>
                    <select
                      value={validityMonth}
                      onChange={(e) => setValidityMonth(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-gray-900"
                    >
                      <option value="">Select Month</option>
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Year</label>
                    <select
                      value={validityYear}
                      onChange={(e) => setValidityYear(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white text-gray-900"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 20 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Optional. The validity period of your vaccination.
                </p>
              </div>

              {/* Vaccination Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaccination Certificate
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {!certificate ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <svg
                      className="w-6 h-6 text-[#9095A1]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {certificate instanceof File ? certificate.name : certificate}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-[#9095A1] hover:text-red-600"
                      title="Remove file"
                    >
                      <svg
                        width="18"
                        height="18"
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
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional. Upload only if required by the employer.
                </p>
              </div>

              {/* Disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  Vaccination details may be shared with employers only if required for workplace compliance.
                </p>
              </div>
            </div>

    </ProfileDrawer>
  );
}
