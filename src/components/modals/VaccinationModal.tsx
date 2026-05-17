'use client';

import { useState, useEffect } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import { ProfileDocumentsUpload } from '../profile/ProfileDocumentsUpload';
import {
  normalizeProfileDocuments,
  type ProfileDocumentItem,
} from '@/lib/profile-documents';

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
  documents?: ProfileDocumentItem[];
  certificate?: File | string;
}

function initialDocumentsFromData(data?: VaccinationData): ProfileDocumentItem[] {
  if (data?.documents?.length) return normalizeProfileDocuments(data.documents);
  if (data?.certificate) return normalizeProfileDocuments([data.certificate]);
  if (Array.isArray((data as { documents?: string[] })?.documents)) {
    return normalizeProfileDocuments((data as { documents?: string[] }).documents);
  }
  return [];
}

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
  const [documents, setDocuments] = useState<ProfileDocumentItem[]>(() =>
    initialDocumentsFromData(initialData),
  );

  useEffect(() => {
    if (initialData) {
      setVaccineType(initialData.vaccineType || '');
      setLastVaccinationDate(initialData.lastVaccinationDate || '');
      setValidityMonth(initialData.validityMonth || '');
      setValidityYear(initialData.validityYear || '');
      setDocuments(initialDocumentsFromData(initialData));
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setVaccineType('');
    setLastVaccinationDate('');
    setValidityMonth('');
    setValidityYear('');
    setDocuments([]);
  };

  const handleSave = () => {
    onSave({
      vaccineType: vaccineType.trim() || undefined,
      lastVaccinationDate: lastVaccinationDate || undefined,
      validityMonth: validityMonth || undefined,
      validityYear: validityYear || undefined,
      documents: documents.length > 0 ? documents : undefined,
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
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!vaccineType.trim()}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save & Update
          </button>
        </div>
      )}
    >
      <p className="mb-6 text-sm text-gray-600">
        Provide your vaccination status if required for specific job roles or workplace policies.
      </p>

      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Vaccine Type</label>
          <input
            type="text"
            value={vaccineType}
            onChange={(e) => setVaccineType(e.target.value)}
            placeholder="eg. Yellow Fever"
            className={`w-full rounded-lg border px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 ${
              !vaccineType.trim() ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'
            }`}
          />
          {!vaccineType.trim() ? (
            <p className="mt-1 text-xs text-amber-600">Vaccine type is required</p>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Last Vaccination Date <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </label>
          <ProfileDatePicker
            value={lastVaccinationDate}
            onChange={setLastVaccinationDate}
          />
          <p className="mt-1 text-xs text-gray-500">The date of your last vaccination.</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Validity of Vaccination <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Month</label>
              <select
                value={validityMonth}
                onChange={(e) => setValidityMonth(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
              <label className="mb-1 block text-xs text-gray-600">Year</label>
              <select
                value={validityYear}
                onChange={(e) => setValidityYear(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                {Array.from({ length: 20 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">When your vaccination is valid through (month and year).</p>
        </div>

        <ProfileDocumentsUpload
          label="Vaccination Certificates / Documents"
          documents={documents}
          onChange={setDocuments}
          helperText="Optional. Upload one or more certificates if required by the employer."
        />

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs text-gray-600">
            Vaccination details may be shared with employers only if required for workplace compliance.
          </p>
        </div>
      </div>
    </ProfileDrawer>
  );
}
