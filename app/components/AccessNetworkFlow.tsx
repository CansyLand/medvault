"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
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
import type { SharesResponse, PublicProfile, EntityRole } from "../lib/api";
import { getPublicProfiles } from "../lib/api";
import type { SharedPropertyValue } from "../hooks/useEventStream";

// Custom center node (current user's vault)
const CenterNode: React.FC<NodeProps> = ({ data }) => {
  const isPatient = data.role === "patient";
  const displayName = (data.displayName as string) || "Your Vault";
  const roleLabel = isPatient ? "Patient" : "Healthcare Provider";
  
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
          {isPatient ? (
            <HeartIcon className="w-4 h-4" style={{ color: 'white' }} />
          ) : (
            <ShieldIcon className="w-4 h-4" style={{ color: 'white' }} />
          )}
        </div>
        <div>
          <div style={{ color: 'var(--teal-deep)', fontWeight: 700, fontSize: '0.9rem' }}>
            {displayName}
          </div>
          <div style={{ color: 'var(--teal-deep)', opacity: 0.7, fontSize: '0.75rem' }}>
            {roleLabel}
          </div>
        </div>
      </div>
      {/* Source handles for outgoing connections */}
      <Handle type="source" position={Position.Top} id="source-top" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Left} id="source-left" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      {/* Target handles for incoming connections */}
      <Handle type="target" position={Position.Top} id="target-top" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Right} id="target-right" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Left} id="target-left" style={{ background: 'var(--teal-deep)', width: '10px', height: '10px' }} />
    </div>
  );
};

// Custom Entity Node (other entities in the network)
const EntityNode: React.FC<NodeProps> = ({ data }) => {
  const role = data.role as EntityRole | undefined;
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  
  const getIcon = () => {
    if (isDoctor) {
      return <ShieldIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
    }
    if (isPatient) {
      return <HeartIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
    }
    return <DatabaseIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />;
  };

  const getRoleLabel = () => {
    if (isDoctor) return data.subtitle || "Healthcare Provider";
    if (isPatient) return "Patient";
    return "Entity";
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
          background: isPatient ? 'var(--mint)' : 'var(--bg-tertiary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {getIcon()}
        </div>
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            {data.displayName as string}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {getRoleLabel()}
          </div>
          {data.organizationName && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '2px' }}>
              {data.organizationName as string}
            </div>
          )}
        </div>
      </div>
      {/* Source handles for outgoing connections */}
      <Handle type="source" position={Position.Top} id="source-top" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Right} id="source-right" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Bottom} id="source-bottom" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Left} id="source-left" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      {/* Target handles for outgoing connections */}
      <Handle type="target" position={Position.Top} id="target-top" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Right} id="target-right" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Bottom} id="target-bottom" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
      <Handle type="target" position={Position.Left} id="target-left" style={{ background: 'var(--border-light)', width: '10px', height: '10px' }} />
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
  center: CenterNode,
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
  userDisplayName?: string;
  userRole?: EntityRole | null;
}

export function AccessNetworkFlow({
  shares,
  sharedData,
  onEdgeClick,
  onRevokeShare,
  className = "",
  userDisplayName,
  userRole,
}: AccessNetworkFlowProps) {
  // Track loaded profiles for network entities
  const [entityProfiles, setEntityProfiles] = useState<Record<string, PublicProfile>>({});

  // Collect all entity IDs from shares
  const entityIds = useMemo(() => {
    const ids = new Set<string>();
    if (shares?.outgoing) {
      shares.outgoing.forEach((share) => ids.add(share.targetEntityId));
    }
    if (shares?.incoming) {
      shares.incoming.forEach((share) => ids.add(share.sourceEntityId));
    }
    return Array.from(ids);
  }, [shares]);

  // Fetch profiles for all entities in the network
  useEffect(() => {
    if (entityIds.length === 0) return;
    
    getPublicProfiles(entityIds)
      .then((profiles) => {
        setEntityProfiles(profiles);
      })
      .catch((err) => {
        console.error("Failed to fetch entity profiles:", err);
      });
  }, [entityIds]);

  // Build nodes and edges from shares data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [
      {
        id: "center",
        type: "center",
        data: { 
          displayName: userDisplayName || "Your Vault",
          role: userRole || "patient",
        },
        position: { x: 300, y: 200 },
      },
    ];

    const edges: Edge[] = [];
    const entityPositions: Record<string, { x: number; y: number }> = {};
    let entityIndex = 0;

    // Helper to get profile data for an entity
    const getEntityData = (entityId: string) => {
      const profile = entityProfiles[entityId];
      if (profile) {
        return {
          displayName: profile.displayName,
          role: profile.role,
          subtitle: profile.subtitle,
          organizationName: profile.organizationName,
        };
      }
      return {
        displayName: `Entity ${entityId.slice(0, 8)}...`,
        role: undefined,
        subtitle: undefined,
        organizationName: undefined,
      };
    };

    // Add nodes for outgoing shares
    if (shares?.outgoing) {
      const uniqueTargets = new Set<string>();
      shares.outgoing.forEach((share) => uniqueTargets.add(share.targetEntityId));
      const totalTargets = uniqueTargets.size;

      shares.outgoing.forEach((share) => {
        if (!entityPositions[share.targetEntityId]) {
          // Calculate position in a circle around the center
          const angle = (entityIndex * 2 * Math.PI) / Math.max(totalTargets, 4);
          const radius = 200;
          entityPositions[share.targetEntityId] = {
            x: 300 + radius * Math.cos(angle - Math.PI / 2),
            y: 200 + radius * Math.sin(angle - Math.PI / 2),
          };
          
          const entityData = getEntityData(share.targetEntityId);
          nodes.push({
            id: share.targetEntityId,
            type: "entity",
            data: entityData,
            position: entityPositions[share.targetEntityId],
          });
          entityIndex++;
        }

        // Add edge for this share
        const existingEdge = edges.find(
          (e) => e.source === "center" && e.target === share.targetEntityId
        );
        
        if (existingEdge) {
          // Add to existing edge's shared data types
          const types = existingEdge.data?.sharedDataTypes as string[] || [];
          types.push(share.propertyName);
          existingEdge.data = { ...existingEdge.data, sharedDataTypes: types };
        } else {
          edges.push({
            id: `edge-${share.targetEntityId}-${share.propertyName}`,
            source: "center",
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

    // Add nodes for incoming shares (data shared WITH the user)
    if (shares?.incoming) {
      const uniqueSources = new Set<string>();
      shares.incoming.forEach((share) => uniqueSources.add(share.sourceEntityId));
      
      shares.incoming.forEach((share) => {
        if (!entityPositions[share.sourceEntityId]) {
          // Position incoming shares on the opposite side
          const angle = (entityIndex * 2 * Math.PI) / Math.max(uniqueSources.size + (shares?.outgoing?.length || 0), 4);
          const radius = 200;
          entityPositions[share.sourceEntityId] = {
            x: 300 + radius * Math.cos(angle - Math.PI / 2),
            y: 200 + radius * Math.sin(angle - Math.PI / 2),
          };
          
          const entityData = getEntityData(share.sourceEntityId);
          nodes.push({
            id: share.sourceEntityId,
            type: "entity",
            data: entityData,
            position: entityPositions[share.sourceEntityId],
          });
          entityIndex++;
        }

        // Add edge for incoming share (from source to center)
        const existingEdge = edges.find(
          (e) => e.source === share.sourceEntityId && e.target === "center"
        );
        
        if (existingEdge) {
          const types = existingEdge.data?.sharedDataTypes as string[] || [];
          types.push(share.propertyName);
          existingEdge.data = { ...existingEdge.data, sharedDataTypes: types };
        } else {
          edges.push({
            id: `edge-incoming-${share.sourceEntityId}-${share.propertyName}`,
            source: share.sourceEntityId,
            target: "center",
            type: "custom",
            data: { 
              sharedDataTypes: [share.propertyName], 
              status: "active",
              sourceEntityId: share.sourceEntityId,
            },
          });
        }
      });
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [shares, entityProfiles, userDisplayName, userRole]);

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

  // Group outgoing shares by target entity for the access list
  const outgoingSharesByEntity = useMemo(() => {
    if (!shares?.outgoing) return [];
    
    const grouped: Record<string, typeof shares.outgoing> = {};
    shares.outgoing.forEach((share) => {
      if (!grouped[share.targetEntityId]) {
        grouped[share.targetEntityId] = [];
      }
      grouped[share.targetEntityId].push(share);
    });
    
    return Object.entries(grouped);
  }, [shares?.outgoing]);

  // Helper to get entity display name
  const getEntityDisplayName = (entityId: string) => {
    const profile = entityProfiles[entityId];
    if (profile) {
      return profile.displayName || `Entity ${entityId.slice(0, 8)}...`;
    }
    return `Entity ${entityId.slice(0, 8)}...`;
  };

  // Helper to get entity subtitle (organization name)
  const getEntitySubtitle = (entityId: string) => {
    const profile = entityProfiles[entityId];
    return profile?.organizationName || profile?.subtitle;
  };

  // Helper to get record title from property name
  const getRecordTitle = (propertyName: string) => {
    // Simple extraction - the full property name usually contains the title
    if (propertyName.startsWith("record:")) {
      const parts = propertyName.split(":");
      return parts[2] || propertyName;
    }
    if (propertyName.startsWith("profile:")) {
      return "Personal Master Data";
    }
    return propertyName;
  };

  return (
    <>
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
            nodeColor={(node) => node.type === 'center' ? 'var(--mint)' : 'var(--bg-primary)'}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
          <Background color="var(--border)" gap={20} />
        </ReactFlow>
      </div>

      {/* Access List - Detailed View */}
      {outgoingSharesByEntity.length > 0 && (
        <div className="access-list-section">
          <h3>Who Has Access to Your Data</h3>
          <p className="subsection-desc">
            These entities currently have access to your data. 
            You can revoke access at any time.
          </p>
          
          <div className="access-list">
            {outgoingSharesByEntity.map(([entityId, entityShares]) => {
              const entityName = getEntityDisplayName(entityId);
              const entitySubtitle = getEntitySubtitle(entityId);
              
              return (
                <div key={entityId} className="access-list-item">
                  <div className="access-list-header">
                    <div className="entity-info">
                      <span className="entity-icon">👨‍⚕️</span>
                      <div className="entity-details">
                        <span className="entity-name" title={`Entity ID: ${entityId}`}>
                          {entityName}
                        </span>
                        {entitySubtitle && (
                          <span className="entity-subtitle">{entitySubtitle}</span>
                        )}
                      </div>
                    </div>
                    <span className="share-count">
                      {entityShares.length} record{entityShares.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  
                  <div className="shared-records">
                    {entityShares.map((share) => (
                      <div key={share.propertyName} className="shared-record">
                        <span className="record-name">{getRecordTitle(share.propertyName)}</span>
                        {onRevokeShare && (
                          <button
                            className="small danger"
                            onClick={() => onRevokeShare({ 
                              targetEntityId: share.targetEntityId, 
                              propertyName: share.propertyName 
                            })}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
