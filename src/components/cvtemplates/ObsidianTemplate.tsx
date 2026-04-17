// components/templates/ObsidianTemplate.tsx
// ✅ Fully self-contained — types inlined, zero external imports.

import React from "react"

export interface ResumeData {
  name: string
  title: string
  contact: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  summary?: string
  experience?: {
    role: string
    company: string
    period: string
    description: string
    tags?: string[]
  }[]
  education?: {
    degree: string
    school: string
    year: string
    grade?: string
    honors?: string
  }[]
  skills?: { name: string; level: number }[]
  languages?: { name: string; level: string }[]
  certifications?: string[]
  achievements?: string[]
  competencies?: string[]
}

interface Props {
  data: ResumeData
}

export default function ObsidianTemplate({ data }: Props) {
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={s.wrapper}>
      <aside style={s.sidebar}>
        <div>
          <div style={s.avatar}>{initials}</div>
          <div style={s.name}>{data.name}</div>
          <div style={s.jobTag}>{data.title}</div>
        </div>

        {data.contact && Object.values(data.contact).some(Boolean) && (
          <div>
            <SideLabel>Contact</SideLabel>
            {data.contact.email    && <Dot text={data.contact.email} />}
            {data.contact.phone    && <Dot text={data.contact.phone} />}
            {data.contact.location && <Dot text={data.contact.location} />}
            {data.contact.linkedin && <Dot text={data.contact.linkedin} />}
            {data.contact.github   && <Dot text={data.contact.github} />}
            {data.contact.website  && <Dot text={data.contact.website} />}
          </div>
        )}

        {data.skills && data.skills.length > 0 && (
          <div>
            <SideLabel>Skills</SideLabel>
            {data.skills.map((skill) => (
              <div key={skill.name} style={{ marginBottom: 7 }}>
                <div style={{ fontSize: 10, color: "#c8c0b0", marginBottom: 3 }}>{skill.name}</div>
                <div style={s.barBg}>
                  <div style={{ ...s.barFill, width: `${Math.min(skill.level, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {data.languages && data.languages.length > 0 && (
          <div>
            <SideLabel>Languages</SideLabel>
            {data.languages.map((lang) => (
              <div key={lang.name} style={s.langRow}>
                <span>{lang.name}</span>
                <span style={{ color: "#c9a84c" }}>{lang.level}</span>
              </div>
            ))}
          </div>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <div>
            <SideLabel>Certifications</SideLabel>
            {data.certifications.map((cert) => <Dot key={cert} text={cert} />)}
          </div>
        )}
      </aside>

      <main style={s.main}>
        {data.summary && (
          <Section title="Summary" divider>
            <p style={s.summaryText}>{data.summary}</p>
          </Section>
        )}

        {data.experience && data.experience.length > 0 && (
          <Section title="Experience" divider>
            {data.experience.map((job, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={s.jobRole}>{job.role}</div>
                <div style={s.jobMeta}>
                  <span style={{ color: "#c9a84c" }}>{job.company}</span>
                  <span style={{ color: "#6a6258" }}>{job.period}</span>
                </div>
                <p style={s.jobDesc}>{job.description}</p>
                {job.tags && job.tags.length > 0 && (
                  <div style={{ marginTop: 5 }}>
                    {job.tags.map((tag) => <span key={tag} style={s.tag}>{tag}</span>)}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {data.education && data.education.length > 0 && (
          <Section title="Education">
            {data.education.map((edu) => (
              <div key={edu.degree} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#f0e8d0" }}>{edu.degree}</div>
                <div style={{ fontSize: 10, color: "#c9a84c" }}>{edu.school}</div>
                <div style={{ fontSize: 10, color: "#6a6258" }}>
                  {edu.year}{edu.grade ? ` · ${edu.grade}` : ""}{edu.honors ? ` · ${edu.honors}` : ""}
                </div>
              </div>
            ))}
          </Section>
        )}
      </main>
    </div>
  )
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase" as const, color: "#c9a84c", borderBottom: "1px solid #2e2920", paddingBottom: 4, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Dot({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#b0a898", fontSize: 10, marginBottom: 5 }}>
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#c9a84c", flexShrink: 0 }} />
      {text}
    </div>
  )
}

function Section({ title, children, divider }: { title: string; children: React.ReactNode; divider?: boolean }) {
  return (
    <div style={{ marginBottom: divider ? 20 : 0, paddingBottom: divider ? 16 : 0, borderBottom: divider ? "1px solid #2e2920" : "none" }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#f0e8d0", marginBottom: 4 }}>{title}</div>
      <div style={{ width: 30, height: 2, background: "#c9a84c", marginBottom: 14 }} />
      {children}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper:    { display: "flex", minHeight: 900, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12, background: "#0f0f0f", color: "#e8e0d0", borderRadius: 8, overflow: "hidden" },
  sidebar:    { width: 240, flexShrink: 0, background: "#1a1612", padding: "32px 22px", display: "flex", flexDirection: "column", gap: 22, borderRight: "1px solid #2e2920" },
  main:       { flex: 1, padding: "32px 28px" },
  avatar:     { width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#c9a84c,#8a6820)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#1a1612", marginBottom: 10 },
  name:       { fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#f0e8d0", lineHeight: 1.2 },
  jobTag:     { fontSize: 9, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#c9a84c", marginTop: 4 },
  barBg:      { height: 2, background: "#2e2920", borderRadius: 1 },
  barFill:    { height: 2, borderRadius: 1, background: "linear-gradient(90deg,#c9a84c,#e8c97a)" },
  langRow:    { display: "flex", justifyContent: "space-between", fontSize: 10, color: "#b0a898", marginBottom: 5 },
  summaryText:{ fontSize: 10, color: "#9a9280", lineHeight: 1.7, margin: 0 },
  jobRole:    { fontSize: 12, fontWeight: 500, color: "#f0e8d0" },
  jobMeta:    { display: "flex", justifyContent: "space-between", fontSize: 10, margin: "3px 0 5px" },
  jobDesc:    { fontSize: 10, color: "#9a9280", lineHeight: 1.6, margin: 0 },
  tag:        { display: "inline-block", background: "#2e2920", color: "#c9a84c", fontSize: 9, padding: "2px 8px", borderRadius: 10, margin: "3px 3px 0 0", letterSpacing: "0.5px" },
}
