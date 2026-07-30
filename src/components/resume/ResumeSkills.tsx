interface ResumeSkillsProps {
  skills: (string | { name?: string; languageName?: string; skill?: string; proficiency?: string; [key: string]: any })[];
}

function isWriteup(text: string) {
  const t = text.trim();
  return t.length > 56 || /:/.test(t) || /\.\s|[.!?]$/.test(t);
}

function splitWriteup(text: string): { title: string; body: string } {
  const colon = text.indexOf(':');
  if (colon > 0 && colon <= 56) {
    const title = text.slice(0, colon).trim();
    const body = text.slice(colon + 1).trim();
    if (title && body) return { title, body };
  }
  return { title: text.slice(0, 56).trim(), body: text };
}

export default function ResumeSkills({ skills }: ResumeSkillsProps) {
  if (!skills || skills.length === 0) return null;

  const normalizedSkills = skills
    .map((skill) => {
      if (typeof skill === 'string') return skill;
      if (typeof skill === 'object' && skill !== null) {
        return skill.name || skill.languageName || skill.skill || skill.title || String(skill);
      }
      return String(skill);
    })
    .filter((skill) => skill && skill.trim() !== '');

  if (normalizedSkills.length === 0) return null;

  const keywords = normalizedSkills.filter((s) => !isWriteup(s));
  const writeups = normalizedSkills.filter((s) => isWriteup(s));

  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b border-gray-200 pb-2 text-lg font-bold text-gray-900">Skills</h2>
      <div className="space-y-3">
        {keywords.length > 0 ? (
          <p className="text-sm leading-relaxed text-gray-700">
            {keywords.map((skill, i) => (
              <span key={skill}>
                {i > 0 ? ' · ' : ''}
                <span className="font-semibold text-gray-900">{skill}</span>
              </span>
            ))}
          </p>
        ) : null}
        {writeups.length > 0 ? (
          <div className="space-y-2.5">
            {writeups.map((skill, index) => {
              const { title, body } = splitWriteup(skill);
              return (
                <div key={index}>
                  <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                  <p className="text-sm leading-relaxed text-gray-700">{body}</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
