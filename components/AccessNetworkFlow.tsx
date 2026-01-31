import React, { useCallback, useState } from 'react'
import {
	ReactFlow,
	Node,
	Edge,
	addEdge,
	Connection,
	useNodesState,
	useEdgesState,
	Controls,
	MiniMap,
	Background,
	Handle,
	Position,
	NodeProps,
	EdgeProps,
	BaseEdge,
	EdgeLabelRenderer,
	getBezierPath,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AccessNode, AccessEdge } from '../types'
import { ShieldIcon, DatabaseIcon, EyeIcon } from './Icons'

// Custom Patient Node
const PatientNode: React.FC<NodeProps> = ({ data }) => {
	return (
		<div className='px-4 py-3 bg-mint rounded-2xl shadow-lg border-2 border-teal-deep'>
			<div className='flex items-center gap-3'>
				<div className='w-8 h-8 bg-teal-deep rounded-full flex items-center justify-center'>
					<span className='text-white font-bold text-sm'>Y</span>
				</div>
				<div>
					<div className='text-teal-deep font-bold text-sm'>You</div>
					<div className='text-teal-deep/70 text-xs'>Patient</div>
				</div>
			</div>
			<Handle
				type='source'
				position={Position.Top}
				className='w-3 h-3 bg-teal-deep border-2 border-white'
			/>
			<Handle
				type='source'
				position={Position.Right}
				className='w-3 h-3 bg-teal-deep border-2 border-white'
			/>
			<Handle
				type='source'
				position={Position.Bottom}
				className='w-3 h-3 bg-teal-deep border-2 border-white'
			/>
			<Handle
				type='source'
				position={Position.Left}
				className='w-3 h-3 bg-teal-deep border-2 border-white'
			/>
		</div>
	)
}

// Custom Entity Node
const EntityNode: React.FC<NodeProps> = ({ data }) => {
	const getIcon = (type: string) => {
		switch (type) {
			case 'Doctor':
				return <ShieldIcon className='w-4 h-4 text-slate-600' />
			case 'Hospital':
				return <DatabaseIcon className='w-4 h-4 text-slate-600' />
			case 'Researcher':
				return <EyeIcon className='w-4 h-4 text-slate-600' />
			default:
				return <ShieldIcon className='w-4 h-4 text-slate-600' />
		}
	}

	return (
		<div className='px-4 py-3 bg-white rounded-2xl shadow-md border border-slate-200 hover:border-mint transition-colors'>
			<div className='flex items-center gap-3'>
				<div className='w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center'>
					{getIcon(data.type)}
				</div>
				<div>
					<div className='text-slate-900 font-semibold text-sm'>
						{data.name}
					</div>
					<div className='text-slate-500 text-xs'>{data.type}</div>
				</div>
			</div>
			<Handle
				type='target'
				position={Position.Top}
				className='w-3 h-3 bg-slate-400 border-2 border-white'
			/>
			<Handle
				type='target'
				position={Position.Right}
				className='w-3 h-3 bg-slate-400 border-2 border-white'
			/>
			<Handle
				type='target'
				position={Position.Bottom}
				className='w-3 h-3 bg-slate-400 border-2 border-white'
			/>
			<Handle
				type='target'
				position={Position.Left}
				className='w-3 h-3 bg-slate-400 border-2 border-white'
			/>
		</div>
	)
}

// Custom Edge with delete button and data count
const CustomEdge: React.FC<EdgeProps> = ({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
}) => {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
	})

	const sharedCount = data?.sharedDataTypes?.length || 0
	const isActive = data?.status === 'active'

	return (
		<>
			<BaseEdge
				path={edgePath}
				style={{
					stroke: isActive ? '#0f766e' : '#94a3b8',
					strokeWidth: 2,
					strokeDasharray: isActive ? '0' : '5,5',
				}}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						pointerEvents: 'all',
					}}
					className='nodrag nopan'
				>
					<div className='flex items-center gap-2 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-200'>
						<span
							className={`text-xs font-semibold ${isActive ? 'text-teal-deep' : 'text-slate-400'}`}
						>
							{sharedCount} types
						</span>
						<button
							className='w-4 h-4 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center text-xs font-bold hover:scale-110 transition-all'
							onClick={(e) => {
								e.stopPropagation()
								// This will be handled by the parent component
								const event = new CustomEvent('deleteEdge', {
									detail: { edgeId: id },
								})
								window.dispatchEvent(event)
							}}
						>
							×
						</button>
					</div>
				</div>
			</EdgeLabelRenderer>
		</>
	)
}

const nodeTypes = {
	patient: PatientNode,
	entity: EntityNode,
}

const edgeTypes = {
	custom: CustomEdge,
}

const initialNodes: Node[] = [
	{
		id: 'patient',
		type: 'patient',
		data: { label: 'You' },
		position: { x: 300, y: 200 },
	},
	{
		id: 'doc-1',
		type: 'entity',
		data: { name: 'Dr. Smith', type: 'Doctor' },
		position: { x: 100, y: 50 },
	},
	{
		id: 'hospital-1',
		type: 'entity',
		data: { name: 'Berlin Central', type: 'Hospital' },
		position: { x: 500, y: 50 },
	},
	{
		id: 'research-1',
		type: 'entity',
		data: { name: 'CardioLife Study', type: 'Researcher' },
		position: { x: 300, y: 400 },
	},
]

const initialEdges: Edge[] = [
	{
		id: 'edge-1',
		source: 'patient',
		target: 'doc-1',
		type: 'custom',
		data: { sharedDataTypes: ['Imaging', 'Lab'], status: 'active' },
	},
	{
		id: 'edge-2',
		source: 'patient',
		target: 'hospital-1',
		type: 'custom',
		data: { sharedDataTypes: ['Imaging'], status: 'active' },
	},
]

interface AccessNetworkFlowProps {
	onEdgeClick?: (edge: Edge) => void
	className?: string
}

export const AccessNetworkFlow: React.FC<AccessNetworkFlowProps> = ({
	onEdgeClick,
	className = '',
}) => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

	const onConnect = useCallback(
		(params: Connection) => {
			const newEdge: Edge = {
				...params,
				id: `edge-${Date.now()}`,
				type: 'custom',
				data: {
					sharedDataTypes: [],
					status: 'pending',
				},
			}
			setEdges((eds) => addEdge(newEdge, eds))
		},
		[setEdges],
	)

	const onEdgeDelete = useCallback(
		(edgeId: string) => {
			setEdges((eds) => eds.filter((edge) => edge.id !== edgeId))
		},
		[setEdges],
	)

	React.useEffect(() => {
		const handleDeleteEdge = (e: CustomEvent) => {
			onEdgeDelete(e.detail.edgeId)
		}

		window.addEventListener('deleteEdge', handleDeleteEdge as EventListener)
		return () =>
			window.removeEventListener(
				'deleteEdge',
				handleDeleteEdge as EventListener,
			)
	}, [onEdgeDelete])

	return (
		<div
			className={`w-full h-[500px] bg-slate-50 rounded-2xl border border-slate-200 ${className}`}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onEdgeClick={(_, edge) => onEdgeClick?.(edge)}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				fitView
				className='bg-transparent'
			>
				<Controls className='bg-white border border-slate-200 rounded-lg shadow-sm' />
				<MiniMap
					className='bg-white border border-slate-200 rounded-lg shadow-sm'
					nodeColor='#a3ffba'
					maskColor='rgba(255, 255, 255, 0.8)'
				/>
				<Background color='#f1f5f9' gap={20} />
			</ReactFlow>
		</div>
	)
}
