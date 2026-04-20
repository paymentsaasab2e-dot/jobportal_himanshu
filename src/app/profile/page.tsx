'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../../components/common/Header';
import { ProfilePageShell } from '@/components/profile/layout';
import {
  WorkspaceSectionCard,
  ProfileWorkspaceTabs,
  ProfileWorkspaceRail,
  useProfileTabNavigation,
  type WorkspaceTabItem,
  type ProfileAlert,
} from '@/components/profile/workspace';
import AiLoadingScreen from '@/components/common/AiLoadingScreen';
import type { ProfileSectionGroup } from '@/components/profile/workspace/useProfileTabNavigation';
import {
  WorkExperienceEntryCard,
  EducationEntryPreview,
  CertificationEntryPreview,
  AccomplishmentEntryPreview,
  ProfileBasicInfoFilled,
  ProfileResumeFilled,
  ProfileProfessionalSummaryFilled,
  ProfileInternshipFilled,
  ProfileGapExplanationFilled,
  ProfileSkillsFilled,
  ProfileLanguagesFilled,
  ProfileProjectFilled,
  ProfilePortfolioLinksFilled,
  ProfileCareerPreferencesFilled,
  ProfileVisaFilled,
  ProfileVaccinationFilled,
  ProfileAcademicAchievementFilled,
  ProfileCompetitiveExamFilled,
} from '@/components/profile/workspace/preview';

const PROFILE_SECTIONS: ProfileSectionGroup[] = [
  {
    id: 'personal-details',
    label: 'Personal Details',
    sections: ['basic-info', 'resume-cv', 'professional-summary'],
  },
  {
    id: 'work-experience',
    label: 'Work Experience',
    sections: ['work-experience', 'internships', 'gap-explanation'],
  },
  {
    id: 'education',
    label: 'Education',
    sections: ['education', 'academic-achievements', 'competitive-exams'],
  },
  {
    id: 'skills',
    label: 'Skills',
    sections: ['skills', 'languages'],
  },
  {
    id: 'projects-certifications',
    label: 'Projects & Certifications',
    sections: ['projects', 'portfolio-links', 'certifications'],
  },
  {
    id: 'job-preferences',
    label: 'Job Preferences',
    sections: ['career-preferences', 'visa-work-authorization'],
  },
  {
    id: 'additional-details',
    label: 'Additional Details',
    sections: ['vaccination'],
  },
];
import BasicInfoModal, { BasicInfoData } from '../../components/modals/BasicInfoModal';
import SummaryModal from '../../components/modals/SummaryModal';
import GapExplanationModal, { GapExplanationData } from '../../components/modals/GapExplanationModal';
import WorkExperienceModal, { WorkExperienceData } from '../../components/modals/WorkExperienceModal';
import InternshipModal, { InternshipData } from '../../components/modals/InternshipModal';
import EducationModal, { EducationData as EducationEntryData } from '../../components/modals/EducationModal';

// Education data structure for profile page (array of entries)
interface EducationData {
  educations: (EducationEntryData & { documents?: string[] })[];
}
import AcademicAchievementModal, { AcademicAchievementData } from '../../components/modals/AcademicAchievementModal';
import CompetitiveExamsModal, { CompetitiveExamsData } from '../../components/modals/CompetitiveExamsModal';
import SkillsModal, { SkillsData } from '../../components/modals/SkillsModal';
import LanguagesModal, { LanguagesData } from '../../components/modals/LanguagesModal';
import ProjectModal, { ProjectData } from '../../components/modals/ProjectModal';
import PortfolioLinksModal, { PortfolioLinksData } from '../../components/modals/PortfolioLinksModal';
import CertificationModal, { CertificationsData } from '../../components/modals/CertificationModal';
import AccomplishmentModal, { AccomplishmentsData } from '../../components/modals/AccomplishmentModal';
import CareerPreferencesModal, { CareerPreferencesData } from '../../components/modals/CareerPreferencesModal';
import VisaWorkAuthorizationModal, { VisaWorkAuthorizationData } from '../../components/modals/VisaWorkAuthorizationModal';
import VaccinationModal, { VaccinationData } from '../../components/modals/VaccinationModal';
import ResumeModal, { ResumeData as BaseResumeData } from '../../components/modals/ResumeModal';
import { API_BASE_URL } from '@/lib/api-base';
import ProfileDrawer from '../../components/ui/ProfileDrawer';

// Extended ResumeData interface for profile page
interface ResumeData extends BaseResumeData {
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  atsScore?: number;
  aiAnalyzed?: boolean;
}

type PopupVariant = 'alert' | 'confirm';

interface PopupState {
  isOpen: boolean;
  variant: PopupVariant;
  title: string;
  message: string;
  resolver: ((confirmed: boolean) => void) | null;
}

interface DetailModalState {
  isOpen: boolean;
  title: string;
  data: unknown;
}

const DEFAULT_POPUP_STATE: PopupState = {
  isOpen: false,
  variant: 'alert',
  title: '',
  message: '',
  resolver: null,
};

/** Static copy only — surfaced in the insights rail (no API). */
const PROFILE_AI_SUGGESTIONS = [
  'Improve your summary to highlight leadership skills.',
  'Add quantifiable achievements to your work experience.',
  'Consider certifications in cloud computing for better matching.',
  'Include a project demonstrating full-stack development expertise.',
];

function resolveProfileImage(
  photoUrl: string | null | undefined,
  apiBaseUrl: string,
) {
  if (!photoUrl || !photoUrl.trim()) return null;
  if (
    photoUrl.startsWith('data:') ||
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://')
  ) {
    return photoUrl;
  }

  const baseUrl = apiBaseUrl.replace('/api', '');
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${cleanPath}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGapExplanationModalOpen, setIsGapExplanationModalOpen] = useState(false);
  const [gapExplanationModalMode, setGapExplanationModalMode] = useState<'add' | 'edit'>('edit');
  const [editingGapExplanationId, setEditingGapExplanationId] = useState<string | null>(null);
  const [isWorkExperienceModalOpen, setIsWorkExperienceModalOpen] = useState(false);
  const [isInternshipModalOpen, setIsInternshipModalOpen] = useState(false);
  const [internshipModalMode, setInternshipModalMode] = useState<'add' | 'edit'>('edit');
  const [editingInternshipId, setEditingInternshipId] = useState<string | null>(null);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isAcademicAchievementModalOpen, setIsAcademicAchievementModalOpen] = useState(false);
  const [academicAchievementModalMode, setAcademicAchievementModalMode] = useState<'add' | 'edit'>('edit');
  const [editingAcademicAchievementId, setEditingAcademicAchievementId] = useState<string | null>(null);
  const [isCompetitiveExamsModalOpen, setIsCompetitiveExamsModalOpen] = useState(false);
  const [competitiveExamsModalMode, setCompetitiveExamsModalMode] = useState<'add' | 'edit'>('edit');
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isLanguagesModalOpen, setIsLanguagesModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'add' | 'edit'>('edit');
  const [isPortfolioLinksModalOpen, setIsPortfolioLinksModalOpen] = useState(false);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [isAccomplishmentModalOpen, setIsAccomplishmentModalOpen] = useState(false);
  const [isCareerPreferencesModalOpen, setIsCareerPreferencesModalOpen] = useState(false);
  const [isVisaWorkAuthorizationModalOpen, setIsVisaWorkAuthorizationModalOpen] = useState(false);
  const [isVaccinationModalOpen, setIsVaccinationModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [careerPreferencesSuccessMessage, setCareerPreferencesSuccessMessage] = useState('');

  // Summary form state
  const [summaryText, setSummaryText] = useState('');

  // Loading state
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Profile completeness state
  const [profileCompleteness, setProfileCompleteness] = useState({
    percentage: 0,
    completedSections: [] as string[],
    missingSections: [] as string[],
  });

  // Data storage for modals - Initialize with empty/undefined to allow auto-population
  const [basicInfoData, setBasicInfoData] = useState<BasicInfoData | undefined>(undefined);
  const [gapExplanationData, setGapExplanationData] = useState<GapExplanationData[]>([]);
  const [workExperienceData, setWorkExperienceData] = useState<WorkExperienceData | undefined>();
  const [internshipData, setInternshipData] = useState<InternshipData[]>([]);
  const [educationData, setEducationData] = useState<EducationData | undefined>();
  const [academicAchievementData, setAcademicAchievementData] = useState<AcademicAchievementData[]>([]);
  const [competitiveExamsData, setCompetitiveExamsData] = useState<CompetitiveExamsData[]>([]);
  const [skillsData, setSkillsData] = useState<SkillsData | undefined>();
  const [languagesData, setLanguagesData] = useState<LanguagesData | undefined>();
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [portfolioLinksData, setPortfolioLinksData] = useState<PortfolioLinksData | undefined>();
  const [certificationsData, setCertificationsData] = useState<CertificationsData | undefined>();
  const [accomplishmentsData, setAccomplishmentsData] = useState<AccomplishmentsData | undefined>();
  const [careerPreferencesData, setCareerPreferencesData] = useState<CareerPreferencesData | undefined>();
  const [visaWorkAuthorizationData, setVisaWorkAuthorizationData] = useState<VisaWorkAuthorizationData | undefined>();
  const [vaccinationData, setVaccinationData] = useState<VaccinationData | undefined>();
  const [resumeData, setResumeData] = useState<ResumeData | undefined>(undefined);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [cvAnalysis, setCvAnalysis] = useState<{
    cv_score: number;
    skills_level: string;
    experience_level: string;
    education_level: string;
  } | null>(null);

  // Work experience cards collapse/expand state
  const [expandedWorkExperienceCards, setExpandedWorkExperienceCards] = useState<{ [key: string]: boolean }>({});
  
  // Work experience edit state - track which entry is being edited
  const [editingWorkExperienceId, setEditingWorkExperienceId] = useState<string | null>(null);

  // Education cards collapse/expand state
  const [expandedEducationCards, setExpandedEducationCards] = useState<{ [key: string]: boolean }>({});
  
  // Education edit state - track which entry is being edited
  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);

  // Internship card collapse/expand state
  const [expandedInternshipId, setExpandedInternshipId] = useState<string | null>(null);

  // Gap explanation card collapse/expand state
  const [expandedGapExplanationId, setExpandedGapExplanationId] = useState<string | null>(null);

  // Card collapse/expand states for all modals
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [expandedAcademicAchievementId, setExpandedAcademicAchievementId] = useState<string | null>(null);
  const [expandedCompetitiveExamId, setExpandedCompetitiveExamId] = useState<string | null>(null);
  const [editingCompetitiveExamId, setEditingCompetitiveExamId] = useState<string | null>(null);
  const [isCertificationCardExpanded, setIsCertificationCardExpanded] = useState<{ [key: string]: boolean }>({});
  const [editingCertificationId, setEditingCertificationId] = useState<string | null>(null);
  const [isAccomplishmentCardExpanded, setIsAccomplishmentCardExpanded] = useState<{ [key: string]: boolean }>({});
  const [editingAccomplishmentId, setEditingAccomplishmentId] = useState<string | null>(null);
  const [isCareerPreferencesCardExpanded, setIsCareerPreferencesCardExpanded] = useState<boolean>(false);
  const [isVisaCardExpanded, setIsVisaCardExpanded] = useState<boolean>(false);
  const [isVaccinationCardExpanded, setIsVaccinationCardExpanded] = useState<boolean>(false);
  const [isResumeCardExpanded, setIsResumeCardExpanded] = useState<boolean>(false);
  const [isPortfolioLinksCardExpanded, setIsPortfolioLinksCardExpanded] = useState<boolean>(false);
  const [popupState, setPopupState] = useState<PopupState>(DEFAULT_POPUP_STATE);
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    isOpen: false,
    title: '',
    data: null,
  });

  // API base URL

  const isPersistedId = (value?: string) => Boolean(value && /^[a-f\d]{24}$/i.test(value));

  const showAlert = useCallback((message: string, title = 'Notice') => {
    setPopupState({
      isOpen: true,
      variant: 'alert',
      title,
      message,
      resolver: null,
    });
  }, []);

  const showConfirm = useCallback((message: string, title = 'Confirm Action') => {
    return new Promise<boolean>((resolve) => {
      setPopupState({
        isOpen: true,
        variant: 'confirm',
        title,
        message,
        resolver: resolve,
      });
    });
  }, []);

  const closePopup = useCallback((confirmed: boolean) => {
    setPopupState((prev) => {
      if (prev.variant === 'confirm' && prev.resolver) {
        prev.resolver(confirmed);
      }
      return DEFAULT_POPUP_STATE;
    });
  }, []);

  useEffect(() => {
    if (!popupState.isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopup(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [popupState.isOpen, closePopup]);

  const sanitizeDetails = useCallback((value: unknown): unknown => {
    try {
      return JSON.parse(
        JSON.stringify(value, (_key, currentValue) => {
          if (currentValue instanceof File) {
            return {
              name: currentValue.name,
              size: currentValue.size,
              type: currentValue.type,
            };
          }
          return currentValue;
        }),
      );
    } catch {
      return value;
    }
  }, []);

  const openDetailsModal = useCallback(
    (title: string, data: unknown) => {
      setDetailModal({
        isOpen: true,
        title,
        data: sanitizeDetails(data),
      });
    },
    [sanitizeDetails],
  );

  const shouldIgnoreDetailsOpen = (target: EventTarget | null) => {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest('button, a, input, textarea, select, label'))
    );
  };

  const handleEditableCardClick = (
    event: { target: EventTarget | null },
    onEdit: () => void,
  ) => {
    if (shouldIgnoreDetailsOpen(event.target)) return;
    onEdit();
  };

  const handleEditableCardKeyDown = (
    event: { key: string; preventDefault: () => void },
    onEdit: () => void,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEdit();
    }
  };

  // Helper function to format enum values for display
  const formatEnumValue = (value: string | null | undefined): string => {
    if (!value) return '—';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDocumentUrl = (doc: any): string =>
    typeof doc === 'string' ? doc : doc?.url || '';

  const getDocumentName = (doc: any): string => {
    if (typeof doc === 'string') {
      return doc.split('/').pop() || 'Document';
    }
    return doc?.name || doc?.url?.split('/').pop() || 'Document';
  };

  const getApiDocumentHref = (doc: any): string => {
    const url = getDocumentUrl(doc);
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };

  const resolveProfileDocHref = (doc: unknown): string => {
    const url = getDocumentUrl(doc);
    return url.startsWith('http')
      ? url
      : `${API_BASE_URL.replace('/api', '')}${url}`;
  };

  const serializeMaybeFile = (value?: File | string) => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    return value.name;
  };

  const serializeVisaData = (data: VisaWorkAuthorizationData) => ({
    ...data,
    visaDetailsInitial: data.visaDetailsInitial
      ? {
          ...data.visaDetailsInitial,
          documents: data.visaDetailsInitial.documents?.map((doc) => ({
            ...doc,
            file: serializeMaybeFile(doc.file),
          })) || [],
        }
      : undefined,
    visaDetailsExpected: data.visaDetailsExpected
      ? {
          ...data.visaDetailsExpected,
          documents: data.visaDetailsExpected.documents?.map((doc) => ({
            ...doc,
            file: serializeMaybeFile(doc.file),
          })) || [],
        }
      : undefined,
    visaEntries: data.visaEntries?.map((entry) => ({
      ...entry,
      visaDetails: {
        ...entry.visaDetails,
        documents: entry.visaDetails.documents?.map((doc) => ({
          ...doc,
          file: serializeMaybeFile(doc.file),
        })) || [],
      },
    })) || [],
  });

  const refreshProfileData = async (candidateId: string) => {
    try {
      const url = `${API_BASE_URL}/profile/${candidateId}`;
      console.log('🔄 Fetching profile data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch((fetchError) => {
        console.error('❌ Network error fetching profile:', fetchError);
        console.error('⚠️ Check if backend server is running at:', API_BASE_URL);
        console.error('⚠️ Make sure the backend server is started with: npm start or node server.js');
        // Return null instead of throwing to prevent breaking the save flow
        return null;
      });

      // If fetch failed (network error), return null
      if (!response) {
        console.warn('⚠️ Failed to fetch profile data - network error. Preserving existing state.');
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ Profile fetch error:', errorMessage);
        // Don't throw error, just log it and preserve existing state
        console.warn('⚠️ Failed to refresh profile data, preserving existing state');
        return null;
      }

    const result = await response.json();
    if (!result.success || !result.data) {
      console.warn('⚠️ Invalid profile data response, preserving existing state');
      return null;
    }

    const profileData = result.data;

    if (
      profileData.profilePhotoUrl !== undefined ||
      profileData.profile?.profilePhotoUrl !== undefined ||
      profileData.personalInfo?.profilePhotoUrl !== undefined ||
      profileData.personalInfo?.photoUrl !== undefined
    ) {
      setProfilePhotoUrl(
        profileData.profilePhotoUrl ||
          profileData.profile?.profilePhotoUrl ||
          profileData.personalInfo?.profilePhotoUrl ||
          profileData.personalInfo?.photoUrl ||
          null,
      );
    }

    // Only update state if data exists in response, otherwise preserve existing state
    if (profileData.personalInfo !== undefined) {
      setBasicInfoData(profileData.personalInfo || undefined);
    }
    // Preserve existing basicInfoData if not in response

    if (profileData.summaryText !== undefined) {
      setSummaryText(profileData.summaryText || '');
    }

    if (profileData.gapExplanations !== undefined) {
      if (Array.isArray(profileData.gapExplanations)) {
        setGapExplanationData(profileData.gapExplanations);
      } else {
        setGapExplanationData([]);
      }
    } else if (profileData.gapExplanation !== undefined) {
      setGapExplanationData(profileData.gapExplanation ? [profileData.gapExplanation] : []);
    }
    // Preserve existing gapExplanationData if not in response

    if (profileData.internships !== undefined) {
      if (Array.isArray(profileData.internships)) {
        setInternshipData(profileData.internships);
      } else {
        setInternshipData([]);
      }
    } else if (profileData.internship !== undefined) {
      setInternshipData(profileData.internship ? [profileData.internship] : []);
    }
    // Preserve existing internshipData if not in response

    if (profileData.portfolioLinks !== undefined) {
      const normalizeUrlForCompare = (rawUrl: string) => {
        const value = rawUrl.trim();
        if (!value) return '';
        try {
          const parsed = new URL(value);
          const normalizedPath = parsed.pathname.replace(/\/+$/, '');
          return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}${parsed.search}${parsed.hash}`.toLowerCase();
        } catch {
          return value.replace(/\/+$/, '').toLowerCase();
        }
      };
      const incomingLinks = profileData.portfolioLinks?.links || [];
      const dedupedLinks = incomingLinks.filter((item: any, index: number, arr: any[]) => {
        const key = normalizeUrlForCompare(item?.url || '');
        if (!key) return true;
        return (
          arr.findIndex(
            (candidate) =>
              normalizeUrlForCompare(candidate?.url || '') === key
          ) === index
        );
      });
      setPortfolioLinksData(profileData.portfolioLinks ? { ...profileData.portfolioLinks, links: dedupedLinks } : undefined);
    }
    // Preserve existing portfolioLinksData if not in response

    if (profileData.education !== undefined) {
      if (Array.isArray(profileData.education)) {
        setEducationData({
          educations: profileData.education,
        });
      } else {
        setEducationData(undefined);
      }
    }
    // Preserve existing educationData if not in response

    if (profileData.workExperience !== undefined) {
      if (Array.isArray(profileData.workExperience)) {
        setWorkExperienceData({
          workExperiences: profileData.workExperience,
        });
      } else {
        setWorkExperienceData(undefined);
      }
    }
    // Preserve existing workExperienceData if not in response

    if (profileData.skills !== undefined) {
      if (Array.isArray(profileData.skills)) {
        setSkillsData({
          skills: profileData.skills,
          additionalNotes: profileData.skillsAdditionalNotes || '',
        });
      } else {
        setSkillsData(undefined);
      }
    }
    // Preserve existing skillsData if not in response

    if (profileData.languages !== undefined) {
      if (Array.isArray(profileData.languages)) {
        setLanguagesData({
          languages: profileData.languages,
        });
      } else {
        setLanguagesData(undefined);
      }
    }
    // Preserve existing languagesData if not in response

    if (profileData.resume !== undefined) {
      setResumeData(profileData.resume || undefined);
    }
    // Preserve existing resumeData if not in response

    // Fetch CV Analysis (use the candidateId parameter passed to the function)
    if (candidateId) {
      fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(async (response) => {
          if (response.ok) return response.json();

          if (response.status === 404) {
            await fetch(`${API_BASE_URL}/cv-analysis/analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ candidateId }),
            });

            const retry = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            if (retry.ok) return retry.json();
          }
          return null;
        })
        .then((result) => {
          if (result && result.success && result.data) {
            setCvAnalysis(result.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching CV analysis:', error);
        });
    }

    if (profileData.projects !== undefined) {
      if (Array.isArray(profileData.projects)) {
        setProjectData(profileData.projects);
      } else {
        setProjectData([]);
      }
    } else if (profileData.project !== undefined) {
      setProjectData(profileData.project ? [profileData.project] : []);
    }
    // Preserve existing projectData if not in response

    if (profileData.academicAchievements !== undefined) {
      if (Array.isArray(profileData.academicAchievements)) {
        setAcademicAchievementData(profileData.academicAchievements);
      } else {
        setAcademicAchievementData([]);
      }
    } else if (profileData.academicAchievement !== undefined) {
      setAcademicAchievementData(profileData.academicAchievement ? [profileData.academicAchievement] : []);
    }
    // Preserve existing academicAchievementData if not in response

    if (profileData.competitiveExams !== undefined) {
      if (Array.isArray(profileData.competitiveExams)) {
        setCompetitiveExamsData(profileData.competitiveExams);
      } else {
        setCompetitiveExamsData([]);
      }
    } else if (profileData.competitiveExam !== undefined) {
      setCompetitiveExamsData(profileData.competitiveExam ? [profileData.competitiveExam] : []);
    }
    // Preserve existing competitiveExamsData if not in response

    if (profileData.certifications !== undefined) {
      setCertificationsData(profileData.certifications || undefined);
    }
    // Preserve existing certificationsData if not in response

    if (profileData.accomplishments !== undefined) {
      setAccomplishmentsData(profileData.accomplishments || undefined);
    }
    // Preserve existing accomplishmentsData if not in response

    if (profileData.careerPreferences !== undefined) {
      setCareerPreferencesData(profileData.careerPreferences || undefined);
    }
    // Preserve existing careerPreferencesData if not in response

    if (profileData.visaWorkAuthorization !== undefined) {
      setVisaWorkAuthorizationData(profileData.visaWorkAuthorization || undefined);
    }
    // Preserve existing visaWorkAuthorizationData if not in response

    if (profileData.vaccination !== undefined) {
      setVaccinationData(profileData.vaccination || undefined);
    }
    // Preserve existing vaccinationData if not in response

      return profileData;
    } catch (error) {
      console.error('❌ Error in refreshProfileData:', error);
      // Don't throw error, just log it and preserve existing state
      console.warn('⚠️ Error refreshing profile data, preserving existing state');
      return null;
    }
  };

  // Fetch and populate profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      const candidateId = sessionStorage.getItem('candidateId');
      if (!candidateId) {
        console.warn('No candidate ID found in session storage');
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);
        if (await refreshProfileData(candidateId)) {
          console.log('✅ Profile data loaded from database');
        } else {
          console.error('Failed to fetch profile data');
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch CV Analysis on component mount
  useEffect(() => {
    const fetchCvAnalysis = async () => {
      const candidateId = sessionStorage.getItem('candidateId');
      if (!candidateId) return;

      try {
        let response = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          await fetch(`${API_BASE_URL}/cv-analysis/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ candidateId }),
          });

          response = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCvAnalysis(result.data);
            console.log('✅ CV Analysis loaded:', result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching CV analysis:', error);
      }
    };

    fetchCvAnalysis();
  }, []);

  // Recalculate completeness whenever relevant data changes
  useEffect(() => {
    calculateProfileCompleteness();
  }, [
    basicInfoData,
    summaryText,
    educationData,
    skillsData,
    languagesData,
    projectData,
    portfolioLinksData,
    careerPreferencesData,
    visaWorkAuthorizationData,
    vaccinationData,
    resumeData,
  ]);

  // Function to open the first missing modal
  const openFirstMissingModal = () => {
    if (profileCompleteness.missingSections.length === 0) {
      // If no missing sections, just scroll to profile
      return;
    }

    const firstMissingSection = profileCompleteness.missingSections[0];
    
    // Map section names to their modal openers
    const modalMap: { [key: string]: () => void } = {
      'Basic Information': () => setIsBasicInfoModalOpen(true),
      'Summary': () => setIsSummaryModalOpen(true),
      'Education': () => setIsEducationModalOpen(true),
      'Skills': () => setIsSkillsModalOpen(true),
      'Languages': () => setIsLanguagesModalOpen(true),
      'Projects': () => {
        setProjectModalMode('add');
        setEditingProjectId(null);
        setIsProjectModalOpen(true);
      },
      'Portfolio Links': () => setIsPortfolioLinksModalOpen(true),
      'Career Preferences': () => setIsCareerPreferencesModalOpen(true),
      'Visa & Work Authorization': () => setIsVisaWorkAuthorizationModalOpen(true),
      'Vaccination': () => setIsVaccinationModalOpen(true),
      'Resume': () => setIsResumeModalOpen(true),
    };

    // Open the modal for the first missing section
    if (modalMap[firstMissingSection]) {
      modalMap[firstMissingSection]();
    }
  };

  // Calculate profile completeness based on mandatory fields
  const calculateProfileCompleteness = () => {
    const isBasicInformationComplete = Boolean(
      basicInfoData?.firstName?.trim() &&
      basicInfoData?.email?.trim() &&
      basicInfoData?.phone?.trim() &&
      basicInfoData?.gender?.trim() &&
      basicInfoData?.dob?.trim() &&
      basicInfoData?.city?.trim() &&
      basicInfoData?.country?.trim(),
    );

    const mandatorySections = [
      { key: 'basicInformation', name: 'Basic Information', check: () => isBasicInformationComplete },
      { key: 'summary', name: 'Summary', check: () => summaryText && summaryText.trim().length > 0 },
      { key: 'education', name: 'Education', check: () => educationData && educationData.educations && educationData.educations.length > 0 },
      { key: 'skills', name: 'Skills', check: () => skillsData && skillsData.skills && skillsData.skills.length > 0 },
      { key: 'languages', name: 'Languages', check: () => languagesData && languagesData.languages && languagesData.languages.length > 0 },
      { key: 'projects', name: 'Projects', check: () => projectData.length > 0 },
      { key: 'portfolioLinks', name: 'Portfolio Links', check: () => portfolioLinksData && portfolioLinksData.links && portfolioLinksData.links.length > 0 },
      { key: 'careerPreferences', name: 'Career Preferences', check: () => careerPreferencesData !== undefined && careerPreferencesData !== null },
      { key: 'visaAuthorization', name: 'Visa & Work Authorization', check: () => visaWorkAuthorizationData !== undefined && visaWorkAuthorizationData !== null },
      { key: 'vaccination', name: 'Vaccination', check: () => vaccinationData !== undefined && vaccinationData !== null },
      { key: 'resume', name: 'Resume', check: () => resumeData && resumeData.fileUrl },
    ];

    const completedSections: string[] = [];
    const missingSections: string[] = [];

    mandatorySections.forEach(section => {
      if (section.check()) {
        completedSections.push(section.name);
      } else {
        missingSections.push(section.name);
      }
    });

    const completionPercentage = Math.round((completedSections.length / mandatorySections.length) * 100);

    setProfileCompleteness({
      percentage: completionPercentage,
      completedSections,
      missingSections,
    });

    return { completionPercentage, completedSections, missingSections };
  };

  // Check if a section is mandatory and missing
  const isMandatorySectionMissing = (category: string, itemName: string): boolean => {
    const isBasicInformationComplete = Boolean(
      basicInfoData?.firstName?.trim() &&
      basicInfoData?.email?.trim() &&
      basicInfoData?.phone?.trim() &&
      basicInfoData?.gender?.trim() &&
      basicInfoData?.dob?.trim() &&
      basicInfoData?.city?.trim() &&
      basicInfoData?.country?.trim(),
    );

    const mandatoryMap: { [key: string]: string[] } = {
      'PERSONAL DETAILS': ['Basic Information', 'Summary'],
      'EDUCATION': ['Education'],
      'SKILLS': ['Skills', 'Languages'],
      'PROJECTS': ['Projects', 'Portfolio Links'],
      'PREFERENCES': ['Career Preferences'],
      'GLOBAL ELIGIBILITY': ['Visa & Work Authorization', 'Vaccination'],
      'RESUME': ['Resume'],
    };

    const mandatoryItems = mandatoryMap[category] || [];
    if (!mandatoryItems.includes(itemName)) {
      return false; // Not a mandatory field
    }

    // Check if the section is actually missing
    if (itemName === 'Basic Information') {
      return !isBasicInformationComplete;
    }
    if (itemName === 'Summary') {
      return !(summaryText && summaryText.trim().length > 0);
    }
    if (itemName === 'Education') {
      return !(educationData && educationData.educations && educationData.educations.length > 0);
    }
    if (itemName === 'Skills') {
      return !(skillsData && skillsData.skills && skillsData.skills.length > 0);
    }
    if (itemName === 'Languages') {
      return !(languagesData && languagesData.languages && languagesData.languages.length > 0);
    }
    if (itemName === 'Projects') {
      return projectData.length === 0;
    }
    if (itemName === 'Portfolio Links') {
      return !(portfolioLinksData && portfolioLinksData.links && portfolioLinksData.links.length > 0);
    }
    if (itemName === 'Career Preferences') {
      return !(careerPreferencesData !== undefined && careerPreferencesData !== null);
    }
    if (itemName === 'Visa & Work Authorization') {
      return !(visaWorkAuthorizationData !== undefined && visaWorkAuthorizationData !== null);
    }
    if (itemName === 'Vaccination') {
      return !(vaccinationData !== undefined && vaccinationData !== null);
    }
    if (itemName === 'Resume') {
      return !(resumeData && resumeData.fileUrl);
    }

    return false;
  };

  const handleEditClick = (category: string, itemName: string) => {
    if (category === 'PERSONAL DETAILS' && itemName === 'Basic Information') {
      setIsBasicInfoModalOpen(true);
    } else if (category === 'PERSONAL DETAILS' && itemName === 'Summary') {
      setIsSummaryModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Gap Explanation') {
      setGapExplanationModalMode('edit');
      setEditingGapExplanationId(gapExplanationData[gapExplanationData.length - 1]?.id || null);
      setIsGapExplanationModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Work Experience') {
      setIsWorkExperienceModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Internships') {
      setInternshipModalMode('edit');
      setEditingInternshipId(internshipData[internshipData.length - 1]?.id || null);
      setIsInternshipModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Education') {
      setIsEducationModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Academic Achievements') {
      setAcademicAchievementModalMode('edit');
      setEditingAcademicAchievementId(
        academicAchievementData[academicAchievementData.length - 1]?.id || null
      );
      setIsAcademicAchievementModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Competitive Exams') {
      setCompetitiveExamsModalMode('edit');
      setEditingCompetitiveExamId(
        competitiveExamsData[competitiveExamsData.length - 1]?.id || null
      );
      setIsCompetitiveExamsModalOpen(true);
    } else if (category === 'SKILLS' && itemName === 'Skills') {
      setIsSkillsModalOpen(true);
    } else if (category === 'SKILLS' && itemName === 'Languages') {
      setIsLanguagesModalOpen(true);
    } else if (category === 'PROJECTS' && itemName === 'Projects') {
      setProjectModalMode('edit');
      setEditingProjectId(projectData[projectData.length - 1]?.id || null);
      setIsProjectModalOpen(true);
    } else if (category === 'PROJECTS' && itemName === 'Portfolio Links') {
      setIsPortfolioLinksModalOpen(true);
    } else if (category === 'CERTIFICATIONS' && itemName === 'Certifications') {
      setIsCertificationModalOpen(true);
    } else if (category === 'CERTIFICATIONS' && itemName === 'Accomplishments') {
      setIsAccomplishmentModalOpen(true);
    } else if (category === 'PREFERENCES' && itemName === 'Career Preferences') {
      setIsCareerPreferencesModalOpen(true);
    } else if (category === 'GLOBAL ELIGIBILITY' && itemName === 'Visa & Work Authorization') {
      setIsVisaWorkAuthorizationModalOpen(true);
    } else if (category === 'GLOBAL ELIGIBILITY' && itemName === 'Vaccination') {
      setVaccinationData(undefined);
      setIsVaccinationModalOpen(true);
    } else if (category === 'RESUME' && itemName === 'Resume') {
      setIsResumeModalOpen(true);
    }
  };

  const handleAddClick = (category: string, itemName: string) => {
    // Open modal without clearing existing state - modals will handle empty initialData
    // This preserves the UI display while allowing new data entry
    if (category === 'PERSONAL DETAILS' && itemName === 'Basic Information') {
      setIsBasicInfoModalOpen(true);
    } else if (category === 'PERSONAL DETAILS' && itemName === 'Summary') {
      setIsSummaryModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Gap Explanation') {
      setGapExplanationModalMode('add');
      setEditingGapExplanationId(null);
      setIsGapExplanationModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Work Experience') {
      setEditingWorkExperienceId(null); // Clear edit ID for new entry
      setIsWorkExperienceModalOpen(true);
    } else if (category === 'WORK HISTORY' && itemName === 'Internships') {
      setInternshipModalMode('add');
      setEditingInternshipId(null);
      setIsInternshipModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Education') {
      setEditingEducationId(null); // Clear edit ID for new entry
      setIsEducationModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Academic Achievements') {
      setAcademicAchievementModalMode('add');
      setEditingAcademicAchievementId(null);
      setIsAcademicAchievementModalOpen(true);
    } else if (category === 'EDUCATION' && itemName === 'Competitive Exams') {
      setCompetitiveExamsModalMode('add');
      setEditingCompetitiveExamId(null);
      setIsCompetitiveExamsModalOpen(true);
    } else if (category === 'SKILLS' && itemName === 'Skills') {
      setIsSkillsModalOpen(true);
    } else if (category === 'SKILLS' && itemName === 'Languages') {
      setIsLanguagesModalOpen(true);
    } else if (category === 'PROJECTS' && itemName === 'Projects') {
      setProjectModalMode('add');
      setEditingProjectId(null);
      setIsProjectModalOpen(true);
    } else if (category === 'PROJECTS' && itemName === 'Portfolio Links') {
      setIsPortfolioLinksModalOpen(true);
    } else if (category === 'CERTIFICATIONS' && itemName === 'Certifications') {
      setEditingCertificationId(null); // Clear edit ID for new entry
      setIsCertificationModalOpen(true);
    } else if (category === 'CERTIFICATIONS' && itemName === 'Accomplishments') {
      setEditingAccomplishmentId(null); // Clear edit ID for new entry
      setIsAccomplishmentModalOpen(true);
    } else if (category === 'PREFERENCES' && itemName === 'Career Preferences') {
      setIsCareerPreferencesModalOpen(true);
    } else if (category === 'GLOBAL ELIGIBILITY' && itemName === 'Visa & Work Authorization') {
      setIsVisaWorkAuthorizationModalOpen(true);
    } else if (category === 'GLOBAL ELIGIBILITY' && itemName === 'Vaccination') {
      setIsVaccinationModalOpen(true);
    } else if (category === 'RESUME' && itemName === 'Resume') {
      setIsResumeModalOpen(true);
    }
  };

  const tabIncomplete = useCallback(
    (checks: Array<() => boolean>) => checks.some((c) => c()),
    [],
  );

  const {
    tabsBarRef,
    activeTabId: activeWorkspaceTab,
    scrollToTabGroup: scrollToWorkspaceTab,
    scrollPaddingStyle,
  } = useProfileTabNavigation(PROFILE_SECTIONS);

  const workspaceTabs: WorkspaceTabItem[] = useMemo(
    () => [
      {
        id: 'personal-details',
        label: 'Personal Details',
        incomplete: tabIncomplete([
          () =>
            isMandatorySectionMissing('PERSONAL DETAILS', 'Basic Information'),
          () => isMandatorySectionMissing('RESUME', 'Resume'),
          () => isMandatorySectionMissing('PERSONAL DETAILS', 'Summary'),
        ]),
      },
      {
        id: 'work-experience',
        label: 'Work Experience',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('WORK HISTORY', 'Work Experience'),
          () => isMandatorySectionMissing('WORK HISTORY', 'Internships'),
          () => isMandatorySectionMissing('WORK HISTORY', 'Gap Explanation'),
        ]),
      },
      {
        id: 'education',
        label: 'Education',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('EDUCATION', 'Education'),
          () => isMandatorySectionMissing('EDUCATION', 'Academic Achievements'),
          () => isMandatorySectionMissing('EDUCATION', 'Competitive Exams'),
        ]),
      },
      {
        id: 'skills',
        label: 'Skills',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('SKILLS', 'Skills'),
          () => isMandatorySectionMissing('SKILLS', 'Languages'),
        ]),
      },
      {
        id: 'projects-certifications',
        label: 'Projects & Certifications',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('PROJECTS', 'Projects'),
          () => isMandatorySectionMissing('PROJECTS', 'Portfolio Links'),
          () => isMandatorySectionMissing('CERTIFICATIONS', 'Certifications'),
        ]),
      },
      {
        id: 'job-preferences',
        label: 'Job Preferences',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('PREFERENCES', 'Career Preferences'),
          () =>
            isMandatorySectionMissing(
              'GLOBAL ELIGIBILITY',
              'Visa & Work Authorization',
            ),
        ]),
      },
      {
        id: 'additional-details',
        label: 'Additional Details',
        incomplete: tabIncomplete([
          () => isMandatorySectionMissing('GLOBAL ELIGIBILITY', 'Vaccination'),
        ]),
      },
    ],
    [
      tabIncomplete,
      basicInfoData,
      summaryText,
      educationData,
      skillsData,
      languagesData,
      projectData,
      portfolioLinksData,
      careerPreferencesData,
      visaWorkAuthorizationData,
      vaccinationData,
      resumeData,
      workExperienceData,
      internshipData,
      gapExplanationData,
      certificationsData,
      accomplishmentsData,
      competitiveExamsData,
      academicAchievementData,
    ],
  );

  const profileInitials = useMemo(() => {
    const f = basicInfoData?.firstName?.trim()?.[0];
    const l = basicInfoData?.lastName?.trim()?.[0];
    if (f || l) return `${f ?? ''}${l ?? ''}`.toUpperCase();
    return '?';
  }, [basicInfoData?.firstName, basicInfoData?.lastName]);

  const profileDisplayName = useMemo(() => {
    const n = [basicInfoData?.firstName, basicInfoData?.lastName]
      .filter(Boolean)
      .join(' ');
    return n || 'Your profile';
  }, [basicInfoData?.firstName, basicInfoData?.lastName]);

  const profileRoleLine = useMemo(() => {
    const t = careerPreferencesData?.preferredJobTitles?.[0]?.trim();
    if (t) return t;
    if (basicInfoData?.employment)
      return formatEnumValue(basicInfoData.employment);
    return undefined;
  }, [careerPreferencesData, basicInfoData?.employment]);

  const profileHeadline = useMemo(() => {
    const e = educationData?.educations?.[0];
    if (!e) return undefined;
    const parts = [
      (e as { degree?: string }).degree,
      (e as { institute?: string; institution?: string }).institute ||
        (e as { institution?: string }).institution,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : undefined;
  }, [educationData]);

  const profileLocationLine = useMemo(() => {
    const c = basicInfoData?.city?.trim();
    const co = basicInfoData?.country?.trim();
    if (c && co) return `${c}, ${co}`;
    return c || co || undefined;
  }, [basicInfoData?.city, basicInfoData?.country]);

  const resolvedProfilePhoto = useMemo(
    () => resolveProfileImage(profilePhotoUrl, API_BASE_URL),
    [profilePhotoUrl],
  );

  const workspaceAlerts: ProfileAlert[] = useMemo(() => {
    const list: ProfileAlert[] = [];
    if (profileCompleteness.percentage < 100) {
      list.push({
        id: 'incomplete',
        tone: 'warning',
        label: `Profile ${profileCompleteness.percentage}% complete — finish required sections.`,
      });
    }
    if (!basicInfoData?.phone?.trim()) {
      list.push({
        id: 'phone',
        tone: 'neutral',
        label: 'Add a phone number for recruiter contact.',
      });
    }
    if (!resumeData?.fileUrl) {
      list.push({
        id: 'resume',
        tone: 'warning',
        label: 'No resume on file — upload to unlock ATS scoring.',
      });
    }
    const ats = cvAnalysis?.cv_score ?? resumeData?.atsScore;
    if (
      resumeData?.fileUrl &&
      ats !== undefined &&
      ats !== null &&
      Number(ats) < 60
    ) {
      list.push({
        id: 'ats',
        tone: 'warning',
        label: 'ATS score has room to improve — refine bullets and keywords.',
      });
    }
    return list.slice(0, 5);
  }, [
    profileCompleteness.percentage,
    basicInfoData?.phone,
    resumeData?.fileUrl,
    resumeData?.atsScore,
    cvAnalysis?.cv_score,
  ]);

  const atsPct =
    cvAnalysis?.cv_score ?? resumeData?.atsScore ?? null;
  const atsDisplay =
    atsPct !== undefined && atsPct !== null && !Number.isNaN(Number(atsPct))
      ? `${Math.round(Number(atsPct))}%`
      : null;

  useEffect(() => {
    if (!careerPreferencesSuccessMessage) return;

    const timeoutId = window.setTimeout(() => {
      setCareerPreferencesSuccessMessage('');
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [careerPreferencesSuccessMessage]);

  if (isLoadingProfile || !minLoadingTimeFinished) {
    return <AiLoadingScreen message="HRYantra AI" />;
  }

  return (
    <ProfilePageShell>

      <main className="mx-auto max-w-[1180px] px-4 pt-0 pb-7 sm:px-5 sm:pt-0 sm:pb-8 lg:px-6">
        {careerPreferencesSuccessMessage && (
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-slate-900 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-sky-300 text-sky-700">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold">Career preferences updated</p>
                  <p className="mt-1 text-sm text-slate-600">{careerPreferencesSuccessMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCareerPreferencesSuccessMessage('')}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
                aria-label="Close success message"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-gray-600 transition-all duration-200 hover:text-gray-900"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back
        </button>

        {/* Main Title Area */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1.5 text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-500">View and update all sections of your SAASA profile.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:items-start lg:gap-4 xl:grid-cols-[256px_minmax(0,1fr)]">
          <ProfileWorkspaceRail
            identity={{
              initials: profileInitials,
              displayName: profileDisplayName,
              photoUrl: resolvedProfilePhoto,
              roleLine: profileRoleLine,
              headline: profileHeadline,
              location: profileLocationLine,
            }}
            onEditIdentity={() =>
              handleEditClick('PERSONAL DETAILS', 'Basic Information')
            }
            alerts={workspaceAlerts}
            completionPct={profileCompleteness.percentage}
            pendingRows={profileCompleteness.missingSections}
            atsDisplay={atsDisplay}
            aiSuggestions={PROFILE_AI_SUGGESTIONS}
            promo={
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 p-3 text-center text-[11px] leading-relaxed text-gray-500">
                Tip: keep your summary and skills updated — recruiters search on
                both.
              </div>
            }
            onImprove={openFirstMissingModal}
          />
          <div className="min-w-0" style={scrollPaddingStyle}>
            <ProfileWorkspaceTabs
              ref={tabsBarRef}
              tabs={workspaceTabs}
              activeId={activeWorkspaceTab}
              onSelect={scrollToWorkspaceTab}
            />
            <div className="space-y-4">
              <section
                id="personal-details"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
                <WorkspaceSectionCard
                  title="Basic Information"
                  sectionId="basic-info"
                  incomplete={isMandatorySectionMissing(
                    'PERSONAL DETAILS',
                    'Basic Information',
                  )}
                  onEdit={() =>
                    handleEditClick('PERSONAL DETAILS', 'Basic Information')
                  }
                  onAdd={() =>
                    handleAddClick('PERSONAL DETAILS', 'Basic Information')
                  }
                  showEdit={Boolean(basicInfoData)}
                  addEmphasized={!basicInfoData}
                >
                  {basicInfoData ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (shouldIgnoreDetailsOpen(event.target)) return;
                        handleEditClick('PERSONAL DETAILS', 'Basic Information');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEditClick('PERSONAL DETAILS', 'Basic Information');
                        }
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      <ProfileBasicInfoFilled data={basicInfoData} />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Add your name, contact, and location to get started.
                    </p>
                  )}
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Resume / CV"
                  sectionId="resume-cv"
                  incomplete={isMandatorySectionMissing('RESUME', 'Resume')}
                  onEdit={() => handleEditClick('RESUME', 'Resume')}
                  onAdd={() => handleAddClick('RESUME', 'Resume')}
                  showEdit={Boolean(resumeData?.fileName || resumeData?.fileUrl)}
                  addEmphasized={
                    !resumeData?.fileName && !resumeData?.fileUrl
                  }
                >
                  {resumeData?.fileName || resumeData?.fileUrl ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (shouldIgnoreDetailsOpen(event.target)) return;
                        handleEditClick('RESUME', 'Resume');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEditClick('RESUME', 'Resume');
                        }
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      <ProfileResumeFilled
                        resumeData={resumeData}
                        scorePercent={
                          cvAnalysis?.cv_score ??
                          resumeData?.atsScore ??
                          0
                        }
                        onReplace={() => setIsResumeModalOpen(true)}
                        onEdit={() => setIsResumeModalOpen(true)}
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                      <p className="text-sm text-gray-600">
                        Upload a resume for ATS scoring and recruiter discovery.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsResumeModalOpen(true)}
                        className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600"
                      >
                        Upload resume
                      </button>
                    </div>
                  )}
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Professional summary"
                  sectionId="professional-summary"
                  incomplete={isMandatorySectionMissing(
                    'PERSONAL DETAILS',
                    'Summary',
                  )}
                  onEdit={() => handleEditClick('PERSONAL DETAILS', 'Summary')}
                  onAdd={() => handleAddClick('PERSONAL DETAILS', 'Summary')}
                  showEdit={Boolean(summaryText?.trim())}
                  addEmphasized={!summaryText?.trim()}
                >
                  {summaryText?.trim() ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if (shouldIgnoreDetailsOpen(event.target)) return;
                        handleEditClick('PERSONAL DETAILS', 'Summary');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleEditClick('PERSONAL DETAILS', 'Summary');
                        }
                      }}
                      className="w-full cursor-pointer text-left"
                    >
                      <ProfileProfessionalSummaryFilled summaryText={summaryText} />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Add a short professional summary to introduce yourself to
                      recruiters.
                    </p>
                  )}
                </WorkspaceSectionCard>
              </section>

              <section
                id="work-experience"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
                <WorkspaceSectionCard
                  title="Work Experience"
                  sectionId="work-experience"
                  onEdit={() =>
                    handleEditClick('WORK HISTORY', 'Work Experience')
                  }
                  onAdd={() =>
                    handleAddClick('WORK HISTORY', 'Work Experience')
                  }
                  showEdit={Boolean(
                    workExperienceData?.workExperiences?.length,
                  )}
                  showAdd
                  addEmphasized={
                    !workExperienceData?.workExperiences?.length
                  }
                >
                  <div>
                    {workExperienceData?.workExperiences?.length ? (
                      <div className="space-y-4">
                        {workExperienceData.workExperiences.map((entry, index) => {
                          const cardKey = entry.id ?? `work-${index}`;
                          const isExpanded = expandedWorkExperienceCards[cardKey] === true;
                          const toggleCard = () => openDetailsModal('Work Experience', entry);

                          return (
                            <div
                              key={cardKey}
                              role="button"
                              tabIndex={0}
                              onClick={(event) =>
                                handleEditableCardClick(event, () => {
                                  setEditingWorkExperienceId(entry.id ?? null);
                                  setIsWorkExperienceModalOpen(true);
                                })
                              }
                              onKeyDown={(event) =>
                                handleEditableCardKeyDown(event, () => {
                                  setEditingWorkExperienceId(entry.id ?? null);
                                  setIsWorkExperienceModalOpen(true);
                                })
                              }
                              className="cursor-pointer"
                            >
                              <WorkExperienceEntryCard
                                entry={entry}
                                formatEnum={formatEnumValue}
                                getDocumentName={getDocumentName}
                                resolveDocHref={resolveProfileDocHref}
                                isExpanded={isExpanded}
                                onToggleExpand={toggleCard}
                                onEdit={() => {
                                  setEditingWorkExperienceId(entry.id ?? null);
                                  setIsWorkExperienceModalOpen(true);
                                }}
                                onDelete={async () => {
                                if (await showConfirm(`Are you sure you want to delete this work experience: ${entry.jobTitle} at ${entry.companyName}?`)) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    showAlert('Candidate ID not found. Please refresh the page.');
                                    return;
                                  }

                                  try {
                                    const response = await fetch(`${API_BASE_URL}/profile/work-experience/${entry.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                    });

                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      throw new Error(errorData.message || 'Failed to delete work experience');
                                    }

                                    await refreshProfileData(candidateId);
                                    showAlert('Work experience deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting work experience:', error);
                                    showAlert(error instanceof Error ? error.message : 'Error deleting work experience');
                                  }
                                }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No work experience added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first work experience</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Internships"
                  sectionId="internships"
                  onEdit={() =>
                    handleEditClick('WORK HISTORY', 'Internships')
                  }
                  onAdd={() =>
                    handleAddClick('WORK HISTORY', 'Internships')
                  }
                  showEdit={internshipData.length > 0}
                  showAdd
                  addEmphasized={internshipData.length === 0}
                >
                  <div>
                    {internshipData.length > 0 ? (
                      <div className="space-y-4">
                        {internshipData.map((internshipItem, index) => (
                          <div
                            key={internshipItem.id || `internship-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={(event) =>
                              handleEditableCardClick(event, () => {
                                setInternshipModalMode('edit');
                                setEditingInternshipId(internshipItem.id || null);
                                setIsInternshipModalOpen(true);
                              })
                            }
                            onKeyDown={(event) =>
                              handleEditableCardKeyDown(event, () => {
                                setInternshipModalMode('edit');
                                setEditingInternshipId(internshipItem.id || null);
                                setIsInternshipModalOpen(true);
                              })
                            }
                            className="cursor-pointer"
                          >
                            <ProfileInternshipFilled
                              data={internshipItem}
                              formatEnum={formatEnumValue}
                              isExpanded={expandedInternshipId === (internshipItem.id || `internship-${index}`)}
                              onToggleExpand={() =>
                                openDetailsModal('Internship Details', internshipItem)
                              }
                              onEdit={() => {
                                setInternshipModalMode('edit');
                                setEditingInternshipId(internshipItem.id || null);
                                setIsInternshipModalOpen(true);
                              }}
                              onDelete={async () => {
                              if (
                                await showConfirm(
                                  `Are you sure you want to delete this internship: ${internshipItem.internshipTitle} at ${internshipItem.companyName}?`,
                                )
                              ) {
                                const candidateId = sessionStorage.getItem('candidateId');
                                if (!candidateId) {
                                  showAlert('Candidate ID not found. Please refresh the page.');
                                  return;
                                }
                                try {
                                  const entryIdParam = internshipItem.id
                                    ? `?entryId=${encodeURIComponent(internshipItem.id)}`
                                    : '';
                                  const response = await fetch(
                                    `${API_BASE_URL}/profile/internship/${candidateId}${entryIdParam}`,
                                    {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    },
                                  );
                                  if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    throw new Error(errorData.message || 'Failed to delete internship');
                                  }
                                  if (expandedInternshipId === (internshipItem.id || `internship-${index}`)) {
                                    setExpandedInternshipId(null);
                                  }
                                  if (editingInternshipId === (internshipItem.id || null)) {
                                    setEditingInternshipId(null);
                                  }
                                  await refreshProfileData(candidateId);
                                  showAlert('Internship deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting internship:', error);
                                  showAlert(
                                    error instanceof Error
                                      ? error.message
                                      : 'Error deleting internship',
                                  );
                                }
                              }
                              }}
                              getDocumentName={getDocumentName}
                              resolveDocHref={resolveProfileDocHref}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No internship added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your internship</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Gap Explanation"
                  sectionId="gap-explanation"
                  onEdit={() =>
                    handleEditClick('WORK HISTORY', 'Gap Explanation')
                  }
                  onAdd={() =>
                    handleAddClick('WORK HISTORY', 'Gap Explanation')
                  }
                  showEdit={gapExplanationData.length > 0}
                  showAdd
                  addEmphasized={gapExplanationData.length === 0}
                >
                  <div>
                    {gapExplanationData.length > 0 ? (
                      <div className="space-y-4">
                        {gapExplanationData.map((gapItem, index) => (
                          <div
                            key={gapItem.id || `gap-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={(event) =>
                              handleEditableCardClick(event, () => {
                                setGapExplanationModalMode('edit');
                                setEditingGapExplanationId(gapItem.id || null);
                                setIsGapExplanationModalOpen(true);
                              })
                            }
                            onKeyDown={(event) =>
                              handleEditableCardKeyDown(event, () => {
                                setGapExplanationModalMode('edit');
                                setEditingGapExplanationId(gapItem.id || null);
                                setIsGapExplanationModalOpen(true);
                              })
                            }
                            className="cursor-pointer"
                          >
                            <ProfileGapExplanationFilled
                              data={gapItem}
                              formatEnum={formatEnumValue}
                              isExpanded={expandedGapExplanationId === (gapItem.id || `gap-${index}`)}
                              onToggleExpand={() =>
                                openDetailsModal('Gap Explanation Details', gapItem)
                              }
                              onEdit={() => {
                                setGapExplanationModalMode('edit');
                                setEditingGapExplanationId(gapItem.id || null);
                                setIsGapExplanationModalOpen(true);
                              }}
                              onDelete={async () => {
                              if (await showConfirm('Are you sure you want to delete this gap explanation?')) {
                                const candidateId = sessionStorage.getItem('candidateId');
                                if (!candidateId) {
                                  showAlert('Candidate ID not found. Please refresh the page.');
                                  return;
                                }
                                try {
                                  const entryIdParam = gapItem.id
                                    ? `?entryId=${encodeURIComponent(gapItem.id)}`
                                    : '';
                                  const response = await fetch(
                                    `${API_BASE_URL}/profile/gap-explanation/${candidateId}${entryIdParam}`,
                                    {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    },
                                  );
                                  if (!response.ok) {
                                    const errorData = await response.json().catch(() => ({}));
                                    throw new Error(errorData.message || 'Failed to delete gap explanation');
                                  }
                                  if (expandedGapExplanationId === (gapItem.id || `gap-${index}`)) {
                                    setExpandedGapExplanationId(null);
                                  }
                                  if (editingGapExplanationId === (gapItem.id || null)) {
                                    setEditingGapExplanationId(null);
                                  }
                                  await refreshProfileData(candidateId);
                                  showAlert('Gap explanation deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting gap explanation:', error);
                                  showAlert(
                                    error instanceof Error
                                      ? error.message
                                      : 'Error deleting gap explanation',
                                  );
                                }
                              }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No gap explanation added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your gap explanation</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </section>

              <section id="education" className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4">
                <WorkspaceSectionCard
                  title="Education"
                  sectionId="education"
                  incomplete={isMandatorySectionMissing(
                    'EDUCATION',
                    'Education',
                  )}
                  onEdit={() =>
                    handleEditClick('EDUCATION', 'Education')
                  }
                  onAdd={() =>
                    handleAddClick('EDUCATION', 'Education')
                  }
                  showEdit={Boolean(educationData?.educations?.length)}
                  showAdd
                  addEmphasized={!educationData?.educations?.length}
                >
                  <div>
                    {educationData?.educations?.length ? (
                      <div className="space-y-4">
                        {educationData.educations.map((entry, index) => {
                          const cardKey = entry.id ?? `education-${index}`;
                          const isCardExpanded = expandedEducationCards[cardKey] === true;
                          const toggleCard = () => openDetailsModal('Education Details', entry);
                          return (
                            <div
                              key={cardKey}
                              role="button"
                              tabIndex={0}
                              onClick={(event) =>
                                handleEditableCardClick(event, () => {
                                  setEditingEducationId(entry.id ?? null);
                                  setIsEducationModalOpen(true);
                                })
                              }
                              onKeyDown={(event) =>
                                handleEditableCardKeyDown(event, () => {
                                  setEditingEducationId(entry.id ?? null);
                                  setIsEducationModalOpen(true);
                                })
                              }
                              className="cursor-pointer"
                            >
                              <EducationEntryPreview
                                entry={entry}
                                isExpanded={isCardExpanded}
                                onToggleExpand={toggleCard}
                                onEdit={() => {
                                  setEditingEducationId(entry.id ?? null);
                                  setIsEducationModalOpen(true);
                                }}
                                onDelete={async () => {
                                if (await showConfirm(`Are you sure you want to delete this education: ${entry.degreeProgram} at ${entry.institutionName}?`)) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    showAlert('Candidate ID not found. Please refresh the page.');
                                    return;
                                  }
                                  try {
                                    const response = await fetch(`${API_BASE_URL}/profile/education/${entry.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    });
                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      throw new Error(errorData.message || 'Failed to delete education');
                                    }
                                    await refreshProfileData(candidateId);
                                    showAlert('Education deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting education:', error);
                                    showAlert(error instanceof Error ? error.message : 'Error deleting education');
                                  }
                                }
                                }}
                                getDocumentName={getDocumentName}
                                resolveDocHref={resolveProfileDocHref}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No education added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first education</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Academic Achievements"
                  sectionId="academic-achievements"
                  onEdit={() =>
                    handleEditClick('EDUCATION', 'Academic Achievements')
                  }
                  onAdd={() =>
                    handleAddClick('EDUCATION', 'Academic Achievements')
                  }
                  showEdit={academicAchievementData.length > 0}
                  showAdd
                  addEmphasized={academicAchievementData.length === 0}
                >
                        <div>
                    {academicAchievementData.length > 0 ? (
                      <div className="space-y-4">
                        {academicAchievementData.map((achievementItem, index) => (
                          <div
                            key={achievementItem.id || `academic-achievement-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={(event) =>
                              handleEditableCardClick(event, () => {
                                setAcademicAchievementModalMode('edit');
                                setEditingAcademicAchievementId(achievementItem.id || null);
                                setIsAcademicAchievementModalOpen(true);
                              })
                            }
                            onKeyDown={(event) =>
                              handleEditableCardKeyDown(event, () => {
                                setAcademicAchievementModalMode('edit');
                                setEditingAcademicAchievementId(achievementItem.id || null);
                                setIsAcademicAchievementModalOpen(true);
                              })
                            }
                            className="cursor-pointer"
                          >
                            <ProfileAcademicAchievementFilled
                              data={achievementItem}
                              isExpanded={
                                expandedAcademicAchievementId ===
                                (achievementItem.id || `academic-achievement-${index}`)
                              }
                              onToggleExpand={() => {
                                setAcademicAchievementModalMode('edit');
                                setEditingAcademicAchievementId(achievementItem.id || null);
                                setIsAcademicAchievementModalOpen(true);
                              }}
                              onEdit={() => {
                                setAcademicAchievementModalMode('edit');
                                setEditingAcademicAchievementId(achievementItem.id || null);
                                setIsAcademicAchievementModalOpen(true);
                              }}
                              onDelete={async () => {
                              if (
                                await showConfirm(
                                  'Are you sure you want to delete this academic achievement?',
                                )
                              ) {
                                const candidateId = sessionStorage.getItem('candidateId');
                                if (!candidateId) {
                                  showAlert('Candidate ID not found.');
                                  return;
                                }
                                try {
                                  const entryIdParam = achievementItem.id
                                    ? `?entryId=${encodeURIComponent(achievementItem.id)}`
                                    : '';
                                  const response = await fetch(
                                    `${API_BASE_URL}/profile/academic-achievement/${candidateId}${entryIdParam}`,
                                    {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    },
                                  );
                                  if (!response.ok)
                                    throw new Error('Failed to delete academic achievement');
                                  if (
                                    expandedAcademicAchievementId ===
                                    (achievementItem.id || `academic-achievement-${index}`)
                                  ) {
                                    setExpandedAcademicAchievementId(null);
                                  }
                                  if (editingAcademicAchievementId === (achievementItem.id || null)) {
                                    setEditingAcademicAchievementId(null);
                                  }
                                  await refreshProfileData(candidateId);
                                  showAlert('Academic achievement deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting academic achievement:', error);
                                  showAlert(
                                    error instanceof Error
                                      ? error.message
                                      : 'Error deleting academic achievement',
                                  );
                                }
                              }
                              }}
                              getDocumentName={getDocumentName}
                              resolveDocHref={resolveProfileDocHref}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No academic achievements added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first academic achievement</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Competitive Exams"
                  sectionId="competitive-exams"
                  onEdit={() =>
                    handleEditClick('EDUCATION', 'Competitive Exams')
                  }
                  onAdd={() =>
                    handleAddClick('EDUCATION', 'Competitive Exams')
                  }
                  showEdit={competitiveExamsData.length > 0}
                  showAdd
                  addEmphasized={competitiveExamsData.length === 0}
                >
                  <div>
                    {competitiveExamsData.length > 0 ? (
                      <div className="space-y-3">
                        {competitiveExamsData.map((exam, index) => (
                          <div
                            key={exam.id || `competitive-exam-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={(event) =>
                              handleEditableCardClick(event, () => {
                                setCompetitiveExamsModalMode('edit');
                                setEditingCompetitiveExamId(exam.id || null);
                                setIsCompetitiveExamsModalOpen(true);
                              })
                            }
                            onKeyDown={(event) =>
                              handleEditableCardKeyDown(event, () => {
                                setCompetitiveExamsModalMode('edit');
                                setEditingCompetitiveExamId(exam.id || null);
                                setIsCompetitiveExamsModalOpen(true);
                              })
                            }
                            className="cursor-pointer"
                          >
                            <ProfileCompetitiveExamFilled
                              data={exam}
                              isExpanded={expandedCompetitiveExamId === (exam.id || `competitive-exam-${index}`)}
                              onToggleExpand={() =>
                                openDetailsModal('Competitive Exam Details', exam)
                              }
                              onEdit={() => {
                                setCompetitiveExamsModalMode('edit');
                                setEditingCompetitiveExamId(exam.id || null);
                                setIsCompetitiveExamsModalOpen(true);
                              }}
                              onDelete={async () => {
                              if (await showConfirm('Are you sure you want to delete this competitive exam?')) {
                                const candidateId = sessionStorage.getItem('candidateId');
                                if (!candidateId) {
                                  showAlert('Candidate ID not found.');
                                  return;
                                }
                                try {
                                  const query = exam.id
                                    ? `?entryId=${encodeURIComponent(exam.id)}`
                                    : '';
                                  const response = await fetch(
                                    `${API_BASE_URL}/profile/competitive-exam/${candidateId}${query}`,
                                    {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    },
                                  );
                                  if (!response.ok) throw new Error('Failed to delete competitive exam');
                                  if (expandedCompetitiveExamId === (exam.id || `competitive-exam-${index}`)) {
                                    setExpandedCompetitiveExamId(null);
                                  }
                                  if (editingCompetitiveExamId === (exam.id || null)) {
                                    setEditingCompetitiveExamId(null);
                                  }
                                  await refreshProfileData(candidateId);
                                  showAlert('Competitive exam deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting competitive exam:', error);
                                  showAlert(
                                    error instanceof Error
                                      ? error.message
                                      : 'Error deleting competitive exam',
                                  );
                                }
                              }
                              }}
                              getDocumentName={getDocumentName}
                              resolveDocHref={resolveProfileDocHref}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12"><svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="mt-4 text-base font-medium text-gray-900">No competitive exam information added yet</p><p className="mt-2 text-sm text-gray-500">Click "+" to add your first competitive exam</p></div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </section>

              <section
                id="skills"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
                <div className="space-y-4">

                <WorkspaceSectionCard
                  title="Skills"
                  sectionId="skills"
                  incomplete={isMandatorySectionMissing('SKILLS', 'Skills')}
                  onEdit={() => handleEditClick('SKILLS', 'Skills')}
                  onAdd={() => handleAddClick('SKILLS', 'Skills')}
                  showEdit={Boolean(
                    skillsData?.skills && skillsData.skills.length > 0,
                  )}
                  showAdd
                  addEmphasized={
                    !(skillsData?.skills && skillsData.skills.length > 0)
                  }
                >
                  <div>
                    {skillsData && skillsData.skills && skillsData.skills.length > 0 ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          if (shouldIgnoreDetailsOpen(event.target)) return;
                          handleEditClick('SKILLS', 'Skills');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleEditClick('SKILLS', 'Skills');
                          }
                        }}
                        className="w-full cursor-pointer text-left"
                      >
                        <ProfileSkillsFilled
                          data={skillsData}
                          onEdit={() => setIsSkillsModalOpen(true)}
                          onDelete={async () => {
                          if (await showConfirm('Are you sure you want to delete all skills?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/profile/skills/${candidateId}`,
                                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
                              );
                              if (!response.ok) throw new Error('Failed to delete skills');
                              await refreshProfileData(candidateId);
                              showAlert('Skills deleted successfully');
                            } catch (error) {
                              console.error('Error deleting skills:', error);
                              showAlert(error instanceof Error ? error.message : 'Error deleting skills');
                            }
                          }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 sm:px-6 sm:py-9">
                        <div className="mx-auto flex max-w-md flex-col items-center text-center">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                            <svg className="h-7 w-7 text-[#28A8E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900">Add your skills</h3>
                          <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            Recruiters match on tools and strengths. Start with a few you use often — you can refine proficiency later.
                          </p>
                          <p className="mt-3 text-xs text-gray-400">Popular starting points:</p>
                          <div className="mt-2 flex flex-wrap justify-center gap-2">
                            {(['React', 'Node.js', 'SQL', 'Communication'] as const).map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setIsSkillsModalOpen(true)}
                                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-[#28A8E1]/40 hover:text-[#28A8E1]"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-4 text-xs text-gray-400">Or use Add above to open the full skills form.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Languages"
                  sectionId="languages"
                  incomplete={isMandatorySectionMissing(
                    'SKILLS',
                    'Languages',
                  )}
                  onEdit={() =>
                    handleEditClick('SKILLS', 'Languages')
                  }
                  onAdd={() =>
                    handleAddClick('SKILLS', 'Languages')
                  }
                  showEdit={Boolean(
                    languagesData?.languages &&
                      languagesData.languages.length > 0,
                  )}
                  showAdd
                  addEmphasized={
                    !(
                      languagesData?.languages &&
                      languagesData.languages.length > 0
                    )
                  }
                >
                  <div>
                    {languagesData && languagesData.languages && languagesData.languages.length > 0 ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          if (shouldIgnoreDetailsOpen(event.target)) return;
                          handleEditClick('SKILLS', 'Languages');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleEditClick('SKILLS', 'Languages');
                          }
                        }}
                        className="w-full cursor-pointer text-left"
                      >
                        <ProfileLanguagesFilled
                          data={languagesData}
                          onEdit={() => setIsLanguagesModalOpen(true)}
                          onDelete={async () => {
                          if (await showConfirm('Are you sure you want to delete all languages?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/profile/languages/${candidateId}`,
                                { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
                              );
                              if (!response.ok) throw new Error('Failed to delete languages');
                              await refreshProfileData(candidateId);
                              showAlert('Languages deleted successfully');
                            } catch (error) {
                              console.error('Error deleting languages:', error);
                              showAlert(error instanceof Error ? error.message : 'Error deleting languages');
                            }
                          }
                        }}
                        getDocumentName={getDocumentName}
                        getApiDocumentHref={getApiDocumentHref}
                      />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No languages added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first language</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </div>
              </section>

              <section
                id="projects-certifications"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
                <WorkspaceSectionCard
                  title="Projects"
                  incomplete={isMandatorySectionMissing(
                    'PROJECTS',
                    'Projects',
                  )}
                  onEdit={() =>
                    handleEditClick('PROJECTS', 'Projects')
                  }
                  onAdd={() =>
                    handleAddClick('PROJECTS', 'Projects')
                  }
                  showEdit={projectData.length > 0}
                  showAdd
                  addEmphasized={projectData.length === 0}
                  sectionId="projects"
                >
                          <div>
                    {projectData.length > 0 ? (
                      <div className="space-y-3">
                        {projectData.map((projectItem, index) => (
                          <div
                            key={projectItem.id || `project-${index}`}
                            role="button"
                            tabIndex={0}
                            onClick={(event) =>
                              handleEditableCardClick(event, () => {
                                setProjectModalMode('edit');
                                setEditingProjectId(projectItem.id || null);
                                setIsProjectModalOpen(true);
                              })
                            }
                            onKeyDown={(event) =>
                              handleEditableCardKeyDown(event, () => {
                                setProjectModalMode('edit');
                                setEditingProjectId(projectItem.id || null);
                                setIsProjectModalOpen(true);
                              })
                            }
                            className="cursor-pointer"
                          >
                            <ProfileProjectFilled
                              data={projectItem}
                              isExpanded={expandedProjectId === (projectItem.id || `project-${index}`)}
                              onToggleExpand={() =>
                                openDetailsModal('Project Details', projectItem)
                              }
                              onEdit={() => {
                                setProjectModalMode('edit');
                                setEditingProjectId(projectItem.id || null);
                                setIsProjectModalOpen(true);
                              }}
                              onDelete={async () => {
                              if (await showConfirm('Are you sure you want to delete this project?')) {
                                const candidateId = sessionStorage.getItem('candidateId');
                                if (!candidateId) {
                                  showAlert('Candidate ID not found.');
                                  return;
                                }
                                try {
                                  const query = projectItem.id
                                    ? `?entryId=${encodeURIComponent(projectItem.id)}`
                                    : '';
                                  const response = await fetch(
                                    `${API_BASE_URL}/profile/project/${candidateId}${query}`,
                                    {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    },
                                  );
                                  if (!response.ok) throw new Error('Failed to delete project');
                                  if (expandedProjectId === (projectItem.id || `project-${index}`)) {
                                    setExpandedProjectId(null);
                                  }
                                  if (editingProjectId === (projectItem.id || null)) {
                                    setEditingProjectId(null);
                                  }
                                  await refreshProfileData(candidateId);
                                  showAlert('Project deleted successfully');
                                } catch (error) {
                                  console.error('Error deleting project:', error);
                                  showAlert(error instanceof Error ? error.message : 'Error deleting project');
                                }
                              }
                              }}
                              getDocumentName={getDocumentName}
                              getApiDocumentHref={getApiDocumentHref}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12"><svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg><p className="mt-4 text-base font-medium text-gray-900">No projects added yet</p><p className="mt-2 text-sm text-gray-500">Click "+" to add your first project</p></div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Portfolio Links"
                  sectionId="portfolio-links"
                  incomplete={isMandatorySectionMissing(
                    'PROJECTS',
                    'Portfolio Links',
                  )}
                  onEdit={() =>
                    handleEditClick('PROJECTS', 'Portfolio Links')
                  }
                  onAdd={() =>
                    handleAddClick('PROJECTS', 'Portfolio Links')
                  }
                  showEdit={Boolean(
                    portfolioLinksData?.links &&
                      portfolioLinksData.links.length > 0,
                  )}
                  showAdd
                  addEmphasized={
                    !(
                      portfolioLinksData?.links &&
                      portfolioLinksData.links.length > 0
                    )
                  }
                >
                  <div>
                    {portfolioLinksData && portfolioLinksData.links && portfolioLinksData.links.length > 0 ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          handleEditableCardClick(event, () => {
                            setIsPortfolioLinksModalOpen(true);
                          })
                        }
                        onKeyDown={(event) =>
                          handleEditableCardKeyDown(event, () => {
                            setIsPortfolioLinksModalOpen(true);
                          })
                        }
                        className="cursor-pointer"
                      >
                        <ProfilePortfolioLinksFilled
                          data={portfolioLinksData}
                          isExpanded={isPortfolioLinksCardExpanded}
                          onToggleExpand={() => openDetailsModal('Portfolio Links Details', portfolioLinksData)}
                          onEdit={() => setIsPortfolioLinksModalOpen(true)}
                          onDelete={async () => {
                          if (await showConfirm('Are you sure you want to delete all portfolio links?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/profile/portfolio-links/${candidateId}`,
                                {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                },
                              );
                              if (!response.ok) throw new Error('Failed to delete portfolio links');
                              await refreshProfileData(candidateId);
                              showAlert('Portfolio links deleted successfully');
                            } catch (error) {
                              console.error('Error deleting portfolio links:', error);
                              showAlert(
                                error instanceof Error
                                  ? error.message
                                  : 'Error deleting portfolio links',
                              );
                            }
                          }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No portfolio links added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first portfolio link</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Certifications"
                  sectionId="certifications"
                  incomplete={isMandatorySectionMissing(
                    'CERTIFICATIONS',
                    'Certifications',
                  )}
                  onEdit={() =>
                    handleEditClick('CERTIFICATIONS', 'Certifications')
                  }
                  onAdd={() =>
                    handleAddClick('CERTIFICATIONS', 'Certifications')
                  }
                  showEdit={Boolean(
                    certificationsData?.certifications &&
                      certificationsData.certifications.length > 0,
                  )}
                  showAdd
                  addEmphasized={
                    !(
                      certificationsData?.certifications &&
                      certificationsData.certifications.length > 0
                    )
                  }
                >
                  <div>
                    {certificationsData && certificationsData.certifications && certificationsData.certifications.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {certificationsData.certifications.map((cert) => {
                          const isExpanded = isCertificationCardExpanded[cert.id] || false;
                          return (
                            <div
                              key={cert.id}
                              role="button"
                              tabIndex={0}
                              onClick={(event) =>
                                handleEditableCardClick(event, () => {
                                  setEditingCertificationId(cert.id ?? null);
                                  setIsCertificationModalOpen(true);
                                })
                              }
                              onKeyDown={(event) =>
                                handleEditableCardKeyDown(event, () => {
                                  setEditingCertificationId(cert.id ?? null);
                                  setIsCertificationModalOpen(true);
                                })
                              }
                              className="cursor-pointer"
                            >
                              <CertificationEntryPreview
                                cert={cert}
                                isExpanded={isExpanded}
                                onToggleExpand={() => openDetailsModal('Certification Details', cert)}
                                onEdit={() => {
                                  setEditingCertificationId(cert.id ?? null);
                                  setIsCertificationModalOpen(true);
                                }}
                                onDelete={async () => {
                                if (await showConfirm('Are you sure you want to delete this certification?')) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    showAlert('Candidate ID not found.');
                                    return;
                                  }
                                  try {
                                    const response = await fetch(
                                      `${API_BASE_URL}/profile/certifications/${cert.id}`,
                                      {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                      },
                                    );
                                    if (!response.ok) throw new Error('Failed to delete certification');
                                    await refreshProfileData(candidateId);
                                    showAlert('Certification deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting certification:', error);
                                    showAlert(
                                      error instanceof Error
                                        ? error.message
                                        : 'Error deleting certification',
                                    );
                                  }
                                }
                                }}
                                getDocumentName={getDocumentName}
                                resolveDocHref={resolveProfileDocHref}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No certifications added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first certification</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Accomplishments"
                  onEdit={() =>
                    handleEditClick('CERTIFICATIONS', 'Accomplishments')
                  }
                  onAdd={() =>
                    handleAddClick('CERTIFICATIONS', 'Accomplishments')
                  }
                  showEdit={Boolean(
                    accomplishmentsData?.accomplishments &&
                      accomplishmentsData.accomplishments.length > 0,
                  )}
                  showAdd
                  addEmphasized={
                    !(
                      accomplishmentsData?.accomplishments &&
                      accomplishmentsData.accomplishments.length > 0
                    )
                  }
                >
                          <div>
                    {accomplishmentsData && accomplishmentsData.accomplishments && accomplishmentsData.accomplishments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {accomplishmentsData.accomplishments.map((acc) => {
                          const isExpanded = isAccomplishmentCardExpanded[acc.id] || false;
                          return (
                            <div
                              key={acc.id}
                              role="button"
                              tabIndex={0}
                              onClick={(event) =>
                                handleEditableCardClick(event, () => {
                                  setEditingAccomplishmentId(acc.id ?? null);
                                  setIsAccomplishmentModalOpen(true);
                                })
                              }
                              onKeyDown={(event) =>
                                handleEditableCardKeyDown(event, () => {
                                  setEditingAccomplishmentId(acc.id ?? null);
                                  setIsAccomplishmentModalOpen(true);
                                })
                              }
                              className="cursor-pointer"
                            >
                              <AccomplishmentEntryPreview
                                acc={acc}
                                isExpanded={isExpanded}
                                onToggleExpand={() => openDetailsModal('Accomplishment Details', acc)}
                                onEdit={() => {
                                  setEditingAccomplishmentId(acc.id ?? null);
                                  setIsAccomplishmentModalOpen(true);
                                }}
                                onDelete={async () => {
                                if (await showConfirm('Are you sure you want to delete this accomplishment?')) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    showAlert('Candidate ID not found.');
                                    return;
                                  }
                                  try {
                                    const response = await fetch(
                                      `${API_BASE_URL}/profile/accomplishments/${acc.id}`,
                                      {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                      },
                                    );
                                    if (!response.ok) throw new Error('Failed to delete accomplishment');
                                    await refreshProfileData(candidateId);
                                    showAlert('Accomplishment deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting accomplishment:', error);
                                    showAlert(
                                      error instanceof Error
                                        ? error.message
                                        : 'Error deleting accomplishment',
                                    );
                                  }
                                }
                                }}
                                getDocumentName={getDocumentName}
                                resolveDocHref={resolveProfileDocHref}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M6.75 15.75l-1.5-1.5a2.25 2.25 0 010-3.182l1.5-1.5m4.5 0l1.5 1.5a2.25 2.25 0 010 3.182l-1.5 1.5m-4.5 0l-1.5-1.5a2.25 2.25 0 010-3.182l1.5-1.5m4.5 0l1.5 1.5a2.25 2.25 0 010 3.182l-1.5 1.5" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No accomplishments added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your first accomplishment</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </section>

              <section
                id="job-preferences"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
                <WorkspaceSectionCard
                  title="Career Preferences"
                  sectionId="career-preferences"
                  incomplete={isMandatorySectionMissing(
                    'PREFERENCES',
                    'Career Preferences',
                  )}
                  onEdit={() =>
                    handleEditClick('PREFERENCES', 'Career Preferences')
                  }
                  onAdd={() =>
                    handleAddClick('PREFERENCES', 'Career Preferences')
                  }
                  showEdit={Boolean(careerPreferencesData)}
                  showAdd
                  addEmphasized={!careerPreferencesData}
                >
                  <div>
                    {careerPreferencesData ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          handleEditableCardClick(event, () => {
                            setIsCareerPreferencesModalOpen(true);
                          })
                        }
                        onKeyDown={(event) =>
                          handleEditableCardKeyDown(event, () => {
                            setIsCareerPreferencesModalOpen(true);
                          })
                        }
                        className="cursor-pointer"
                      >
                        <ProfileCareerPreferencesFilled
                          data={careerPreferencesData as CareerPreferencesData & Record<string, unknown>}
                          isExpanded={isCareerPreferencesCardExpanded}
                          onToggleExpand={() => openDetailsModal('Career Preferences Details', careerPreferencesData)}
                          onEdit={() => setIsCareerPreferencesModalOpen(true)}
                          onDelete={async () => {
                          if (await showConfirm('Are you sure you want to delete your career preferences?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(`${API_BASE_URL}/profile/career-preferences/${candidateId}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                              });
                              if (!response.ok) throw new Error('Failed to delete career preferences');
                              await refreshProfileData(candidateId);
                              showAlert('Career preferences deleted successfully');
                            } catch (error) {
                              console.error('Error deleting career preferences:', error);
                              showAlert(error instanceof Error ? error.message : 'Error deleting career preferences');
                            }
                          }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No career preferences added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your career preferences</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </section>

              <section id="additional-details" className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4">

                <WorkspaceSectionCard
                  title="Visa & Work Authorization"
                  sectionId="visa-work-authorization"
                  incomplete={isMandatorySectionMissing(
                    'GLOBAL ELIGIBILITY',
                    'Visa & Work Authorization',
                  )}
                  onEdit={() =>
                    handleEditClick(
                      'GLOBAL ELIGIBILITY',
                      'Visa & Work Authorization',
                    )
                  }
                  onAdd={() =>
                    handleAddClick(
                      'GLOBAL ELIGIBILITY',
                      'Visa & Work Authorization',
                    )
                  }
                  showEdit={Boolean(visaWorkAuthorizationData)}
                  showAdd
                  addEmphasized={!visaWorkAuthorizationData}
                >
                  <div>
                    {visaWorkAuthorizationData ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          handleEditableCardClick(event, () => {
                            setIsVisaWorkAuthorizationModalOpen(true);
                          })
                        }
                        onKeyDown={(event) =>
                          handleEditableCardKeyDown(event, () => {
                            setIsVisaWorkAuthorizationModalOpen(true);
                          })
                        }
                        className="cursor-pointer"
                      >
                        <ProfileVisaFilled
                          data={visaWorkAuthorizationData}
                          isExpanded={isVisaCardExpanded}
                          onToggleExpand={() => openDetailsModal('Visa & Work Authorization Details', visaWorkAuthorizationData)}
                          onEdit={() => setIsVisaWorkAuthorizationModalOpen(true)}
                          onDelete={async () => {
                          if (
                            await showConfirm(
                              'Are you sure you want to delete your visa & work authorization information?',
                            )
                          ) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/profile/visa-work-authorization/${candidateId}`,
                                {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                },
                              );
                              if (!response.ok)
                                throw new Error('Failed to delete visa work authorization');
                              await refreshProfileData(candidateId);
                              showAlert('Visa & work authorization deleted successfully');
                            } catch (error) {
                              console.error('Error deleting visa work authorization:', error);
                              showAlert(
                                error instanceof Error
                                  ? error.message
                                  : 'Error deleting visa work authorization',
                              );
                            }
                          }
                          }}
                          getDocumentName={getDocumentName}
                          getApiDocumentHref={getApiDocumentHref}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No visa & work authorization information added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your visa & work authorization details</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>

                <WorkspaceSectionCard
                  title="Vaccination"
                  sectionId="vaccination"
                  incomplete={isMandatorySectionMissing(
                    'GLOBAL ELIGIBILITY',
                    'Vaccination',
                  )}
                  onEdit={() =>
                    handleEditClick('GLOBAL ELIGIBILITY', 'Vaccination')
                  }
                  onAdd={() =>
                    handleAddClick('GLOBAL ELIGIBILITY', 'Vaccination')
                  }
                  showEdit={Boolean(vaccinationData)}
                  showAdd
                  addEmphasized={!vaccinationData}
                >
                  <div>
                    {vaccinationData ? (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(event) =>
                          handleEditableCardClick(event, () => {
                            setIsVaccinationModalOpen(true);
                          })
                        }
                        onKeyDown={(event) =>
                          handleEditableCardKeyDown(event, () => {
                            setIsVaccinationModalOpen(true);
                          })
                        }
                        className="cursor-pointer"
                      >
                        <ProfileVaccinationFilled
                          data={vaccinationData}
                          isExpanded={isVaccinationCardExpanded}
                          onToggleExpand={() => openDetailsModal('Vaccination Details', vaccinationData)}
                          onEdit={() => setIsVaccinationModalOpen(true)}
                          onDelete={async () => {
                          if (await showConfirm('Are you sure you want to delete your vaccination information?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              showAlert('Candidate ID not found.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                `${API_BASE_URL}/profile/vaccination/${candidateId}`,
                                {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                },
                              );
                              if (!response.ok) throw new Error('Failed to delete vaccination');
                              await refreshProfileData(candidateId);
                              showAlert('Vaccination information deleted successfully');
                            } catch (error) {
                              console.error('Error deleting vaccination:', error);
                              showAlert(
                                error instanceof Error ? error.message : 'Error deleting vaccination',
                              );
                            }
                          }
                          }}
                          certificateHref={
                            vaccinationData.certificate
                              ? getApiDocumentHref(vaccinationData.certificate)
                              : undefined
                          }
                          certificateLabel={
                            vaccinationData.certificate
                              ? getDocumentName(vaccinationData.certificate)
                              : undefined
                          }
                        />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No vaccination information added yet</p>
                        <p className="mt-2 text-sm text-gray-500">Click "+" to add your vaccination details</p>
                      </div>
                    )}
                  </div>
                </WorkspaceSectionCard>
              </section>
            </div>
          </div>
        </div>
      </main>

      <ProfileDrawer
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, title: '', data: null })}
        title={detailModal.title || 'View Details'}
        widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      >
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
            {JSON.stringify(detailModal.data, null, 2)}
          </pre>
        </div>
      </ProfileDrawer>

      {popupState.isOpen && (
        <div className="fixed inset-0 z-[10040] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-900">{popupState.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{popupState.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              {popupState.variant === 'confirm' && (
                <button
                  type="button"
                  onClick={() => closePopup(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() => closePopup(true)}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BasicInfoModal
        isOpen={isBasicInfoModalOpen}
        onClose={() => setIsBasicInfoModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          const previousBasicInfo = basicInfoData;
          setBasicInfoData(data);

          try {
            const response = await fetch(`${API_BASE_URL}/profile/personal-info/${candidateId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });

            if (!response.ok) {
              throw new Error('Failed to save personal information');
            }

            const refreshed = await refreshProfileData(candidateId);
            if (!refreshed) {
              setBasicInfoData(data);
            }
            setIsBasicInfoModalOpen(false);
            showAlert('Personal details updated');
          } catch (error) {
            setBasicInfoData(previousBasicInfo);
            console.error('Error saving personal info:', error);
            showAlert('Error saving personal information');
          }
        }}
        initialData={basicInfoData}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryText={summaryText}
        onSummaryChange={setSummaryText}
        onSave={async () => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            const response = await fetch(`${API_BASE_URL}/profile/summary/${candidateId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ summaryText }),
            });

            if (!response.ok) {
              throw new Error('Failed to save summary');
            }

            await refreshProfileData(candidateId);
          setIsSummaryModalOpen(false);
          showAlert('Summary updated');
          } catch (error) {
            console.error('Error saving summary:', error);
            showAlert('Error saving summary');
          }
        }}
      />

      <GapExplanationModal
        isOpen={isGapExplanationModalOpen}
        onClose={() => {
          setIsGapExplanationModalOpen(false);
          setGapExplanationModalMode('edit');
          setEditingGapExplanationId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            const payload =
              gapExplanationModalMode === 'edit' &&
              (editingGapExplanationId || gapExplanationData[gapExplanationData.length - 1]?.id)
                ? {
                    ...data,
                    id:
                      editingGapExplanationId ||
                      gapExplanationData[gapExplanationData.length - 1]?.id,
                  }
                : data;
            const response = await fetch(`${API_BASE_URL}/profile/gap-explanation/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error('Failed to save gap explanation');
            }

            await refreshProfileData(candidateId);
          setIsGapExplanationModalOpen(false);
          showAlert('Gap explanation saved');
          } catch (error) {
            console.error('Error saving gap explanation:', error);
            showAlert('Error saving gap explanation');
          }
        }}
        initialData={
          gapExplanationModalMode === 'add'
            ? undefined
            : gapExplanationData.find((entry) => entry.id === editingGapExplanationId) ||
              gapExplanationData[gapExplanationData.length - 1]
        }
      />

      <WorkExperienceModal
        isOpen={isWorkExperienceModalOpen}
        onClose={() => {
          setIsWorkExperienceModalOpen(false);
          setEditingWorkExperienceId(null);
        }}
        initialData={editingWorkExperienceId ? (() => {
          // If editing a specific entry, pass only that entry
          const entryToEdit = workExperienceData?.workExperiences?.find(e => e.id === editingWorkExperienceId);
          return entryToEdit ? { workExperiences: [entryToEdit] } : undefined;
        })() : workExperienceData}
        onAddEntry={async (entry) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return null;

          try {
            // Upload documents first if any
            let documentUrls: string[] = [];
            if (entry.documents && entry.documents.length > 0) {
              const filesToUpload = entry.documents.filter(doc => doc.file instanceof File);
              if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(doc => {
                  if (doc.file instanceof File) {
                    formData.append('documents', doc.file);
                  }
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/work-experience/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json();
                  documentUrls = uploadResult.data?.documents?.map((d: any) => d.url) || [];
                } else {
                  console.warn('Failed to upload documents, continuing without them');
                }
              }

              // Include existing URLs (from database)
              const existingUrls = entry.documents
                .filter(doc => typeof doc === 'string' || (typeof doc === 'object' && doc.url && !(doc.file instanceof File)))
                .map(doc => typeof doc === 'string' ? doc : (doc as any).url);
              documentUrls = [...documentUrls, ...existingUrls];
            }

            // Save new work experience entry with document URLs
            const entryToSave = {
              ...entry,
              documents: documentUrls,
            };

            const response = await fetch(`${API_BASE_URL}/profile/work-experience/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(entryToSave),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
              console.error('❌ Work experience save error:', errorMessage, errorData);
              throw new Error(errorMessage);
            }

            const result = await response.json();
            // Return the saved entry with database ID and document URLs
            return {
              ...entry,
              id: result.data?.id || entry.id,
              documents: documentUrls.map(url => ({ id: Date.now().toString(), url, name: url.split('/').pop() || 'document' })),
            };
          } catch (error) {
            console.error('Error saving work experience entry:', error);
            throw error;
          }
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) {
            showAlert('Candidate ID not found. Please refresh the page.');
            return;
          }

          if (!data.workExperiences || data.workExperiences.length === 0) {
            // No entries to save, just close the modal
            setIsWorkExperienceModalOpen(false);
            return;
          }

          try {
            // Save all work experience entries
            for (const exp of data.workExperiences) {
              // Upload documents first if any new files
              let documentUrls: string[] = [];
              if (exp.documents && exp.documents.length > 0) {
                const filesToUpload = exp.documents.filter(doc => doc.file instanceof File);
                if (filesToUpload.length > 0) {
                  const formData = new FormData();
                  filesToUpload.forEach(doc => {
                    if (doc.file instanceof File) {
                      formData.append('documents', doc.file);
                    }
                  });

                  const uploadResponse = await fetch(`${API_BASE_URL}/profile/work-experience/documents/${candidateId}`, {
                    method: 'POST',
                    body: formData,
                  });

                  if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    documentUrls = uploadResult.data?.documents?.map((d: any) => d.url) || [];
                  } else {
                    console.warn('Failed to upload documents, continuing without them');
                  }
                }

                // Include existing URLs (from database)
                const existingUrls = exp.documents
                  .filter(doc => typeof doc === 'string' || (typeof doc === 'object' && doc.url && !(doc.file instanceof File)))
                  .map(doc => typeof doc === 'string' ? doc : (doc as any).url);
                documentUrls = [...documentUrls, ...existingUrls];
              }

              const expToSave = {
                ...exp,
                documents: documentUrls,
              };

              if (isPersistedId(exp.id)) {
                // Update existing entry
                const response = await fetch(`${API_BASE_URL}/profile/work-experience/${exp.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(expToSave),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.message || 'Failed to update work experience');
                }
              } else {
                // Create new entry (in case it wasn't saved via onAddEntry)
                const response = await fetch(`${API_BASE_URL}/profile/work-experience/${candidateId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(expToSave),
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.message || 'Failed to save work experience');
                }

                // Update the entry ID with the database ID
                const result = await response.json();
                if (result.data?.id) {
                  exp.id = result.data.id;
                }
              }
            }

            // Refresh profile data to get latest from database
            await refreshProfileData(candidateId);
          setWorkExperienceData(data);
          setIsWorkExperienceModalOpen(false);
            setEditingWorkExperienceId(null);
            showAlert('Work experience updated');
          } catch (error) {
            console.error('❌ Error saving work experience:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showAlert(`Error saving work experience: ${errorMessage}`);
          }
        }}
      />

      <InternshipModal
        isOpen={isInternshipModalOpen}
        onClose={() => {
          setIsInternshipModalOpen(false);
          setInternshipModalMode('edit');
          setEditingInternshipId(null);
        }}
        mode={internshipModalMode}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload documents first if any
            let documentUrls: string[] = [];
            if (data.documents && data.documents.length > 0) {
              const filesToUpload = data.documents.filter(doc => doc.file instanceof File);
              if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(doc => {
                  if (doc.file instanceof File) {
                    formData.append('documents', doc.file);
                  }
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/internship/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json();
                  documentUrls = uploadResult.data?.documents?.map((d: any) => d.url) || [];
                } else {
                  console.warn('Failed to upload documents, continuing without them');
                }
              }

              // Include existing URLs (from database)
              const existingUrls = data.documents
                .filter(doc => typeof doc === 'string' || (typeof doc === 'object' && doc.url && !(doc.file instanceof File)))
                .map(doc => typeof doc === 'string' ? doc : (doc as any).url);
              documentUrls = [...documentUrls, ...existingUrls];
            }

            // Save internship with document URLs
            const internshipToSave = {
              ...data,
              documents: documentUrls,
            };
            if (
              internshipModalMode === 'edit' &&
              (editingInternshipId || internshipData[internshipData.length - 1]?.id)
            ) {
              internshipToSave.id =
                editingInternshipId || internshipData[internshipData.length - 1]?.id;
            }

            const response = await fetch(`${API_BASE_URL}/profile/internship/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(internshipToSave),
            });

            if (!response.ok) {
              throw new Error('Failed to save internship');
            }

            await refreshProfileData(candidateId);
          setIsInternshipModalOpen(false);
          showAlert('Internship saved');
          } catch (error) {
            console.error('Error saving internship:', error);
            showAlert('Error saving internship');
          }
        }}
        initialData={
          internshipModalMode === 'add'
            ? undefined
            : internshipData.find((entry) => entry.id === editingInternshipId) ||
              internshipData[internshipData.length - 1]
        }
      />

      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => {
          setIsEducationModalOpen(false);
          setEditingEducationId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (candidateId) {
            try {
              // Upload documents first if any
              let documentUrls: string[] = [];
              if (data.documents && data.documents.length > 0) {
                const filesToUpload = data.documents.filter(doc => doc.file instanceof File);
                if (filesToUpload.length > 0) {
                  const formData = new FormData();
                  filesToUpload.forEach(doc => {
                    if (doc.file instanceof File) {
                      formData.append('documents', doc.file);
                    }
                  });

                  const uploadResponse = await fetch(`${API_BASE_URL}/profile/education/documents/${candidateId}`, {
                    method: 'POST',
                    body: formData,
                  });

                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    documentUrls = uploadData.data?.documents?.map((doc: any) => doc.url) || [];
                  } else {
                    throw new Error('Failed to upload documents');
                  }
                }

                // Include existing document URLs (from database)
                const existingUrls = data.documents
                  .filter(doc => doc.url && !doc.file)
                  .map(doc => doc.url!)
                  .filter(Boolean);
                documentUrls = [...documentUrls, ...existingUrls];
              }

              // Prepare education data with document URLs
              const educationData = {
                ...data,
                documents: documentUrls,
              };

              const url = isPersistedId(data.id)
                ? `${API_BASE_URL}/profile/education/${data.id}`
                : `${API_BASE_URL}/profile/education/${candidateId}`;
              const method = isPersistedId(data.id) ? 'PUT' : 'POST';

              const response = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(educationData),
              });

              if (response.ok) {
                setIsEducationModalOpen(false);
                setEditingEducationId(null);
                await refreshProfileData(candidateId);
                showAlert('Education saved');
              } else {
                showAlert('Failed to save education');
              }
            } catch (error) {
              console.error('Error saving education:', error);
              showAlert(error instanceof Error ? error.message : 'Error saving education');
            }
          }
        }}
        initialData={editingEducationId ? (() => {
          // If editing a specific entry, pass only that entry
          const entryToEdit = educationData?.educations?.find(e => e.id === editingEducationId);
          return entryToEdit;
        })() : undefined}
      />

      <AcademicAchievementModal
        isOpen={isAcademicAchievementModalOpen}
        onClose={() => {
          setIsAcademicAchievementModalOpen(false);
          setAcademicAchievementModalMode('edit');
          setEditingAcademicAchievementId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload documents first if any
            let documentUrls: string[] = [];
            if (data.documents && data.documents.length > 0) {
              const filesToUpload = data.documents.filter(doc => doc.file instanceof File);
              if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(doc => {
                  if (doc.file instanceof File) {
                    formData.append('documents', doc.file);
                  }
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/academic-achievement/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (uploadResponse.ok) {
                  const uploadData = await uploadResponse.json();
                  documentUrls = uploadData.data?.documents?.map((doc: any) => doc.url) || [];
                } else {
                  throw new Error('Failed to upload documents');
                }
              }

              // Include existing document URLs (from database)
              const existingUrls = data.documents
                .filter(doc => doc.url && !doc.file)
                .map(doc => doc.url!)
                .filter(Boolean);
              documentUrls = [...documentUrls, ...existingUrls];
            }

            // Prepare academic achievement data with document URLs
            const achievementData = {
              ...data,
              documents: documentUrls,
            };
            if (
              academicAchievementModalMode === 'edit' &&
              (editingAcademicAchievementId ||
                academicAchievementData[academicAchievementData.length - 1]?.id)
            ) {
              achievementData.id =
                editingAcademicAchievementId ||
                academicAchievementData[academicAchievementData.length - 1]?.id;
            }

            const response = await fetch(`${API_BASE_URL}/profile/academic-achievement/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(achievementData),
            });

            if (!response.ok) {
              throw new Error('Failed to save academic achievement');
            }

            await refreshProfileData(candidateId);
          setIsAcademicAchievementModalOpen(false);
          showAlert('Academic achievement saved');
          } catch (error) {
            console.error('Error saving academic achievement:', error);
            showAlert(error instanceof Error ? error.message : 'Error saving academic achievement');
          }
        }}
        initialData={
          academicAchievementModalMode === 'add'
            ? undefined
            : academicAchievementData.find(
                (entry) => entry.id === editingAcademicAchievementId
              ) || academicAchievementData[academicAchievementData.length - 1]
        }
      />

      <CompetitiveExamsModal
        isOpen={isCompetitiveExamsModalOpen}
        onClose={() => {
          setIsCompetitiveExamsModalOpen(false);
          setCompetitiveExamsModalMode('edit');
          setEditingCompetitiveExamId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload documents if there are any new files
            let documentUrls: string[] = [];
            if (data.documents && data.documents.length > 0) {
              const filesToUpload = data.documents.filter(doc => doc.file);
              const existingUrls = data.documents.filter(doc => doc.url && !doc.file).map(doc => doc.url!);

              if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(doc => {
                  if (doc.file) {
                    formData.append('documents', doc.file);
                  }
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/competitive-exam/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload documents');
                }

                const uploadResult = await uploadResponse.json();
                documentUrls = [...existingUrls, ...uploadResult.files];
              } else {
                documentUrls = existingUrls;
              }
            }

            // Save the competitive exam data with document URLs
            const saveData = {
              ...data,
              ...(competitiveExamsModalMode === 'edit' && editingCompetitiveExamId
                ? { id: editingCompetitiveExamId }
                : {}),
              documents: documentUrls,
            };

            const response = await fetch(`${API_BASE_URL}/profile/competitive-exam/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(saveData),
            });

            if (!response.ok) {
              throw new Error('Failed to save competitive exam');
            }

            await refreshProfileData(candidateId);
          setIsCompetitiveExamsModalOpen(false);
          setEditingCompetitiveExamId(null);
          showAlert('Competitive exam saved');
          } catch (error) {
            console.error('Error saving competitive exam:', error);
            showAlert('Error saving competitive exam');
          }
        }}
        initialData={
          competitiveExamsModalMode === 'add'
            ? undefined
            : competitiveExamsData.find((entry) => entry.id === editingCompetitiveExamId) ||
              competitiveExamsData[competitiveExamsData.length - 1]
        }
      />

      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (candidateId) {
            try {
              const response = await fetch(`${API_BASE_URL}/profile/skills/${candidateId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (response.ok) {
          setSkillsData(data);
          setIsSkillsModalOpen(false);
                await refreshProfileData(candidateId);
                showAlert('Skills updated');
              } else {
                showAlert('Failed to save skills');
              }
            } catch (error) {
              console.error('Error saving skills:', error);
              showAlert('Error saving skills');
            }
          }
        }}
        initialData={skillsData}
      />

      <LanguagesModal
        isOpen={isLanguagesModalOpen}
        onClose={() => setIsLanguagesModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (candidateId) {
            try {
              const postWithProxyFallback = async (url: string, options: RequestInit) => {
                try {
                  return await fetch(url, options);
                } catch (error) {
                  const fallbackUrl = `/api/proxy${url.replace(API_BASE_URL, '')}`;
                  return await fetch(fallbackUrl, options);
                }
              };

              // Upload documents for each language
              const languagesWithUploadedDocs = await Promise.all(
                data.languages.map(async (lang) => {
                  if (lang.documents && lang.documents.length > 0) {
                    const filesToUpload = lang.documents.filter(doc => doc.file);
                    if (filesToUpload.length > 0) {
                      const formData = new FormData();
                      filesToUpload.forEach(doc => {
                        if (doc.file) formData.append('documents', doc.file);
                      });

                      const uploadResponse = await postWithProxyFallback(`${API_BASE_URL}/profile/languages/documents/${candidateId}`, {
                        method: 'POST',
                        body: formData,
                      });

                      if (uploadResponse.ok) {
                        const uploadResult = await uploadResponse.json();
                        const existingDocs = lang.documents.filter(doc => doc.url).map(doc => typeof doc === 'string' ? doc : doc.url || '');
                        return {
                          ...lang,
                          documents: [...existingDocs, ...uploadResult.files],
                        };
                      }
                    }
                  }
                  return {
                    ...lang,
                    documents: lang.documents ? lang.documents.map(doc => typeof doc === 'string' ? doc : doc.url || '').filter(Boolean) : [],
                  };
                })
              );

              const response = await postWithProxyFallback(`${API_BASE_URL}/profile/languages/${candidateId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ languages: languagesWithUploadedDocs }),
              });

              if (response.ok) {
                setLanguagesData({ languages: languagesWithUploadedDocs });
          setIsLanguagesModalOpen(false);
                await refreshProfileData(candidateId);
                showAlert('Languages updated');
              } else {
                showAlert('Failed to save languages');
              }
            } catch (error) {
              console.error('Error saving languages:', error);
              showAlert('Error saving languages');
            }
          }
        }}
        initialData={languagesData}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectModalMode('edit');
          setEditingProjectId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload documents if there are any new files
            let documentUrls: string[] = [];
            if (data.documents && data.documents.length > 0) {
              const filesToUpload = data.documents.filter(doc => doc.file);
              const existingUrls = data.documents.filter(doc => doc.url && !doc.file).map(doc => doc.url!);

              if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(doc => {
                  if (doc.file) {
                    formData.append('documents', doc.file);
                  }
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/project/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json();
                  documentUrls = [...existingUrls, ...uploadResult.files];
                } else {
                  throw new Error('Failed to upload documents');
                }
              } else {
                documentUrls = existingUrls;
              }
            }

            const response = await fetch(`${API_BASE_URL}/profile/project/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...data,
                ...(projectModalMode === 'edit' && editingProjectId
                  ? { id: editingProjectId }
                  : {}),
                documents: documentUrls,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save project');
            }

            await refreshProfileData(candidateId);
          setIsProjectModalOpen(false);
          setEditingProjectId(null);
          showAlert('Project saved');
          } catch (error) {
            console.error('Error saving project:', error);
            showAlert('Error saving project');
          }
        }}
        initialData={
          projectModalMode === 'add'
            ? undefined
            : projectData.find((entry) => entry.id === editingProjectId) ||
              projectData[projectData.length - 1]
        }
      />

      <PortfolioLinksModal
        isOpen={isPortfolioLinksModalOpen}
        onClose={() => setIsPortfolioLinksModalOpen(false)}
        onSave={async (data) => {
          // This is called when closing the modal with all links
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            const normalizeUrlForCompare = (rawUrl: string) => {
              const value = rawUrl.trim();
              if (!value) return '';
              try {
                const parsed = new URL(value);
                const normalizedPath = parsed.pathname.replace(/\/+$/, '');
                return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}${parsed.search}${parsed.hash}`.toLowerCase();
              } catch {
                return value.replace(/\/+$/, '').toLowerCase();
              }
            };
            const dedupedLinks = (data.links || []).filter((item, index, arr) => {
              const key = normalizeUrlForCompare(item.url || '');
              if (!key) return true;
              return (
                arr.findIndex(
                  (candidate) =>
                    normalizeUrlForCompare(candidate.url || '') === key
                ) === index
              );
            });

            const response = await fetch(`${API_BASE_URL}/profile/portfolio-links/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ links: dedupedLinks }),
            });

            if (!response.ok) {
              throw new Error('Failed to save portfolio links');
            }

            await refreshProfileData(candidateId);
            showAlert('Portfolio links updated');
          } catch (error) {
            console.error('Error saving portfolio links:', error);
            showAlert('Error saving portfolio links');
          }
        }}
        onAddLink={async (link) => {
          // Save individual link immediately to database
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            const normalizeUrlForCompare = (rawUrl: string) => {
              const value = rawUrl.trim();
              if (!value) return '';
              try {
                const parsed = new URL(value);
                const normalizedPath = parsed.pathname.replace(/\/+$/, '');
                return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}${parsed.search}${parsed.hash}`.toLowerCase();
              } catch {
                return value.replace(/\/+$/, '').toLowerCase();
              }
            };
            // Get current links
            const currentLinks = portfolioLinksData?.links || [];
            const mergedLinks = link.id && currentLinks.some(l => l.id === link.id)
              ? currentLinks.map(l => l.id === link.id ? link : l)
              : [...currentLinks, link];
            const updatedLinks = mergedLinks.filter((item, index, arr) => {
              const key = normalizeUrlForCompare(item.url || '');
              if (!key) return true;
              return (
                arr.findIndex(
                  (candidate) =>
                    normalizeUrlForCompare(candidate.url || '') === key
                ) === index
              );
            });

            const response = await fetch(`${API_BASE_URL}/profile/portfolio-links/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ links: updatedLinks }),
            });

            if (!response.ok) {
              throw new Error('Failed to save portfolio link');
            }

            // Refresh profile data to get updated links
            await refreshProfileData(candidateId);
            showAlert('Portfolio link updated');
          } catch (error) {
            console.error('Error saving portfolio link:', error);
            showAlert('Error saving portfolio link');
          }
        }}
        initialData={portfolioLinksData}
      />

      <CertificationModal
        isOpen={isCertificationModalOpen}
        editingCertificationId={editingCertificationId}
        onClose={() => {
          setIsCertificationModalOpen(false);
          setEditingCertificationId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Process each certification and upload documents
            const processedCertifications = await Promise.all(
              data.certifications.map(async (cert) => {
                let documentUrls: string[] = [];
                
                // Upload new documents if any
                if (cert.documents && cert.documents.length > 0) {
                  const filesToUpload = cert.documents.filter(doc => doc.file instanceof File);
                  if (filesToUpload.length > 0) {
                    const formData = new FormData();
                    filesToUpload.forEach(doc => {
                      if (doc.file instanceof File) {
                        formData.append('documents', doc.file);
                      }
                    });

                    const uploadResponse = await fetch(`${API_BASE_URL}/profile/certification/documents/${candidateId}`, {
                      method: 'POST',
                      body: formData,
                    });

                    if (uploadResponse.ok) {
                      const uploadResult = await uploadResponse.json();
                      documentUrls = uploadResult.data?.documents?.map((d: any) => d.url) || [];
                    } else {
                      console.warn('Failed to upload documents, continuing without them');
                    }
                  }

                  // Include existing URLs (from database)
                  const existingUrls = cert.documents
                    .filter(doc => typeof doc === 'string' || (typeof doc === 'object' && doc.url && !(doc.file instanceof File)))
                    .map(doc => typeof doc === 'string' ? doc : (doc as any).url);
                  documentUrls = [...documentUrls, ...existingUrls];
                }

                return {
                  ...cert,
                  certificateFile: serializeMaybeFile(cert.certificateFile),
                  documents: documentUrls,
                };
              })
            );

            const payload = {
              certifications: processedCertifications,
            };

            const response = await fetch(`${API_BASE_URL}/profile/certifications/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error('Failed to save certifications');
            }

            await refreshProfileData(candidateId);
            setIsCertificationModalOpen(false);
            setEditingCertificationId(null);
            showAlert('Certifications updated');
          } catch (error) {
            console.error('Error saving certifications:', error);
            showAlert('Error saving certifications');
          }
        }}
        initialData={editingCertificationId ? (() => {
          // When editing, pass only the certification being edited
          const certToEdit = certificationsData?.certifications?.find(c => c.id === editingCertificationId);
          return certToEdit ? { certifications: [certToEdit] } : certificationsData;
        })() : certificationsData}
      />

      <AccomplishmentModal
        isOpen={isAccomplishmentModalOpen}
        onClose={() => {
          setIsAccomplishmentModalOpen(false);
          setEditingAccomplishmentId(null);
        }}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Process each accomplishment and upload documents
            const processedAccomplishments = await Promise.all(
              data.accomplishments.map(async (acc) => {
                let documentUrls: string[] = [];
                
                // Upload new documents if any
                if (acc.documents && acc.documents.length > 0) {
                  const filesToUpload = acc.documents.filter(doc => doc.file instanceof File);
                  if (filesToUpload.length > 0) {
                    const formData = new FormData();
                    filesToUpload.forEach(doc => {
                      if (doc.file instanceof File) {
                        formData.append('documents', doc.file);
                      }
                    });

                    const uploadResponse = await fetch(`${API_BASE_URL}/profile/accomplishment/documents/${candidateId}`, {
                      method: 'POST',
                      body: formData,
                    });

                    if (uploadResponse.ok) {
                      const uploadResult = await uploadResponse.json();
                      documentUrls = uploadResult.data?.documents?.map((d: any) => d.url) || [];
                    } else {
                      console.warn('Failed to upload documents, continuing without them');
                    }
                  }

                  // Include existing URLs (from database)
                  const existingUrls = acc.documents
                    .filter(doc => typeof doc === 'string' || (typeof doc === 'object' && doc.url && !(doc.file instanceof File)))
                    .map(doc => typeof doc === 'string' ? doc : (doc as any).url);
                  documentUrls = [...documentUrls, ...existingUrls];
                }

                return {
                  ...acc,
                  supportingDocument: serializeMaybeFile(acc.supportingDocument),
                  documents: documentUrls,
                };
              })
            );

            const payload = {
              accomplishments: processedAccomplishments,
            };

            const response = await fetch(`${API_BASE_URL}/profile/accomplishments/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              throw new Error('Failed to save accomplishments');
            }

            await refreshProfileData(candidateId);
            setIsAccomplishmentModalOpen(false);
            setEditingAccomplishmentId(null);
            showAlert('Accomplishments updated');
          } catch (error) {
            console.error('Error saving accomplishments:', error);
            showAlert('Error saving accomplishments');
          }
        }}
        initialData={accomplishmentsData}
        editingAccomplishmentId={editingAccomplishmentId}
      />

      <CareerPreferencesModal
        isOpen={isCareerPreferencesModalOpen}
        onClose={() => setIsCareerPreferencesModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (candidateId) {
            try {
              const response = await fetch(`${API_BASE_URL}/profile/career-preferences/${candidateId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (response.ok) {
                await refreshProfileData(candidateId);
                setCareerPreferencesSuccessMessage('');
                setIsCareerPreferencesModalOpen(false);
                showAlert('Career preferences updated');
              } else {
                showAlert('Failed to save career preferences');
              }
            } catch (error) {
              console.error('Error saving career preferences:', error);
              showAlert('Error saving career preferences');
            }
          }
        }}
        initialData={careerPreferencesData}
      />

      <VisaWorkAuthorizationModal
        isOpen={isVisaWorkAuthorizationModalOpen}
        onClose={() => setIsVisaWorkAuthorizationModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload documents if they are File objects
            const processedData = { ...data };

            // Process visaDetailsExpected documents
            if (processedData.visaDetailsExpected?.documents) {
              const documentsToUpload = processedData.visaDetailsExpected.documents.filter((doc: any) => {
                // `documents` may contain either `File` or objects like `{ file: File|string, ... }`
                return doc instanceof File || doc?.file instanceof File;
              });
              const existingDocuments = processedData.visaDetailsExpected.documents.filter((doc: any) => {
                return !(doc instanceof File || doc?.file instanceof File);
              });

              if (documentsToUpload.length > 0) {
                const formData = new FormData();
                documentsToUpload.forEach((doc: any) => {
                  const file: File | undefined = doc instanceof File ? doc : doc?.file;
                  if (file) formData.append('documents', file);
                });

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/visa-work-authorization/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload documents');
                }

                const uploadResult = await uploadResponse.json();
                processedData.visaDetailsExpected.documents = [
                  ...existingDocuments.map((doc: any) => (typeof doc === 'string' ? doc : doc.url || doc)),
                  ...uploadResult.files,
                ];
              } else {
                processedData.visaDetailsExpected.documents = existingDocuments.map((doc: any) => (typeof doc === 'string' ? doc : doc.url || doc));
              }
            }

            // Process visaEntries documents
            if (Array.isArray(processedData.visaEntries)) {
              for (const entry of processedData.visaEntries) {
                if (entry.visaDetails?.documents) {
                  const documentsToUpload = entry.visaDetails.documents.filter((doc: any) => {
                    return doc instanceof File || doc?.file instanceof File;
                  });
                  const existingDocuments = entry.visaDetails.documents.filter((doc: any) => {
                    return !(doc instanceof File || doc?.file instanceof File);
                  });

                  if (documentsToUpload.length > 0) {
                    const formData = new FormData();
                    documentsToUpload.forEach((doc: any) => {
                      const file: File | undefined = doc instanceof File ? doc : doc?.file;
                      if (file) formData.append('documents', file);
                    });

                    const uploadResponse = await fetch(`${API_BASE_URL}/profile/visa-work-authorization/documents/${candidateId}`, {
                      method: 'POST',
                      body: formData,
                    });

                    if (!uploadResponse.ok) {
                      throw new Error('Failed to upload documents');
                    }

                    const uploadResult = await uploadResponse.json();
                    entry.visaDetails.documents = [
                      ...existingDocuments.map((doc: any) => (typeof doc === 'string' ? doc : doc.url || doc)),
                      ...uploadResult.files,
                    ];
                  } else {
                    entry.visaDetails.documents = existingDocuments.map((doc: any) => (typeof doc === 'string' ? doc : doc.url || doc));
                  }
                }
              }
            }

            const response = await fetch(`${API_BASE_URL}/profile/visa-work-authorization/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(serializeVisaData(processedData)),
            });

            if (!response.ok) {
              throw new Error('Failed to save visa work authorization');
            }

            await refreshProfileData(candidateId);
          setIsVisaWorkAuthorizationModalOpen(false);
          showAlert('Visa and work authorization updated');
          } catch (error) {
            console.error('Error saving visa work authorization:', error);
            showAlert('Error saving visa work authorization');
          }
        }}
        initialData={visaWorkAuthorizationData}
      />

      <VaccinationModal
        isOpen={isVaccinationModalOpen}
        onClose={() => setIsVaccinationModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // Upload certificate if it's a File object
            let certificateUrl = null;
            if (data.certificate) {
              if (data.certificate instanceof File) {
                const formData = new FormData();
                formData.append('documents', data.certificate);

                const uploadResponse = await fetch(`${API_BASE_URL}/profile/vaccination/documents/${candidateId}`, {
                  method: 'POST',
                  body: formData,
                });

                if (!uploadResponse.ok) {
                  throw new Error('Failed to upload certificate');
                }

                const uploadResult = await uploadResponse.json();
                certificateUrl = uploadResult.files[0]; // Get the first uploaded file URL
              } else if (typeof data.certificate === 'string') {
                certificateUrl = data.certificate;
              }
            }

            const payload = {
              ...data,
              certificate: certificateUrl,
            };

            const response = await fetch(`${API_BASE_URL}/profile/vaccination/${candidateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.message || errorData.error || 'Failed to save vaccination';
              throw new Error(errorMessage);
            }

            // Try to refresh profile data, but don't fail if it errors
            try {
            await refreshProfileData(candidateId);
            } catch (refreshError) {
              console.warn('⚠️ Failed to refresh profile data after saving vaccination:', refreshError);
              // Don't throw - the save was successful, just the refresh failed
            }
            
          setIsVaccinationModalOpen(false);
          showAlert('Vaccination details updated');
          } catch (error) {
            console.error('Error saving vaccination:', error);
            showAlert(`Error saving vaccination: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
        initialData={vaccinationData}
      />

      {/* Warning Banner for Resume */}
      {isResumeModalOpen && isMandatorySectionMissing('RESUME', 'Resume') && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-60 w-full max-w-2xl px-4">
          <div className="bg-red-50 border border-red-400 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">
                  ⚠️ Upload your resume to complete your profile.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Resume is required to reach 100% profile completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onSave={async (data) => {
          const candidateId = sessionStorage.getItem('candidateId');
          if (!candidateId) return;

          try {
            // If there's a file to upload, upload it first
            if (data.file && data.file instanceof File) {
              const formData = new FormData();
              formData.append('resume', data.file);

              const uploadResponse = await fetch(`${API_BASE_URL}/profile/resume/upload/${candidateId}`, {
                method: 'POST',
                body: formData,
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload resume file');
              }

              // File uploaded successfully, the backend already saved the resume record
              await refreshProfileData(candidateId);
          setIsResumeModalOpen(false);
              showAlert('Resume uploaded');
            } else if (data.fileName && !data.file) {
              // If only fileName is provided (no new file), just update metadata
              const payload = {
                fileName: data.fileName,
                uploadedDate: data.uploadedDate || new Date().toISOString(),
              };

              const response = await fetch(`${API_BASE_URL}/profile/resume/${candidateId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                throw new Error('Failed to save resume');
              }

              await refreshProfileData(candidateId);
              setIsResumeModalOpen(false);
              showAlert('Resume updated');
            } else {
              // No file and no fileName, just close the modal
              setIsResumeModalOpen(false);
            }
          } catch (error) {
            console.error('Error saving resume:', error);
            showAlert(error instanceof Error ? error.message : 'Error saving resume');
          }
        }}
        initialData={resumeData}
      />

    </ProfilePageShell>
  );
}

