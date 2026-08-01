import type { ReactNode } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  CircleHelp,
  Coins,
  Compass,
  FileText,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';

export type FaqItem = {
  id: string;
  q: string;
  a: string;
};

export type FaqCategory = {
  id: string;
  category: string;
  audience: 'candidate' | 'employer' | 'both';
  iconName:
    | 'user'
    | 'brief'
    | 'brain'
    | 'shield'
    | 'users'
    | 'message'
    | 'coins'
    | 'grad'
    | 'building'
    | 'file'
    | 'help';
  questions: FaqItem[];
};

/** Product FAQs for employees (candidates) and employers — matches current HRYantra setup. */
export const HELP_FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    category: 'Getting started',
    audience: 'candidate',
    iconName: 'user',
    questions: [
      {
        id: 'verify',
        q: 'How do I create and verify my account?',
        a: 'Open Sign in / Create account (WhatsApp auth). Enter your WhatsApp number and email, solve the quick check, then enter the OTP sent to your email. After verify, set a password so you can sign in next time with email or phone + password.',
      },
      {
        id: 'profile-complete',
        q: 'Why should I complete my profile?',
        a: 'Complete Profile sections (basic info, education, skills, experience, resume). Higher completeness improves job match, CV score, and suggestions. Missing sections also show as nudges so you know what to finish first.',
      },
      {
        id: 'duplicate-data',
        q: 'Why does the app say my email or mobile is already used?',
        a: 'Email and mobile must be unique across accounts. If you already signed up, use Sign in instead of Create account. Inside Profile → Basic info, you cannot save an email/phone that belongs to another user. Skills, education, and experience only block duplicates inside your own profile.',
      },
    ],
  },
  {
    id: 'explore-jobs',
    category: 'Explore jobs & applications',
    audience: 'candidate',
    iconName: 'brief',
    questions: [
      {
        id: 'find-jobs',
        q: 'Where do I find jobs?',
        a: 'Go to Explore Jobs. Browse cards, open a job for details and match signals, then apply. Personalized lists appear when your profile has enough skills and preferences.',
      },
      {
        id: 'apply-track',
        q: 'How do I apply and track status?',
        a: 'Open a job and submit an application from your profile/CV. Track status on your dashboard / applications area (Submitted, Under review, Interview, Rejected, Offer). Rejections can trigger helpful suggestions in HRYantra chat.',
      },
      {
        id: 'few-matches',
        q: 'I only see a few matching jobs. What should I do?',
        a: 'Finish missing profile sections, add skills that match your target role, and use the AI CV editor so your CV lines up with job descriptions. Then refresh Explore Jobs. You can still open jobs that are a partial match and tailor your CV before applying.',
      },
    ],
  },
  {
    id: 'cv-lms',
    category: 'AI CV, LMS & interview prep',
    audience: 'candidate',
    iconName: 'grad',
    questions: [
      {
        id: 'ai-cv',
        q: 'How do I improve my CV with AI?',
        a: 'Open LMS → Resume builder / AI CV editor. Update summary, skills, and bullets so they match the job you want. If you get rejections but your CV score looks fine, use the editor to make skills and experience clearly match that job’s wording.',
      },
      {
        id: 'lms-events',
        q: 'What are LMS courses, quizzes, and events?',
        a: 'LMS has courses, quizzes, career path, and events. Office Gossips → Events shows a shortlist matched to your skills and activity; the full catalog stays under LMS → Events.',
      },
      {
        id: 'interview-prep',
        q: 'How does Interview Prep work?',
        a: 'Open LMS → Interview prep. Be Interviewed is free to request; after a match you pay the interviewer’s token fee. Become Interviewer unlocks once with tokens, then you set your own fee. Use rooms for chat/slots, and AI mock interview when you want practice alone.',
      },
    ],
  },
  {
    id: 'tokens',
    category: 'Tokens & paid unlocks',
    audience: 'both',
    iconName: 'coins',
    questions: [
      {
        id: 'what-tokens',
        q: 'What are tokens used for?',
        a: 'Tokens unlock premium actions such as interviewer access, some LMS services, and paid reference-check fees. Unlock once where noted, or pay a per-session fee set by another user (for example an interviewer).',
      },
      {
        id: 'buy-tokens',
        q: 'Where do I get more tokens?',
        a: 'Open Subscriptions / token packages from the app. Earn tasks may also appear as suggestions. If a paid action fails, you will see an insufficient-tokens message—top up and try again.',
      },
    ],
  },
  {
    id: 'office-gossips',
    category: 'Office Gossips',
    audience: 'candidate',
    iconName: 'users',
    questions: [
      {
        id: 'what-og',
        q: 'What is Office Gossips?',
        a: 'Office Gossips is your community space: feed, circles (communities), chat (including HRYantra Verified), and events. You can post in circles you joined, message people, and follow company pages.',
      },
      {
        id: 'anonymous',
        q: 'How does anonymity work?',
        a: 'On first visit you create a gossip identity and can choose to stay anonymous. That preference is saved in your browser. You can change related settings later. Reference checks can also use anonymous options per request.',
      },
      {
        id: 'hryantra-chat',
        q: 'What is the floating HRYantra chat button?',
        a: 'When HRYantra sends tips or suggestions, the floating button shows a red unread count and a toast. Click it to open Office Gossips → Chat → HRYantra Verified.',
      },
      {
        id: 'og-events',
        q: 'Why do Events only show some items?',
        a: 'Events for you are shortlisted from LMS Events using your profile skills, target roles, and behaviour. Browse all events anytime in LMS → Events.',
      },
    ],
  },
  {
    id: 'reference-check',
    category: 'Reference check',
    audience: 'candidate',
    iconName: 'message',
    questions: [
      {
        id: 'what-ref',
        q: 'How does Reference Check work?',
        a: 'Open Reference Check to ask about a company or person with paid questions. The other person can accept, answer, and you can rate. Fees use tokens. Open a request card to view status, questions, and answers.',
      },
      {
        id: 'company-page',
        q: 'How do company pages work?',
        a: 'Search and open company pages from Reference Check / Office Gossips. Creating a page needs a matching work-email domain. Pages currently use a letter avatar (logo upload can be added later).',
      },
    ],
  },
  {
    id: 'employers',
    category: 'For employers',
    audience: 'employer',
    iconName: 'building',
    questions: [
      {
        id: 'employer-start',
        q: 'How do employers get started?',
        a: 'Visit the Employers page and book a SAASA B2E demo, or contact support. Employer workspaces cover hiring pipelines, job posts, and candidate review depending on your plan.',
      },
      {
        id: 'employer-jobs',
        q: 'How do our jobs reach candidates?',
        a: 'Posted roles appear in Explore Jobs and matching flows. Strong job descriptions (skills, title, location) help AI match and ATS-style scoring on the candidate side.',
      },
      {
        id: 'employer-privacy',
        q: 'How is candidate data handled for employers?',
        a: 'Candidates control applications. Contact details are shared when they apply. Follow Trust & Safety and Privacy Policy for acceptable use. For enterprise setup, book a demo with SAASA B2E.',
      },
      {
        id: 'employer-demo',
        q: 'Where can I book a product demo?',
        a: 'Use Book a Demo in the footer (email to support) or the Employers page CTA. Include your company name and hiring needs so the team can guide the right setup.',
      },
    ],
  },
  {
    id: 'privacy',
    category: 'Privacy & safety',
    audience: 'both',
    iconName: 'shield',
    questions: [
      {
        id: 'data-use',
        q: 'How is my data used?',
        a: 'We use profile and activity data to match jobs, power suggestions, and improve your experience. We do not sell your personal data to advertisers. See Privacy Policy for full details.',
      },
      {
        id: 'security',
        q: 'Is my information secure?',
        a: 'We use standard encryption and secure infrastructure. Share contact details only when you apply or explicitly connect. Report abuse via Trust & Safety.',
      },
    ],
  },
];

export function faqIcon(name: FaqCategory['iconName'], className = 'h-5 w-5'): ReactNode {
  const props = { className, strokeWidth: 2.25 } as const;
  switch (name) {
    case 'user':
      return <UserCheck {...props} className={`${className} text-white`} />;
    case 'brief':
      return <Briefcase {...props} className={`${className} text-white`} />;
    case 'brain':
      return <Sparkles {...props} className={`${className} text-white`} />;
    case 'shield':
      return <ShieldCheck {...props} className={`${className} text-white`} />;
    case 'users':
      return <Users {...props} className={`${className} text-white`} />;
    case 'message':
      return <MessageSquare {...props} className={`${className} text-white`} />;
    case 'coins':
      return <Coins {...props} className={`${className} text-white`} />;
    case 'grad':
      return <GraduationCap {...props} className={`${className} text-white`} />;
    case 'building':
      return <Building2 {...props} className={`${className} text-white`} />;
    case 'file':
      return <FileText {...props} className={`${className} text-white`} />;
    default:
      return <HelpCircle {...props} className={`${className} text-white`} />;
  }
}

const QUESTION_ICONS = [CircleHelp, Lightbulb, Compass, BookOpen, Sparkles, BadgeCheck] as const;

/** Distinct lucide icon per question row (cycles by index). */
export function questionRowIcon(index: number, className = 'h-4 w-4', open = false): ReactNode {
  const Icon = QUESTION_ICONS[index % QUESTION_ICONS.length];
  return <Icon className={className} strokeWidth={open ? 2.4 : 2.1} />;
}
