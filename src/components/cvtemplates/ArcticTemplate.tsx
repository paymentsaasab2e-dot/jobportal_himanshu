// components/templates/ArcticTemplate.tsx
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

const ACCENT = "#6c63ff"
const DARK   = "#1a1a2e"

export default function ArcticTemplate({ data }: Props) {
  const contactPairs = [
    data.contact.email    && { label: "Email",    value: data.contact.email },
    data.contact.phone    && { label: "Phone",    value: data.contact.phone },
    data.contact.location && { label: "Location", value: data.contact.location },
    data.contact.github   && { label: "GitHub",   value: data.contact.github },
    data.contact.linkedin && { label: "LinkedIn", value: data.contact.linkedin },
    data.contact.website  && { label: "Website",  value: data.contact.website },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.name}>{data.name}</div>
          <div style={s.jobTitle}>{data.title}</div>
        </div>
        <div style={s.contacts}>
          {contactPairs.map((c) => (
            <div key={c.label} style={s.contactTag}>
              <span style={{ fontSize: 9, color: "#7b7baa" }}>{c.label}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: "#c8c8f0" }}>{c.value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, #48c6ef, ${ACCENT})` }} />

      {/* Body */}
      <div style={s.body}>
        <main style={s.main}>
          {data.summary && (
            <div style={s.section}>
              <div style={s.secHeading}>Profile</div>
              <p style={s.summaryText}>{data.summary}</p>
            </div>
          )}

          {data.experience && data.experience.length > 0 && (
            <div style={s.section}>
              <div style={s.secHeading}>Experience</div>
              {data.experience.map((job, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={s.dot} />
                    {i < data.experience!.length - 1 && <div style={s.line} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={s.jobRole}>{job.role}</span>
                      <span style={s.jobDate}>{job.period}</span>
                    </div>
                    <div style={s.jobCompany}>{job.company}</div>
                    <p style={s.jobDesc}>{job.description}</p>
                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                        {job.tags.map((t) => <span key={t} style={s.chip}>{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside style={s.sidebar}>
          {data.skills && data.skills.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideHeading}>Skills</div>
              {data.skills.map((skill) => {
                const filled = Math.round(skill.level / 20)
                return (
                  <div key={skill.name} style={s.skillRow}>
                    <span style={{ fontSize: 10, color: "#44445a" }}>{skill.name}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} style={{ width: 8, height: 8, borderRadius: 2, background: idx < filled ? ACCENT : "#e0e0f0" }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {data.education && data.education.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideHeading}>Education</div>
              {data.education.map((edu) => (
                <div key={edu.degree} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 500, color: DARK }}>{edu.degree}</div>
                  <div style={{ fontSize: 10, color: ACCENT }}>{edu.school}</div>
                  <div style={{ fontSize: 9, color: "#aaaacc" }}>
                    {edu.year}{edu.grade ? ` · ${edu.grade}` : ""}{edu.honors ? ` · ${edu.honors}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.achievements && data.achievements.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideHeading}>Achievements</div>
              {data.achievements.map((aw, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, background: "#eeeeff", borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: ACCENT, fontWeight: 700 }}>★</div>
                  <div style={{ fontSize: 10, color: "#44445a", lineHeight: 1.5 }}>{aw}</div>
                </div>
              ))}
            </div>
          )}

          {data.languages && data.languages.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideHeading}>Languages</div>
              {data.languages.map((lang) => (
                <div key={lang.name} style={{ fontSize: 10, color: "#44445a", lineHeight: 1.9 }}>
                  {lang.name} <span style={{ color: "#9090aa" }}>({lang.level})</span>
                </div>
              ))}
            </div>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <div style={s.sideSection}>
              <div style={s.sideHeading}>Certifications</div>
              {data.certifications.map((cert) => (
                <div key={cert} style={{ fontSize: 10, color: "#44445a", lineHeight: 1.9 }}>· {cert}</div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper:    { background: "#ffffff", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 12, color: DARK, overflow: "hidden", minHeight: 1123 },
  header:     { background: DARK, padding: "26px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 },
  name:       { fontSize: 24, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px" },
  jobTitle:   { fontSize: 10, color: "#7b7baa", marginTop: 2, letterSpacing: "1.5px", textTransform: "uppercase" as const },
  contacts:   { display: "flex", flexWrap: "wrap" as const, gap: 16, alignItems: "center" },
  contactTag: { display: "flex", flexDirection: "column" as const, alignItems: "flex-end" },
  body:       { display: "flex" },
  main:       { flex: 1, padding: "22px 26px", borderRight: "1px solid #f0f0f8" },
  sidebar:    { width: 200, padding: "22px 18px", background: "#fafafe", flexShrink: 0 },
  section:    { marginBottom: 20 },
  secHeading: { fontSize: 9, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" as const, color: ACCENT, marginBottom: 10 },
  summaryText:{ fontSize: 10.5, color: "#44445a", lineHeight: 1.75, margin: 0 },
  dot:        { width: 8, height: 8, borderRadius: "50%", border: `2px solid ${ACCENT}`, flexShrink: 0, marginTop: 3, background: "#fff" },
  line:       { flex: 1, width: 1, background: "#e0e0f0", minHeight: 30, marginTop: 2 },
  jobRole:    { fontSize: 12, fontWeight: 700, color: DARK },
  jobDate:    { fontSize: 9, color: "#9090aa" },
  jobCompany: { fontSize: 10, color: ACCENT, marginBottom: 4 },
  jobDesc:    { fontSize: 10, color: "#555570", lineHeight: 1.65, margin: 0 },
  chip:       { display: "inline-block", background: "#eeeeff", color: "#5050c0", fontSize: 8.5, padding: "2px 8px", borderRadius: 3 },
  sideSection:{ marginBottom: 18 },
  sideHeading:{ fontSize: 8.5, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase" as const, color: ACCENT, borderBottom: "1px solid #e8e8f8", paddingBottom: 4, marginBottom: 9 },
  skillRow:   { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
}
