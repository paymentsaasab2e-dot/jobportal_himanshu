'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, Trash2, X } from 'lucide-react';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  displayName: string;
  initials: string;
  isUploading?: boolean;
  isDeleting?: boolean;
  onUploadPhoto: (file: File) => void;
  onDeletePhoto: () => void | Promise<void>;
}

function ModalAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof Camera;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-w-[72px] flex-col items-center gap-2 rounded-xl px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        danger
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-slate-600 hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]'
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
          danger
            ? 'border-rose-100 bg-rose-50 group-hover:border-rose-200'
            : 'border-slate-200 bg-slate-50 group-hover:border-[rgba(40,168,225,0.35)] group-hover:bg-[var(--brand-primary-soft)]'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="text-[12px] font-semibold tracking-tight">{label}</span>
    </button>
  );
}

export default function ProfilePhotoModal({
  isOpen,
  onClose,
  imageUrl,
  displayName,
  initials,
  isUploading = false,
  isDeleting = false,
  onUploadPhoto,
  onDeletePhoto,
}: ProfilePhotoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = isUploading || isDeleting;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isBusy, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleUpdateClick = () => {
    if (isBusy) return;
    fileInputRef.current?.click();
  };

  const handleDeleteClick = async () => {
    if (isBusy || !imageUrl) return;
    const confirmed = window.confirm(
      'Remove your profile photo? Recruiters will see your initials instead.'
    );
    if (confirmed) await onDeletePhoto();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-photo-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        onClick={() => {
          if (!isBusy) onClose();
        }}
        aria-label="Close profile photo modal"
      />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2
            id="profile-photo-modal-title"
            className="text-[17px] font-semibold tracking-tight text-slate-950"
          >
            Profile photo
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2.1} />
          </button>
        </div>

        <div className="flex flex-col items-center bg-[linear-gradient(180deg,#f8fcff_0%,#ffffff_100%)] px-6 pb-6 pt-8">
          <div className="relative h-[220px] w-[220px] shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_40%),linear-gradient(145deg,rgba(40,168,225,0.12),rgba(40,168,223,0.18))] shadow-[0_20px_40px_rgba(40,168,225,0.14),inset_0_1px_0_rgba(255,255,255,0.9)] ring-4 ring-white">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
                sizes="220px"
                priority
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[56px] font-semibold uppercase tracking-[-0.04em] text-slate-500">
                {initials}
              </span>
            )}

            {isBusy ? (
              <span className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[2px]">
                <Loader2 className="h-9 w-9 animate-spin text-[var(--brand-primary)]" />
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-center text-[15px] font-semibold text-slate-900">{displayName}</p>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
          <ModalAction
            icon={Camera}
            label="Update"
            onClick={handleUpdateClick}
            disabled={isBusy}
          />

          {imageUrl ? (
            <ModalAction
              icon={Trash2}
              label="Delete"
              onClick={handleDeleteClick}
              disabled={isBusy}
              danger
            />
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadPhoto(file);
            event.target.value = '';
          }}
        />
      </div>
    </div>,
    document.body
  );
}
