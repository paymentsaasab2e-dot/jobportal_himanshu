export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I choose the right service?',
    answer:
      'Start by identifying your current need — whether it\'s improving your resume, preparing for interviews, or assessing your skills. Our recommended section suggests services based on your profile, or you can browse by category.',
  },
  {
    id: 'faq-2',
    question: 'What do I need before requesting a service?',
    answer:
      'It depends on the service. Most resume services require your current resume in PDF or DOCX format. Interview and assessment services may need your target role and experience level. Each service page lists the required inputs.',
  },
  {
    id: 'faq-3',
    question: 'Can I track my service request?',
    answer:
      'Yes. Once you submit a service request, you can track its status from the My Services page. You\'ll see real-time updates as your request moves through each stage.',
  },
  {
    id: 'faq-4',
    question: 'Are these services personalized for my profile?',
    answer:
      'Absolutely. Services use your uploaded resume, skills, experience, and career preferences to provide targeted, relevant recommendations and outputs.',
  },
  {
    id: 'faq-5',
    question: 'How long does a service request usually take?',
    answer:
      'AI-powered services like Resume Review provide instant results. Expert-guided services like Resume Writing or Mock Interviews typically take 2–5 business days depending on complexity.',
  },
  {
    id: 'faq-6',
    question: 'Can I explore services before submitting anything?',
    answer:
      'Yes. You can browse all services, read detailed descriptions, review deliverables, and understand the process before deciding to submit a request.',
  },
];
