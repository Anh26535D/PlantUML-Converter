import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ClassNode } from './components/ClassNode';
import { PackageNode } from './components/PackageNode';
import { EditableEdge } from './components/EditableEdge';
import { Save, Plus, Trash2, X, Settings } from 'lucide-react';

const nodeTypes = {
  class: ClassNode,
  package: PackageNode,
};

const edgeTypes = {
  editable: EditableEdge,
};

const API_BASE = 'http://localhost:8000/api';

const COLORS = [
  'rgba(219, 234, 254, 0.7)', // Blue
  'rgba(220, 252, 231, 0.7)', // Green
  'rgba(254, 249, 195, 0.7)', // Yellow
  'rgba(255, 228, 230, 0.7)', // Rose
  'rgba(243, 232, 255, 0.7)', // Purple
  'rgba(255, 237, 213, 0.7)', // Orange
  'rgba(241, 245, 249, 0.7)', // Slate
  'rgba(255, 255, 255, 0.9)', // White
];

interface ContextMenuState {
  x: number;
  y: number;
  edgeId?: string;
  nodeId?: string;
  vertexIndex?: number;
  clientX: number;
  clientY: number;
}

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const { screenToFlowPosition } = useReactFlow();

  // 1. Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelRes, layoutRes] = await Promise.all([
          fetch(`${API_BASE}/model`),
          fetch(`${API_BASE}/layout`)
        ]);

        const modelData = await modelRes.json();
        const layoutData = await layoutRes.json();
        const positions = layoutData.positions || {};
        const edgePersistence = layoutData.edges || {};

        const packageNodes: any[] = [];
        const classNodes: any[] = [];
        const namespaces = new Set<string>();

        modelData.forEach((cls: any) => {
          const pkg = cls.package?.trim();
          if (pkg) namespaces.add(pkg);
        });

        // Create Package Nodes with Auto-Tiling
        const sortedNamespaces = Array.from(namespaces).sort();
        sortedNamespaces.forEach((ns, nsIndex) => {
          const saved = positions[`pkg-${ns}`] || {};
          const classesInPkg = modelData.filter((c: any) => c.package?.trim() === ns);

          if (classesInPkg.length === 0) return;

          const childrenCount = classesInPkg.length;
          const colsInPkg = 2;
          const rowsInPkg = Math.ceil(childrenCount / colsInPkg);
          const estimatedWidth = Math.max(800, colsInPkg * 400 + 100);
          const estimatedHeight = Math.max(600, rowsInPkg * 450 + 150);

          // Tile packages in a grid: 2 packages per row
          const pkgPadding = 100;
          const pkgCol = nsIndex % 2;
          const pkgRow = Math.floor(nsIndex / 2);
          const defaultX = pkgCol * (900 + pkgPadding);
          const defaultY = pkgRow * (800 + pkgPadding);

          packageNodes.push({
            id: `pkg-${ns}`,
            type: 'package',
            data: { label: ns, color: saved.color },
            position: saved.position || { x: defaultX, y: defaultY },
            style: { width: saved.width || estimatedWidth, height: saved.height || estimatedHeight },
          });

          // Place classes inside this specific package
          classesInPkg.forEach((cls: any, clsIndex: number) => {
            const classSaved = positions[cls.name] || {};
            classNodes.push({
              id: cls.name,
              type: 'class',
              parentId: `pkg-${ns}`,
              extent: 'parent',
              data: cls,
              position: classSaved.position || {
                x: 60 + (clsIndex % 2) * 380,
                y: 80 + Math.floor(clsIndex / 2) * 450
              },
            });
          });
        });

        const nodeIds = new Set(modelData.map((cls: any) => cls.name));
        const initialEdges: any[] = [];
        modelData.forEach((cls: any) => {
          const source = cls.name;
          const createEdge = (target: string, type: string, style: any = {}, marker: any = {}) => {
            if (!nodeIds.has(target)) return;
            const edgeId = `${source}-${type}-${target}`;
            initialEdges.push({
              id: edgeId,
              source, target,
              type: 'editable',
              data: { vertices: edgePersistence[edgeId]?.vertices || [] },
              markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke || '#1e293b', width: 20, height: 20 },
              style: { strokeWidth: 2, ...style },
              reconnectable: true,
              ...marker
            });
          };
          if (cls.extends) createEdge(cls.extends, 'extends');
          cls.implements?.forEach((impl: string) => createEdge(impl, 'implements', { strokeDasharray: '5,5' }));
          cls.associations?.forEach((assoc: string, i: number) => createEdge(assoc, `assoc-${i}`, { stroke: '#64748b' }));
          cls.aggregations?.forEach((agg: string, i: number) => createEdge(agg, `agg-${i}`, { stroke: '#64748b' }, { markerStart: { type: MarkerType.ArrowClosed, color: '#64748b' } }));
        });

        setNodes([...packageNodes, ...classNodes]);
        setEdges(initialEdges);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, [setNodes, setEdges]);

  // 2. Event Listeners
  useEffect(() => {
    const handleMove = (e: any) => {
      const { edgeId, vertexIndex, clientX, clientY } = e.detail;
      const { x, y } = screenToFlowPosition({ x: clientX, y: clientY });
      setEdges((eds: any[]) => eds.map((edge) => {
        if (edge.id === edgeId) {
          const newVertices = [...((edge.data?.vertices as any[]) || [])];
          newVertices[vertexIndex] = { x, y };
          return { ...edge, data: { ...edge.data, vertices: newVertices } };
        }
        return edge;
      }));
    };

    const handleHandleContextMenu = (e: any) => {
      const { edgeId, vertexIndex, clientX, clientY } = e.detail;
      setContextMenu({ x: clientX, y: clientY, edgeId, vertexIndex, clientX, clientY });
    };

    window.addEventListener('waypoint-move', handleMove);
    window.addEventListener('waypoint-context-menu', handleHandleContextMenu);
    return () => {
      window.removeEventListener('waypoint-move', handleMove);
      window.removeEventListener('waypoint-context-menu', handleHandleContextMenu);
    };
  }, [setEdges, screenToFlowPosition]);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id, clientX: event.clientX, clientY: event.clientY });
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, clientX: event.clientX, clientY: event.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const updatePackageColor = useCallback((color: string) => {
    if (!contextMenu?.nodeId) return;
    setNodes((nds) => nds.map((node) => {
      if (node.id === contextMenu.nodeId) {
        return { ...node, data: { ...node.data, color } };
      }
      return node;
    }));
    closeContextMenu();
  }, [contextMenu, setNodes, closeContextMenu]);

  const addWaypoint = useCallback(() => {
    if (!contextMenu?.edgeId) return;
    const { x, y } = screenToFlowPosition({ x: contextMenu.clientX, y: contextMenu.clientY });
    setEdges((eds: any[]) => eds.map((e) => {
      if (e.id === contextMenu.edgeId) {
        const vertices = (e.data?.vertices as any[]) || [];
        return { ...e, data: { ...e.data, vertices: [...vertices, { x, y }] } };
      }
      return e;
    }));
    closeContextMenu();
  }, [contextMenu, screenToFlowPosition, setEdges, closeContextMenu]);

  const removeWaypoint = useCallback(() => {
    if (!contextMenu?.edgeId || contextMenu.vertexIndex === undefined) return;
    setEdges((eds: any[]) => eds.map((e) => {
      if (e.id === contextMenu.edgeId) {
        const vertices = [...((e.data?.vertices as any[]) || [])];
        vertices.splice(contextMenu.vertexIndex!, 1);
        return { ...e, data: { ...e.data, vertices } };
      }
      return e;
    }));
    closeContextMenu();
  }, [contextMenu, setEdges, closeContextMenu]);

  // 3. Save Layout
  const saveLayout = async () => {
    setIsSaving(true);
    const posData = nodes.reduce<Record<string, any>>((acc, node) => {
      acc[node.id] = { position: node.position };
      if (node.type === 'package') {
        const width = node.measured?.width || (node.style?.width as number);
        const height = node.measured?.height || (node.style?.height as number);
        acc[node.id].width = width;
        acc[node.id].height = height;
        acc[node.id].color = (node.data as any).color;
      }
      return acc;
    }, {});

    const edgePersistence = edges.reduce<Record<string, any>>((acc: any, edge: any) => ({
      ...acc, [edge.id]: { vertices: (edge.data?.vertices as any[]) || [] }
    }), {});

    try {
      await fetch(`${API_BASE}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: posData, edges: edgePersistence })
      });
      alert('Architectural design saved!');
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-container" onClick={closeContextMenu}>
      <header className="main-header">
        <div className="header-content">
          <div className="title-section">
            <h1 className="title">
              <span className="icon">🌌</span> Aetheris Architect
            </h1>
            <p className="subtitle">Interactive Code Visualizer</p>
          </div>
          <button className={`save-button ${isSaving ? 'loading' : ''}`} onClick={saveLayout} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </header>

      <div className="canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds: any) => addEdge(params, eds))}
          onReconnect={(oldEdge, newConnection) => setEdges((els: any) => reconnectEdge(oldEdge, newConnection, els))}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background color="#cbd5e1" gap={20} />
        </ReactFlow>
      </div>

      {contextMenu && (
        <div
          className="custom-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.edgeId && (
            <>
              {contextMenu.vertexIndex === undefined ? (
                <div className="context-menu-item" onClick={addWaypoint}>
                  <Plus size={14} /> Add Waypoint
                </div>
              ) : (
                <div className="context-menu-item delete" onClick={removeWaypoint}>
                  <Trash2 size={14} /> Remove Waypoint
                </div>
              )}
            </>
          )}

          {contextMenu.nodeId && contextMenu.nodeId.startsWith('pkg-') && (
            <div className="context-menu-section">
              <div className="context-menu-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                <Settings size={14} /> Color
              </div>
              <div className="color-picker">
                {COLORS.map((c) => (
                  <div
                    key={c}
                    className="color-swatch"
                    style={{ backgroundColor: c }}
                    onClick={() => updatePackageColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="context-menu-item" onClick={closeContextMenu}>
            <X size={14} /> Cancel
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
