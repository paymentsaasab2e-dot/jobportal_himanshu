import {
  formatEducationDateLine,
  formatEducationTitle,
  formatInstitutionLine,
  formatStoredGradeForDisplay,
} from '@/components/modals/EducationModal';

interface Education {
  degree: string;
  institution: string;
  institution_location?: string;
  education_level?: string;
  start_year?: string;
  start_month?: string;
  end_year?: string;
  end_month?: string;
  currently_studying?: boolean;
  specialization?: string;
  grade?: string;
}

interface ResumeEducationProps {
  educations: Education[];
}

export default function ResumeEducation({ educations }: ResumeEducationProps) {
  if (!educations || educations.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-200 pb-2">Education</h2>
      <div className="space-y-4">
        {educations.map((edu, index) => {
          const title = formatEducationTitle(edu.education_level || '', edu.degree);
          const institution = formatInstitutionLine(edu.institution, edu.institution_location);
          const dates = formatEducationDateLine(
            edu.education_level || '',
            edu.degree,
            edu.start_year || '',
            edu.start_month || '',
            edu.end_year || '',
            edu.end_month || '',
            edu.currently_studying || false,
          );

          return (
            <div key={index}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">{title}</h3>
              <p className="text-sm text-gray-800">{institution}</p>
              <p className="text-sm text-gray-600">{dates}</p>
              {edu.specialization ? (
                <p className="text-sm text-gray-500">{edu.specialization}</p>
              ) : null}
              {edu.grade ? (
                <p className="text-sm text-gray-500">Result: {formatStoredGradeForDisplay(edu.grade)}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
