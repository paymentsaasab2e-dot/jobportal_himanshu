'use client';

export function EventRegisterSheet({ title, isRegistered }: { title: string; isRegistered: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {isRegistered ? (
        <p className="text-sm font-normal text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
          Unregistering will remove this event from your local state immediately. You can re-register anytime.
        </p>
      ) : (
        <p className="text-sm font-normal text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
          Confirming will store a "registered" badge locally so you can test the flow without backend wiring.
        </p>
      )}
    </div>
  );
}
