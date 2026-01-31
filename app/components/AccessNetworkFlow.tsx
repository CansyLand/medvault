"use client";

import React, { useCallback, useMemo } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ShieldIcon, DatabaseIcon, EyeIcon, HeartIcon } from "./Icons";
import type { SharesResponse } from "../lib/api";
import type { SharedPropertyValue } from "../hooks/useEventStream";

// Custom Patient Node (center)
const PatientNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div style={{
      padding: '12px 16px',
      background: 'var(--mint)',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)',
      border: '2px solid var(--teal-deep)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--teal-deep)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <HeartIcon className="w-4 h-4" style={{ color: 'white' }} />
        </div>
        <div>
          <div style={{ color: 'var(--teal-deep)', fontWeight: 700, fontSize: '0.9rem' }}>
            Your Vault
          </div>
          <div style={{ color: 'var(--teal-deep)', opacity: 0.7, fontSize: '0.75rem' }}>
            Patient
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Top} style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Left} style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
    </div>
  );
};

// Custom Entity Node (recipients)
const EntityNode: React.FC<NodeProps> = ({ data }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "Doctor":
        return <ShieldIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
      case "Hospital":
        return <DatabaseIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
      case "Researcher":
        return <EyeIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
      default:
        return <ShieldIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid var(--border)',
      transition: 'all 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'var(--bg-tertiary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {getIcon(data.type as string)}
        </div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            {data.name as string}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {data.type as string}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Right} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Bottom} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Left} style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
    </div>
  );
};

// Custom Edge with data count and revoke button
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
  });

  const sharedCount = (data?.sharedDataTypes as string[] | undefined)?.length || 0;
  const isActive = data?.status === "active";

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: isActive ? "var(--teal-deep)" : "var(--border-light)",
          strokeWidth: 2,
          strokeDasharray: isActive ? "0" : "5,5",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '4px 8px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)',
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isActive ? 'var(--teal-deep)' : 'var(--text-muted)',
            }}>
              {sharedCount} record{sharedCount !== 1 ? 's' : ''}
            </span>
            <button
              style={{
                width: '16px',
                height: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'var(--danger)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={(e) => {
                e.stopPropagation();
                const event = new CustomEvent("deleteEdge", { detail: { edgeId: id } });
                window.dispatchEvent(event);
              }}
            >
              ×
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = {
  patient: PatientNode,
  entity: EntityNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface AccessNetworkFlowProps {
  shares?: SharesResponse;
  sharedData?: SharedPropertyValue[];
  onEdgeClick?: (edge: Edge) => void;
  onRevokeShare?: (params: { targetEntityId: string; propertyName: string }) => void;
  className?: string;
}

export function AccessNetworkFlow({
  shares,
  sharedData,
  onEdgeClick,
  onRevokeShare,
  className = "",
}: AccessNetworkFlowProps) {
  // Build nodes and edges from shares data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "patient",
        type: "patient",
        data: { label: "Your Vault" },
        position: { x: 300, y: 200 },
      },
    ];

    const edges: Edge[] = [];
    const entityPositions: Record<string, { x: number; y: number }> = {};
    let entityIndex = 0;

    // Add nodes for outgoing shares
    if (shares?.outgoing) {
      shares.outgoing.forEach((share) => {
        if (!entityPositions[share.targetEntityId]) {
          // Calculate position in a circle around the patient
          const angle = (entityIndex * 2 * Math.PI) / Math.max(shares.outgoing.length, 4);
          const radius = 200;
          entityPositions[share.targetEntityId] = {
            x: 300 + radius * Math.cos(angle - Math.PI / 2),
            y: 200 + radius * Math.sin(angle - Math.PI / 2),
          };
          
          nodes.push({
            id: share.targetEntityId,
            type: "entity",
            data: { 
              name: `Entity ${share.targetEntityId.slice(0, 8)}...`, 
              type: "Healthcare Provider" 
            },
            position: entityPositions[share.targetEntityId],
          });
          entityIndex++;
        }

        // Add edge for this share
        const existingEdge = edges.find(
          (e) => e.source === "patient" && e.target === share.targetEntityId
        );
        
        if (existingEdge) {
          // Add to existing edge's shared data types
          const types = existingEdge.data?.sharedDataTypes as string[] || [];
          types.push(share.propertyName);
          existingEdge.data = { ...existingEdge.data, sharedDataTypes: types };
        } else {
          edges.push({
            id: `edge-${share.targetEntityId}-${share.propertyName}`,
            source: "patient",
            target: share.targetEntityId,
            type: "custom",
            data: { 
              sharedDataTypes: [share.propertyName], 
              status: "active",
              targetEntityId: share.targetEntityId,
            },
          });
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [shares]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when shares change
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: "custom",
        data: {
          sharedDataTypes: [],
          status: "pending",
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onEdgeDelete = useCallback(
    (edgeId: string) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (edge && onRevokeShare && edge.data?.targetEntityId) {
        // Revoke all shares for this entity
        const types = edge.data.sharedDataTypes as string[] || [];
        types.forEach((propertyName) => {
          onRevokeShare({ 
            targetEntityId: edge.data!.targetEntityId as string, 
            propertyName 
          });
        });
      }
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [edges, onRevokeShare, setEdges]
  );

  React.useEffect(() => {
    const handleDeleteEdge = (e: CustomEvent) => {
      onEdgeDelete(e.detail.edgeId);
    };

    window.addEventListener("deleteEdge", handleDeleteEdge as EventListener);
    return () => window.removeEventListener("deleteEdge", handleDeleteEdge as EventListener);
  }, [onEdgeDelete]);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '500px',
        background: 'var(--bg-tertiary)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
      }}
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
        style={{ background: 'transparent' }}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => node.type === 'patient' ? 'var(--mint)' : 'var(--bg-primary)'}
          maskColor="rgba(255, 255, 255, 0.8)"
        />
        <Background color="var(--border)" gap={20} />
      </ReactFlow>
    </div>
  );
}
