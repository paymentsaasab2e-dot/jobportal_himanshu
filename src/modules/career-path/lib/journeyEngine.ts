import type {
  CareerAssessment,
  CareerCertificate,
  CareerGap,
  CareerJourney,
  CareerMilestone,
  CareerProject,
  CareerSkill,
  CareerTask,
} from '../types';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'goal';
}

function parseSkills(raw: string) {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildTasks(prefix: string, labels: string[], completedCount = 0): CareerTask[] {
  return labels.map((label, index) => ({
    id: `${prefix}-task-${index + 1}`,
    label,
    completed: index < completedCount,
  }));
}

function inferTrack(goal: string, field: string) {
  const text = `${goal} ${field}`.toLowerCase();
  if (/data scientist|data science|statistics|analytics/.test(text)) return 'data-scientist';
  if (/ai engineer|artificial intelligence|machine learning|deep learning|ml engineer/.test(text)) return 'ai-engineer';
  if (/full stack|fullstack|mern|mean/.test(text)) return 'full-stack';
  if (/frontend|front-end|react|ui engineer/.test(text)) return 'frontend';
  if (/backend|node|api engineer/.test(text)) return 'backend';
  return 'software-engineer';
}

const TRACK_TEMPLATES: Record<
  string,
  {
    gaps: string[];
    phases: Array<{ id: CareerMilestone['phase']; label: string; title: string; months: number; skills: string[]; tasks: string[] }>;
    skills: string[];
    certs: string[];
    projects: string[];
    jobRoles: string[];
    missing: string[];
  }
> = {
  'ai-engineer': {
    gaps: ['Python Advanced', 'Mathematics', 'Machine Learning', 'Deep Learning', 'Projects', 'Deployment'],
    phases: [
      { id: 'foundation', label: 'Phase 1', title: 'Programming Foundation', months: 2, skills: ['Python', 'Git', 'Problem Solving'], tasks: ['Variables & data types', 'Functions & modules', 'OOP basics', 'Advanced Python', 'APIs', 'Mini projects'] },
      { id: 'core', label: 'Phase 2', title: 'Machine Learning', months: 3, skills: ['ML Algorithms', 'Data Processing', 'Statistics'], tasks: ['Data cleaning', 'Feature engineering', 'Model training', 'Evaluation metrics', 'Scikit-learn projects'] },
      { id: 'mastery', label: 'Phase 3', title: 'AI Projects', months: 2, skills: ['Deep Learning', 'NLP', 'Deployment'], tasks: ['Build chatbot', 'Recommendation system', 'Model deployment', 'Portfolio write-up'] },
      { id: 'job-ready', label: 'Phase 4', title: 'Job Preparation', months: 1, skills: ['Resume', 'Interview', 'Portfolio'], tasks: ['Resume optimization', 'Mock interviews', 'GitHub portfolio', 'Apply to roles'] },
    ],
    skills: ['Python', 'Statistics', 'Machine Learning', 'Deep Learning', 'SQL', 'Deployment'],
    certs: ['Python Certificate', 'Machine Learning Certificate'],
    projects: ['AI Chatbot', 'Recommendation Engine', 'Predictive Analytics Dashboard'],
    jobRoles: ['Junior AI Engineer', 'ML Intern', 'AI Associate'],
    missing: ['2 production projects', 'Cloud deployment', 'System design basics'],
  },
  'full-stack': {
    gaps: ['React Advanced', 'Node.js APIs', 'Database Design', 'Authentication', 'Deployment', 'Testing'],
    phases: [
      { id: 'foundation', label: 'Phase 1', title: 'Web Foundations', months: 2, skills: ['HTML', 'CSS', 'JavaScript'], tasks: ['HTML/CSS layouts', 'JavaScript ES6+', 'DOM & fetch', 'Responsive design', 'Git workflow'] },
      { id: 'core', label: 'Phase 2', title: 'Frontend Development', months: 2, skills: ['React', 'State management', 'UI patterns'], tasks: ['React components', 'Hooks & routing', 'Forms & validation', 'API integration', 'UI project'] },
      { id: 'mastery', label: 'Phase 3', title: 'Backend & Full Stack', months: 3, skills: ['Node.js', 'Databases', 'APIs'], tasks: ['REST APIs', 'Database modeling', 'Auth & security', 'Full stack app', 'Deploy to cloud'] },
      { id: 'job-ready', label: 'Phase 4', title: 'Job Preparation', months: 1, skills: ['Portfolio', 'Interview', 'Resume'], tasks: ['Portfolio website', 'E-commerce project', 'System design prep', 'Interview practice'] },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Database', 'APIs', 'Deployment'],
    certs: ['React Certificate', 'Node.js Certificate'],
    projects: ['Portfolio Website', 'Dashboard App', 'E-commerce App'],
    jobRoles: ['Junior Full Stack Developer', 'Frontend Developer', 'Web Developer'],
    missing: ['Backend APIs', '2 portfolio projects', 'Deployment experience'],
  },
  'data-scientist': {
    gaps: ['Statistics', 'Python for Data', 'Machine Learning', 'Data Visualization', 'SQL', 'Business cases'],
    phases: [
      { id: 'foundation', label: 'Phase 1', title: 'Data Foundations', months: 2, skills: ['Python', 'Statistics', 'SQL'], tasks: ['Python for data', 'Descriptive statistics', 'SQL queries', 'Data wrangling', 'Exploratory analysis'] },
      { id: 'core', label: 'Phase 2', title: 'Machine Learning', months: 3, skills: ['ML', 'Feature engineering', 'Modeling'], tasks: ['Supervised learning', 'Unsupervised learning', 'Model evaluation', 'Cross-validation', 'Case studies'] },
      { id: 'mastery', label: 'Phase 3', title: 'Advanced Analytics', months: 2, skills: ['Deep Learning', 'NLP', 'Visualization'], tasks: ['Dashboards', 'Predictive models', 'Business storytelling', 'Capstone project'] },
      { id: 'job-ready', label: 'Phase 4', title: 'Career Launch', months: 1, skills: ['Portfolio', 'Interview', 'Resume'], tasks: ['Kaggle portfolio', 'Case study deck', 'Interview prep', 'Job applications'] },
    ],
    skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Visualization', 'Deep Learning'],
    certs: ['Data Analysis Certificate', 'Machine Learning Certificate'],
    projects: ['Sales Forecast Model', 'Customer Segmentation', 'Analytics Dashboard'],
    jobRoles: ['Junior Data Scientist', 'Data Analyst', 'ML Analyst'],
    missing: ['Statistics depth', 'End-to-end case study', 'Business communication'],
  },
  'frontend': {
    gaps: ['Advanced React', 'Performance', 'Testing', 'Accessibility', 'TypeScript', 'System design'],
    phases: [
      { id: 'foundation', label: 'Phase 1', title: 'Frontend Foundations', months: 2, skills: ['HTML', 'CSS', 'JavaScript'], tasks: ['Semantic HTML', 'CSS layouts', 'JavaScript fundamentals', 'Async JS', 'Responsive UI'] },
      { id: 'core', label: 'Phase 2', title: 'React Development', months: 2, skills: ['React', 'Hooks', 'Routing'], tasks: ['Component design', 'State management', 'API integration', 'Forms', 'React project'] },
      { id: 'mastery', label: 'Phase 3', title: 'Advanced Frontend', months: 2, skills: ['TypeScript', 'Testing', 'Performance'], tasks: ['TypeScript migration', 'Unit tests', 'Performance audit', 'Accessibility', 'Design system'] },
      { id: 'job-ready', label: 'Phase 4', title: 'Interview Ready', months: 1, skills: ['Portfolio', 'Interview', 'Resume'], tasks: ['Portfolio site', 'UI case studies', 'Mock interviews', 'Apply to roles'] },
    ],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Testing'],
    certs: ['React Certificate', 'Frontend Certificate'],
    projects: ['Portfolio Website', 'Component Library', 'Dashboard UI'],
    jobRoles: ['Junior Frontend Developer', 'UI Engineer', 'React Developer'],
    missing: ['Advanced React patterns', 'More projects', 'Performance optimization'],
  },
  'software-engineer': {
    gaps: ['Core programming', 'Data structures', 'System basics', 'Projects', 'Interview prep', 'Portfolio'],
    phases: [
      { id: 'foundation', label: 'Phase 1', title: 'Programming Foundation', months: 2, skills: ['Programming', 'Git', 'Problem solving'], tasks: ['Language basics', 'Control flow', 'Functions', 'Data structures intro', 'Git & collaboration'] },
      { id: 'core', label: 'Phase 2', title: 'Core Engineering', months: 3, skills: ['Algorithms', 'Databases', 'APIs'], tasks: ['Algorithm practice', 'Database basics', 'API design', 'Testing', 'Mid-size project'] },
      { id: 'mastery', label: 'Phase 3', title: 'Projects & Stack', months: 2, skills: ['Stack depth', 'Architecture', 'Deployment'], tasks: ['Stack specialization', 'Architecture patterns', 'CI/CD basics', 'Capstone project'] },
      { id: 'job-ready', label: 'Phase 4', title: 'Job Preparation', months: 1, skills: ['Resume', 'Interview', 'Portfolio'], tasks: ['Resume polish', 'Technical interviews', 'Behavioral prep', 'Applications'] },
    ],
    skills: ['Programming', 'Algorithms', 'Databases', 'APIs', 'Git', 'System design'],
    certs: ['Programming Certificate', 'Cloud Basics Certificate'],
    projects: ['Capstone App', 'Open Source Contribution', 'Portfolio Project'],
    jobRoles: ['Junior Developer', 'Associate Engineer', 'Graduate Engineer'],
    missing: ['More projects', 'Interview practice', 'System design'],
  },
};

function hoursToMonths(hoursPerDay: string) {
  const hours = Number.parseFloat(hoursPerDay) || 2;
  if (hours >= 4) return 6;
  if (hours >= 2) return 8;
  return 12;
}

function skillProgressMap(currentSkills: string[], templateSkills: string[]) {
  const owned = new Set(currentSkills.map((s) => s.toLowerCase()));
  return templateSkills.map((skill) => {
    const key = skill.toLowerCase();
    let progress = 15;
    if ([...owned].some((s) => key.includes(s) || s.includes(key.split(' ')[0] || ''))) progress = 55;
    if ([...owned].some((s) => s === key)) progress = 80;
    return { name: skill, progress };
  });
}

function computeProgress(milestones: CareerMilestone[]) {
  const allTasks = milestones.flatMap((m) => m.tasks);
  if (!allTasks.length) return 0;
  const done = allTasks.filter((t) => t.completed).length;
  return Math.round((done / allTasks.length) * 100);
}

function computeJobReadiness(skills: CareerSkill[], progressPercent: number, experienceLevel: string) {
  const avgSkill = skills.length ? skills.reduce((a, s) => a + s.progress, 0) / skills.length : 0;
  const expBoost = experienceLevel === 'Advanced' ? 12 : experienceLevel === 'Intermediate' ? 6 : 0;
  return Math.min(95, Math.round(progressPercent * 0.45 + avgSkill * 0.45 + expBoost));
}

export function buildCareerJourneyFromAssessment(assessment: CareerAssessment): CareerJourney {
  const track = inferTrack(assessment.careerGoal, assessment.interestedField);
  const template = TRACK_TEMPLATES[track] || TRACK_TEMPLATES['software-engineer'];
  const currentSkills = parseSkills(assessment.currentSkills);
  const now = new Date().toISOString();
  const expectedCompletionMonths = hoursToMonths(assessment.hoursPerDay);

  const milestones: CareerMilestone[] = template.phases.map((phase, index) => {
    const completedTasks = index === 0 ? Math.min(2, phase.tasks.length) : 0;
    const tasks = buildTasks(`${phase.id}`, phase.tasks, completedTasks);
    const done = tasks.filter((t) => t.completed).length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    let status: CareerMilestone['status'] = 'upcoming';
    if (index === 0 && progress >= 100) status = 'completed';
    else if (index === 0) status = 'in-progress';
    else if (index > 0 && template.phases[index - 1] && index === 1) status = 'upcoming';

    if (progress >= 100) status = 'completed';
    else if (progress > 0 || index === 0) status = 'in-progress';

    return {
      id: `${phase.id}-${slugify(phase.title)}`,
      title: phase.title,
      phase: phase.id,
      phaseLabel: phase.label,
      durationMonths: phase.months,
      skills: phase.skills,
      progress,
      status,
      tasks,
      reason: `Build ${phase.title.toLowerCase()} skills required for ${assessment.targetRole || assessment.careerGoal}.`,
    };
  });

  const skills = skillProgressMap(currentSkills, template.skills);
  const progressPercent = computeProgress(milestones);
  const jobReadinessScore = computeJobReadiness(skills, progressPercent, assessment.experienceLevel);
  const currentStage = milestones.find((m) => m.status === 'in-progress')?.title || milestones[0]?.title || 'Getting started';

  const gaps: CareerGap[] = template.gaps.map((skill, i) => ({
    skill,
    priority: i < 3 ? 'high' : i < 5 ? 'medium' : 'low',
  }));

  const certificates: CareerCertificate[] = template.certs.map((name, i) => ({
    id: `cert-${i + 1}`,
    name,
    status: i === 0 && progressPercent > 20 ? 'earned' : 'pending',
    earnedAt: i === 0 && progressPercent > 20 ? now : undefined,
  }));

  const projects: CareerProject[] = template.projects.map((title, i) => ({
    id: `proj-${i + 1}`,
    milestoneId: milestones[Math.min(2, milestones.length - 1)]?.id || 'mastery',
    title,
    description: `Suggested capstone project for your ${assessment.targetRole || assessment.careerGoal} path.`,
  }));

  return recomputeJourney({
    id: `journey-${Date.now()}`,
    goal: assessment.careerGoal,
    targetRole: assessment.targetRole || assessment.careerGoal,
    assessment,
    readinessLevel: assessment.experienceLevel,
    gaps,
    milestones,
    skills,
    certificates,
    projects,
    progressPercent,
    expectedCompletionMonths,
    currentStage,
    jobReadinessScore,
    jobReadyRoles: template.jobRoles,
    missingForJob: template.missing,
    createdAt: now,
    updatedAt: now,
  });
}

export function mergeApiRoadmapIntoJourney(journey: CareerJourney, roadmapItems: any[]): CareerJourney {
  if (!Array.isArray(roadmapItems) || !roadmapItems.length) return journey;

  const byPhase = new Map<string, any[]>();
  for (const item of roadmapItems) {
    const phase = String(item.phase || 'foundation');
    if (!byPhase.has(phase)) byPhase.set(phase, []);
    byPhase.get(phase)!.push(item);
  }

  const milestones = journey.milestones.map((milestone) => {
    const apiItems = byPhase.get(milestone.phase) || [];
    if (!apiItems.length) return milestone;

    const apiTasks: CareerTask[] = apiItems.map((item, index) => ({
      id: String(item.id || `${milestone.id}-api-${index}`),
      label: String(item.title || item.label || 'LMS milestone'),
      completed: item.status === 'completed',
    }));

    const tasks = [...milestone.tasks, ...apiTasks.filter((t) => !milestone.tasks.some((x) => x.label === t.label))];
    const done = tasks.filter((t) => t.completed).length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : milestone.progress;

    return {
      ...milestone,
      tasks,
      progress,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'in-progress' : milestone.status,
      targetRoute: apiItems[0]?.targetRoute || apiItems[0]?.resolvedTargetRoute,
    } as CareerMilestone;
  });

  const next = recomputeJourney({ ...journey, milestones });
  return next;
}

export function recomputeJourney(journey: CareerJourney): CareerJourney {
  const milestones = journey.milestones.map((m) => {
    const done = m.tasks.filter((t) => t.completed).length;
    const progress = m.tasks.length ? Math.round((done / m.tasks.length) * 100) : 0;
    let status: CareerMilestone['status'] = 'upcoming';
    if (progress >= 100) status = 'completed';
    else if (progress > 0) status = 'in-progress';
    return { ...m, progress, status };
  });

  let foundCurrent = false;
  for (const m of milestones) {
    if (m.status === 'in-progress') {
      foundCurrent = true;
      break;
    }
    if (m.status === 'upcoming' && !foundCurrent) {
      m.status = 'in-progress';
      foundCurrent = true;
    }
  }

  const progressPercent = computeProgress(milestones);
  const currentStage = milestones.find((m) => m.status === 'in-progress')?.title || milestones[0]?.title || journey.currentStage;
  const jobReadinessScore = computeJobReadiness(journey.skills, progressPercent, journey.assessment.experienceLevel);

  return {
    ...journey,
    milestones,
    progressPercent,
    currentStage,
    jobReadinessScore,
    updatedAt: new Date().toISOString(),
  };
}

export function buildMentorReply(journey: CareerJourney, question: string): string {
  const q = question.toLowerCase();
  if (/job|apply|ready|placement/.test(q)) {
    return `Your current readiness is ${journey.jobReadinessScore}%. Before applying, complete:\n\n${journey.missingForJob.map((m) => `• ${m}`).join('\n')}\n\nRecommended timeline: ${Math.max(1, Math.round(journey.expectedCompletionMonths / 3))} months at your current pace.`;
  }
  if (/skill|weak|gap|improve/.test(q)) {
    const weak = [...journey.skills].sort((a, b) => a.progress - b.progress).slice(0, 3);
    return `Focus on these areas next:\n\n${weak.map((s) => `• ${s.name} — ${s.progress}%`).join('\n')}\n\nYour gap analysis also highlights: ${journey.gaps.slice(0, 3).map((g) => g.skill).join(', ')}.`;
  }
  if (/next|milestone|step/.test(q)) {
    const next = journey.milestones.find((m) => m.status === 'in-progress');
    const nextTask = next?.tasks.find((t) => !t.completed);
    return next
      ? `You are in "${next.title}". Next task: ${nextTask?.label || 'Review milestone tasks'}. Progress on this milestone: ${next.progress}%.`
      : 'All visible milestones look complete. Move to interview prep and portfolio polish.';
  }
  return `You are on the "${journey.targetRole}" path at ${journey.progressPercent}% overall progress. Current stage: ${journey.currentStage}. Job readiness: ${journey.jobReadinessScore}%. Ask about skills, next steps, or job readiness.`;
}

export function improveJourneyGoal(journey: CareerJourney, newGoal: string): CareerJourney {
  const assessment = {
    ...journey.assessment,
    careerGoal: newGoal,
    targetRole: newGoal,
  };
  const rebuilt = buildCareerJourneyFromAssessment(assessment);
  return {
    ...rebuilt,
    id: journey.id,
    createdAt: journey.createdAt,
    projects: journey.projects.length ? journey.projects : rebuilt.projects,
    certificates: journey.certificates.length ? journey.certificates : rebuilt.certificates,
  };
}
