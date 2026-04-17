export type MyServiceStatus =
  | 'Not Started'
  | 'Requested'
  | 'In Review'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface MyServiceItem {
  id: string;
  serviceSlug: string;
  serviceName: string;
  requestDate: string;
  status: MyServiceStatus;
  nextStep: string;
  action: string;
}

export const MY_SERVICES_MOCK: MyServiceItem[] = [
  {
    id: 'ms-1',
    serviceSlug: 'ai-resume-review',
    serviceName: 'AI Resume Review',
    requestDate: '2026-03-20',
    status: 'Completed',
    nextStep: 'View your detailed analysis report',
    action: 'View Summary',
  },
  {
    id: 'ms-2',
    serviceSlug: 'mock-interview',
    serviceName: 'Mock Interview Service',
    requestDate: '2026-03-22',
    status: 'Scheduled',
    nextStep: 'Session on Mar 28, 2026 at 3:00 PM',
    action: 'Reschedule',
  },
  {
    id: 'ms-3',
    serviceSlug: 'resume-writing-upgrade',
    serviceName: 'Resume Writing & Upgrade',
    requestDate: '2026-03-23',
    status: 'In Progress',
    nextStep: 'Expert is currently reviewing your resume',
    action: 'View Request',
  },
  {
    id: 'ms-4',
    serviceSlug: 'skill-assessment',
    serviceName: 'Skill Assessment Service',
    requestDate: '2026-03-24',
    status: 'Requested',
    nextStep: 'Awaiting assessment assignment',
    action: 'View Request',
  },
  {
    id: 'ms-5',
    serviceSlug: 'linkedin-profile-optimization',
    serviceName: 'LinkedIn Profile Optimization',
    requestDate: '2026-03-18',
    status: 'Completed',
    nextStep: 'Review the recommendations and update your profile',
    action: 'View Summary',
  },
  {
    id: 'ms-6',
    serviceSlug: 'job-specific-cv-optimization',
    serviceName: 'Job-Specific CV Optimization',
    requestDate: '2026-03-24',
    status: 'Not Started',
    nextStep: 'Complete the request form to get started',
    action: 'Continue',
  },
  {
    id: 'ms-7',
    serviceSlug: 'upskilling-certification',
    serviceName: 'Upskilling & Certification Services',
    requestDate: '2026-03-15',
    status: 'Cancelled',
    nextStep: 'You can re-request this service anytime',
    action: 'View Request',
  },
];
