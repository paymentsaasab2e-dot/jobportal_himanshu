// components/templates/SerifClassicTemplate.tsx
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

export default function SerifClassicTemplate({ data }: Props) {
  const contactItems = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    data.contact.linkedin,
    data.contact.website,
  ].filter(Boolean) as string[]

  // Use competencies if provided, otherwise fall back to skill names
  const pills = data.competencies && data.competencies.length > 0
    ? data.competencies
    : data.skills?.map((s) => s.name) ?? []

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.name}>{data.name}</div>
        <div style={s.jobTitle}>{data.title}</div>
        <div style={s.contactLine}>
          {contactItems.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <span style={{ color: "#c8b898", margin: "0 10px" }}>·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* Two-column label / content grid */}
      <div style={s.body}>

        {data.summary && (
          <>
            <Row label="Profile">
              <p style={s.summaryQuote}>"{data.summary}"</p>
            </Row>
            <Divider />
          </>
        )}

        {data.experience && data.experience.length > 0 && (
          <>
            <Row label="Experience">
              {data.experience.map((job, i) => (
                <div key={i} style={{
                  borderBottom: i < data.experience!.length - 1 ? "1px dashed #e8e2d8" : "none",
                  paddingBottom: i < data.experience!.length - 1 ? 12 : 0,
                  marginBottom:  i < data.experience!.length - 1 ? 12 : 0,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <span style={s.jobCompany}>{job.company}</span>
                    <span style={s.jobDate}>{job.period}</span>
                  </div>
                  <div style={s.jobRole}>{job.role}</div>
                  <p style={s.jobDesc}>{job.description}</p>
                </div>
              ))}
            </Row>
            <Divider />
          </>
        )}

        {data.education && data.education.length > 0 && (
          <>
            <Row label="Education">
              {data.education.map((edu) => (
                <div key={edu.degree} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <span style={s.eduDeg}>{edu.degree}</span>
                    <span style={{ fontSize: 9.5, color: "#8a7a60" }}>{edu.year}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#8a7a60" }}>
                    {edu.school}{edu.grade ? ` · ${edu.grade}` : ""}{edu.honors ? ` · ${edu.honors}` : ""}
                  </div>
                </div>
              ))}
            </Row>
            <Divider />
          </>
        )}

        {pills.length > 0 && (
          <>
            <Row label="Competencies">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {pills.map((p) => <span key={p} style={s.pill}>{p}</span>)}
              </div>
            </Row>
            <Divider />
          </>
        )}

        {data.languages && data.languages.length > 0 && (
          <>
            <Row label="Languages">
              <div style={{ fontSize: 11, color: "#3e3428", lineHeight: 2 }}>
                {data.languages.map((l) => `${l.name} — ${l.level}`).join("  ·  ")}
              </div>
            </Row>
            <Divider />
          </>
        )}

        {data.certifications && data.certifications.length > 0 && (
          <>
            <Row label="Certifications">
              <div style={{ fontSize: 11, color: "#3e3428", lineHeight: 2 }}>
                {data.certifications.join("  ·  ")}
              </div>
            </Row>
            <Divider />
          </>
        )}

        {data.achievements && data.achievements.length > 0 && (
          <Row label="Recognition">
            {data.achievements.map((aw, i) => (
              <div key={i} style={{ fontSize: 11, color: "#3e3428", lineHeight: 2 }}>· {aw}</div>
            ))}
          </Row>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{
        fontSize: 8.5, letterSpacing: "2.5px", textTransform: "uppercase" as const,
        color: "#8a7a60", textAlign: "right" as const,
        paddingRight: 16, paddingTop: 4,
        borderRight: "1px solid #d0c8b8", lineHeight: 1.4,
      }}>
        {label}
      </div>
      <div style={{ paddingLeft: 16, paddingTop: 2 }}>{children}</div>
    </>
  )
}

function Divider() {
  return <div style={{ gridColumn: "1 / -1", height: 1, background: "#e8e2d8", margin: "12px 0" }} />
}

const s: Record<string, React.CSSProperties> = {
  wrapper:     { background: "#fdfbf7", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 11, color: "#2c2416", borderRadius: 8, overflow: "hidden", padding: "36px 42px", border: "1px solid #e8e2d8" },
  header:      { textAlign: "center", borderBottom: "2px solid #2c2416", paddingBottom: 18, marginBottom: 20 },
  name:        { fontSize: 30, fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase" as const, color: "#2c2416", lineHeight: 1.1 },
  jobTitle:    { fontSize: 13, fontStyle: "italic" as const, color: "#8a7a60", marginTop: 4, letterSpacing: "1px" },
  contactLine: { display: "flex", justifyContent: "center", flexWrap: "wrap" as const, gap: 4, marginTop: 8, fontSize: 10, color: "#8a7a60", letterSpacing: "0.5px" },
  body:        { display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "start" },
  summaryQuote:{ fontSize: 12.5, lineHeight: 1.85, color: "#3e3428", fontStyle: "italic" as const, margin: 0 },
  jobCompany:  { fontSize: 13.5, fontWeight: 600, color: "#2c2416" },
  jobDate:     { fontSize: 9.5, color: "#8a7a60", letterSpacing: "0.5px" },
  jobRole:     { fontSize: 10.5, color: "#8a7a60", marginBottom: 5 },
  jobDesc:     { fontSize: 10.5, color: "#3e3428", lineHeight: 1.7, margin: 0 },
  eduDeg:      { fontSize: 12.5, fontWeight: 600, color: "#2c2416" },
  pill:        { fontSize: 9.5, border: "1px solid #c8b898", color: "#5a4e3a", padding: "2px 10px", letterSpacing: "0.5px" },
}
