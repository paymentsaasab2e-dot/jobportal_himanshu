import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';
import { SVC_PRIMARY_BTN } from '../constants';

export default function ServiceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 mb-6">
        <SearchX className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
        Service Not Found
      </h1>
      <p className="text-base text-gray-500 font-normal mb-8 max-w-sm">
        We couldn't find the service you're looking for. It may have been moved or removed.
      </p>
      
      <Link href="/services" className={SVC_PRIMARY_BTN}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all services
      </Link>
    </div>
  );
}
