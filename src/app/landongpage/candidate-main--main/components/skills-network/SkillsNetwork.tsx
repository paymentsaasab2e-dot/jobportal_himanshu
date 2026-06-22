'use client'
import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useCandmainLandingContent } from '@/lib/candmain-landing'

const baseNodes: Node[] = [
  {
    id: 'center',
    position: { x: 350, y: 250 },
    data: { label: 'Candidate Evaluation Matrix' },
    type: 'default',
    style: {
      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
      color: 'white',
      border: 'none',
      borderRadius: '16px',
      padding: '16px 20px',
      fontWeight: 700,
      fontSize: '13px',
      lineHeight: 1.4,
      textAlign: 'center',
      whiteSpace: 'pre-line',
      boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
      width: 220,
    },
  },
  {
    id: 'product-strategy',
    position: { x: 80, y: 60 },
    data: { label: 'Relevant Experience' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'design-systems',
    position: { x: 600, y: 60 },
    data: { label: 'Job Skills' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'ux-research',
    position: { x: 30, y: 250 },
    data: { label: 'Career Progression' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'frontend',
    position: { x: 640, y: 250 },
    data: { label: 'Certifications' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'leadership',
    position: { x: 80, y: 430 },
    data: { label: 'Resume Quality' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'ai',
    position: { x: 600, y: 430 },
    data: { label: 'Role Alignment' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'analytics',
    position: { x: 350, y: 30 },
    data: { label: 'Leadership Potential' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'accessibility',
    position: { x: 350, y: 460 },
    data: { label: 'Communication' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(20,184,166,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'systems-thinking',
    position: { x: 190, y: 360 },
    data: { label: 'Problem Solving' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(236,72,153,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
  {
    id: 'growth',
    position: { x: 510, y: 360 },
    data: { label: 'Business Impact' },
    style: { background: 'white', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', color: '#0F172A', fontSize: '10px', lineHeight: 1.3, fontWeight: 600, padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 180, whiteSpace: 'pre-line' },
  },
]

const edgeStyle = { stroke: 'rgba(15,23,42,0.15)', strokeWidth: 1.5 }
const orangeEdge = { stroke: 'rgba(37,99,235,0.3)', strokeWidth: 1.5 }
const blueEdge = { stroke: 'rgba(29,78,216,0.3)', strokeWidth: 1.5 }

const initialEdges: Edge[] = [
  { id: 'e1', source: 'center', target: 'product-strategy', style: orangeEdge, animated: true },
  { id: 'e2', source: 'center', target: 'design-systems', style: blueEdge, animated: true },
  { id: 'e3', source: 'center', target: 'ux-research', style: orangeEdge, animated: true },
  { id: 'e4', source: 'center', target: 'frontend', style: blueEdge, animated: true },
  { id: 'e5', source: 'center', target: 'leadership', style: edgeStyle, animated: true },
  { id: 'e6', source: 'center', target: 'ai', style: edgeStyle, animated: true },
  { id: 'e7', source: 'center', target: 'analytics', style: edgeStyle, animated: true },
  { id: 'e8', source: 'center', target: 'accessibility', style: edgeStyle, animated: true },
  { id: 'e9', source: 'center', target: 'systems-thinking', style: edgeStyle, animated: true },
  { id: 'e10', source: 'center', target: 'growth', style: edgeStyle, animated: true },
  { id: 'e11', source: 'product-strategy', target: 'analytics', style: edgeStyle },
  { id: 'e12', source: 'ux-research', target: 'product-strategy', style: edgeStyle },
  { id: 'e13', source: 'design-systems', target: 'frontend', style: blueEdge },
  { id: 'e14', source: 'leadership', target: 'systems-thinking', style: edgeStyle },
  { id: 'e15', source: 'growth', target: 'analytics', style: edgeStyle },
]

export default function SkillsNetwork() {
  const content = useCandmainLandingContent()
  const s = content.skills
  const initialNodes = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        data: { label: s.nodes[node.id] ?? node.data.label },
      })),
    [s.nodes]
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  return (
    <section className="section bg-[#FAFBFC]" id="skills">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="tag-pill tag-blue inline-flex mb-4">
            <span>{s.tag}</span>
          </div>
          <h2 className="text-display-xl text-text-primary mb-4">
            {s.title}{' '}
            <span className="gradient-text-blue">{s.titleAccent}</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">{s.subtitle}</p>
        </motion.div>

        {/* React Flow Graph */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl overflow-hidden border border-[rgba(15,23,42,0.08)] shadow-premium bg-white"
          style={{ height: '540px' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnScroll={false}
            zoomOnScroll={false}
            preventScrolling={false}
          >
            <Background color="rgba(15,23,42,0.04)" gap={24} size={1} />
            <Controls
              className="!border-[rgba(15,23,42,0.08)] !shadow-card !rounded-xl !overflow-hidden"
              showInteractive={false}
            />
          </ReactFlow>
        </motion.div>

        <p className="text-center text-xs text-text-muted mt-4">{s.footer}</p>
      </div>
    </section>
  )
}
