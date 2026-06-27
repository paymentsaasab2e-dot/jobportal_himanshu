'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { InterviewApplicationFormBody } from '@/modules/interview-prep/components/InterviewApplicationFormBody';
import { useEffect, useState } from 'react';
import { fetchInterviewFormPage } from '@/lib/phase2-interview-forms-api';

export default function InterviewFormApplyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = typeof params?.token === 'string' ? params.token : '';
  const tenantDbName =
    searchParams.get('tenantDbName')?.trim() || searchParams.get('tenant')?.trim() || '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!token) return;
    void fetchInterviewFormPage(token, tenantDbName || undefined)
      .then((data) => {
        setTitle(data.form.title);
        setDescription(data.form.description || '');
      })
      .catch(() => {});
  }, [tenantDbName, token]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/lms/interview-prep"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#28A8E1] hover:underline"
      >
        <ArrowLeft size={14} />
        Interview prep
      </Link>

      {title ? (
        <header className="mt-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
        </header>
      ) : null}

      <div className="mt-8">
        <InterviewApplicationFormBody token={token} tenantDbName={tenantDbName || undefined} />
      </div>
    </div>
  );
}
