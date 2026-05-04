'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Edit3, Eye, Search, Trash2 } from 'lucide-react';
import { Sidenav } from '@/components/layout/Sidenav';
import CompanyIdentityBadge from '@/components/common/CompanyIdentityBadge';

type ClientRecord = {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  industry: string;
  contactPerson: string;
  email: string;
  status: 'Active' | 'Pending' | 'Inactive';
  createdAt: string;
};

const CLIENTS: ClientRecord[] = [
  {
    id: 'cl-1001',
    companyName: 'VertexCare Networks',
    logoUrl: '/ai2yantra.png',
    industry: 'Healthcare',
    contactPerson: 'Devesh Mishra',
    email: 'info@vertexcare.com',
    status: 'Active',
    createdAt: '2026-02-20',
  },
  {
    id: 'cl-1002',
    companyName: 'NovaEdge Systems',
    logoUrl: '/fs.png',
    industry: 'SaaS',
    contactPerson: 'Ananya Rao',
    email: 'hello@novaedge.com',
    status: 'Pending',
    createdAt: '2026-02-18',
  },
  {
    id: 'cl-1003',
    companyName: 'BluePeak Solutions',
    logoUrl: null,
    industry: 'Recruitment',
    contactPerson: 'Rohit Sharma',
    email: 'team@bluepeak.com',
    status: 'Active',
    createdAt: '2026-02-14',
  },
  {
    id: 'cl-1004',
    companyName: 'OrbitHR Global',
    logoUrl: '/SAASA Logo.png',
    industry: 'HR Tech',
    contactPerson: 'Priya Nair',
    email: 'contact@orbithr.com',
    status: 'Inactive',
    createdAt: '2026-02-02',
  },
];

function StatusPill({ status }: { status: ClientRecord['status'] }) {
  const tone =
    status === 'Active'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
      : status === 'Pending'
        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

export default function ClientPage() {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CLIENTS;

    return CLIENTS.filter((client) =>
      [client.companyName, client.industry, client.contactPerson, client.email, client.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  const allSelected = filteredClients.length > 0 && filteredClients.every((client) => selectedIds.includes(client.id));

  const toggleAll = () => {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !filteredClients.some((client) => client.id === id))
        : Array.from(new Set([...current, ...filteredClients.map((client) => client.id)]))
    );
  };

  const toggleOne = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <Sidenav>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(40,168,225,0.14),_transparent_24%),radial-gradient(circle_at_85%_12%,_rgba(252,150,32,0.08),_transparent_18%),linear-gradient(180deg,_#f7fbff_0%,_#fefefe_56%,_#f8fbff_100%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Client Management</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Clients</h1>
                <p className="mt-1 text-sm text-slate-500">
                  View client companies, their logos, and fallback initials in one clean table.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total Clients</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{CLIENTS.length}</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-500">Selected</p>
                  <p className="mt-1 text-2xl font-black text-sky-700">{selectedIds.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/82 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search clients, contacts, or industries"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
              >
                <span>Add Client</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50/90 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="w-14 border-b border-slate-200 px-5 py-4">
                      <input
                        type="checkbox"
                        aria-label="Select all clients"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </th>
                    <th className="border-b border-slate-200 px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        Client Name
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </span>
                    </th>
                    <th className="border-b border-slate-200 px-5 py-4">Industry</th>
                    <th className="border-b border-slate-200 px-5 py-4">Contact</th>
                    <th className="border-b border-slate-200 px-5 py-4">Created</th>
                    <th className="border-b border-slate-200 px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="group bg-white transition hover:bg-slate-50/80">
                      <td className="border-b border-slate-100 px-5 py-4 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Select ${client.companyName}`}
                          checked={selectedIds.includes(client.id)}
                          onChange={() => toggleOne(client.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 align-middle">
                        <div className="flex items-center gap-4">
                          <CompanyIdentityBadge
                            name={client.contactPerson || client.companyName}
                            logoUrl={client.logoUrl}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-slate-950">{client.companyName}</p>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{client.email}</p>
                            <div className="mt-2">
                              <StatusPill status={client.status} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 align-middle text-sm text-slate-600">
                        {client.industry}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 align-middle text-sm text-slate-600">
                        {client.contactPerson}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 align-middle text-sm text-slate-500">
                        {new Date(client.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="border-b border-slate-100 px-5 py-4 align-middle">
                        <div className="flex items-center justify-end gap-2 opacity-90 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-sky-200 hover:text-sky-600"
                            aria-label={`View ${client.companyName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                            aria-label={`Edit ${client.companyName}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                            aria-label={`Delete ${client.companyName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Sidenav>
  );
}
