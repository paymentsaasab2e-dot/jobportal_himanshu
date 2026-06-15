import { create } from 'zustand'

interface MetricState {
  metrics: Record<string, number>
  activityIndex: number
  updateMetric: (key: string, value: number) => void
  tickActivity: () => void
}

export const useAppStore = create<MetricState>((set) => ({
  metrics: {
    users: 12000000,
    revenue: 340,
    accessibility: 98,
    satisfaction: 4.9,
    projects: 47,
    designSystems: 8,
  },
  activityIndex: 0,
  updateMetric: (key, value) =>
    set((state) => ({
      metrics: { ...state.metrics, [key]: value },
    })),
  tickActivity: () =>
    set((state) => ({
      activityIndex: (state.activityIndex + 1) % 10,
    })),
}))
