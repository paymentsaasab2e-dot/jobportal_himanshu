'use client';

import { useLmsState } from '../../state/LmsStateProvider';
import { useLmsOverlay } from '../../components/overlays/LmsOverlayProvider';
import { useLmsToast } from '../../components/ux/LmsToastProvider';
import { EventRegisterSheet } from '../EventRegisterSheet';
import { registerForEvent, unregisterFromEvent } from '../../api/client';

export function EventDetailClient({
  eventId,
  title,
  status,
  isRegistered,
  onRegistrationChange,
}: {
  eventId: string;
  title: string;
  status: 'upcoming' | 'past';
  isRegistered: boolean;
  onRegistrationChange?: (registered: boolean) => void;
}) {
  const { registerEvent, unregisterEvent, addPlannedItem, state } = useLmsState();
  const overlay = useLmsOverlay();
  const toast = useLmsToast();

  const isPlanned = state.plannedItems.some((p) => p.id === `evt-${eventId}`);

  const handleRegisterClick = () => {
    overlay.openSheet({
      title: isRegistered ? 'Cancel Registration' : 'Register for Event',
      description: isRegistered ? 'You are about to cancel your spot.' : 'Save your seat for this event.',
      content: <EventRegisterSheet title={title} isRegistered={isRegistered} />,
      footer: (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#208bc0] active:scale-[0.98]"
            onClick={async () => {
              try {
                if (isRegistered) {
                  await unregisterFromEvent(eventId);
                  unregisterEvent(eventId);
                  onRegistrationChange?.(false);
                  toast.push({ title: 'Registration Cancelled', message: `${title}`, tone: 'success' });
                } else {
                  await registerForEvent(eventId);
                  registerEvent(eventId);
                  onRegistrationChange?.(true);
                  toast.push({ title: 'Registered', message: `${title}`, tone: 'success' });
                }
                overlay.close();
              } catch {
                toast.push({
                  title: 'Error',
                  message: 'Failed to update registration',
                  tone: 'destructive',
                });
              }
            }}
          >
            {isRegistered ? 'Unregister' : 'Confirm'}
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            onClick={overlay.close}
          >
            Go back
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  const handlePlanClick = () => {
    addPlannedItem({
      id: `evt-${eventId}`,
      type: 'event',
      label: title,
      href: `/lms/events/${eventId}`,
      sourceModule: 'events',
      sourceLabel: 'LMS Events',
    });
    toast.push({ title: 'Added to plan', message: 'Event marked in Career Path plan.', tone: 'success' });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={status === 'past'}
        onClick={handleRegisterClick}
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${status === 'past' ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200' : isRegistered ? 'bg-emerald-50 text-emerald-800 border-emerald-200 border hover:bg-emerald-100' : 'bg-[#28A8E1] text-white hover:bg-[#208bc0]'}`}
      >
        {status === 'past' ? 'Event Ended' : isRegistered ? 'Manage Registration (Registered)' : 'Register Now'}
      </button>

      <button
        type="button"
        onClick={handlePlanClick}
        disabled={isPlanned}
        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${isPlanned ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'}`}
      >
        {isPlanned ? 'Added to Career Plan' : 'Add to Career Plan'}
      </button>
    </div>
  );
}
