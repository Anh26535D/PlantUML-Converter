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
  BackgroundVariant,
  ReactFlowProvider,
  SelectionMode,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { ClassNode } from './components/ClassNode';
import { PackageNode } from './components/PackageNode';
import { EditableEdge } from './components/EditableEdge';
import { Save, Plus, Trash2, X, Settings, Type, Download, MousePointer2, Hand } from 'lucide-react';

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

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 32, 40];

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
  const [isExporting, setIsExporting] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fontSizeTarget, setFontSizeTarget] = useState<'header' | 'fields' | 'methods'>('header');

  const { screenToFlowPosition, getNodes } = useReactFlow();

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

        const sortedNamespaces = Array.from(namespaces).sort();
        const pkgGridCols = Math.ceil(Math.sqrt(sortedNamespaces.length || 1));

        sortedNamespaces.forEach((ns, nsIndex) => {
          const saved = positions[`pkg-${ns}`] || {};
          const classesInPkg = modelData.filter((c: any) => c.package?.trim() === ns);

          if (classesInPkg.length === 0) return;

          const childrenCount = classesInPkg.length;
          const colsInPkg = Math.ceil(Math.sqrt(childrenCount || 1));
          const rowsInPkg = Math.ceil(childrenCount / colsInPkg);
          const estimatedWidth = colsInPkg * 420 + 120;
          const estimatedHeight = rowsInPkg * 500 + 150;

          const pkgCol = nsIndex % pkgGridCols;
          const pkgRow = Math.floor(nsIndex / pkgGridCols);
          const defaultX = pkgCol * 1200;
          const defaultY = pkgRow * 1100;

          packageNodes.push({
            id: `pkg-${ns}`,
            type: 'package',
            data: {
              label: ns,
              color: saved.color,
              fontSize: saved.fontSize || 18
            },
            position: saved.position || { x: defaultX, y: defaultY },
            style: { width: saved.width || estimatedWidth, height: saved.height || estimatedHeight },
            zIndex: -1,
            dragHandle: '.custom-drag-handle',
          });

          classesInPkg.forEach((cls: any, clsIndex: number) => {
            const classSaved = positions[cls.name] || {};
            classNodes.push({
              id: cls.name,
              type: 'class',
              parentId: `pkg-${ns}`,
              extent: 'parent',
              data: {
                ...cls,
                fontSize: classSaved.fontSize || 18,
                fieldFontSize: classSaved.fieldFontSize || 14,
                methodFontSize: classSaved.methodFontSize || 14,
              },
              position: classSaved.position || {
                x: 60 + (clsIndex % colsInPkg) * 420,
                y: 80 + Math.floor(clsIndex / colsInPkg) * 500
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
            const savedEdge = edgePersistence[edgeId] || {};
            initialEdges.push({
              id: edgeId,
              source, target,
              sourceHandle: savedEdge.sourceHandle || 'b2',
              targetHandle: savedEdge.targetHandle || 't2',
              type: 'editable',
              data: { vertices: savedEdge.vertices || [] },
              markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke || '#334155', width: 25, height: 25 },
              style: { strokeWidth: 3, ...style },
              reconnectable: true,
              ...marker
            });
          };
          if (cls.extends) createEdge(cls.extends, 'extends');

          cls.implements?.forEach((impl: string) =>
            createEdge(impl, 'implements', { strokeDasharray: '5,5' })
          );

          cls.associations?.forEach((assoc: string, i: number) =>
            createEdge(assoc, `assoc-${i}`, { stroke: '#475569' })
          );

          cls.aggregations?.forEach((agg: string, i: number) =>
            createEdge(agg, `agg-${i}`, { stroke: '#475569' }, {
              markerStart: { type: MarkerType.ArrowClosed, color: '#475569', width: 20, height: 20 }
            })
          );

          cls.compositions?.forEach((comp: string, i: number) =>
            createEdge(comp, `comp-${i}`, { stroke: '#1e293b', strokeWidth: 4 }, {
              markerStart: { type: MarkerType.ArrowClosed, color: '#1e293b', width: 20, height: 20 }
            })
          );

          cls.dependencies?.forEach((dep: string, i: number) =>
            createEdge(dep, `dep-${i}`, { stroke: '#94a3b8', strokeDasharray: '3,3' })
          );
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
    setFontSizeTarget('header');
  }, []);

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const clientX = 'clientX' in event ? event.clientX : (event as any).originalEvent.clientX;
    const clientY = 'clientY' in event ? event.clientY : (event as any).originalEvent.clientY;
    setContextMenu({ x: clientX, y: clientY, clientX, clientY });
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

  const updateFontSize = useCallback((fontSize: number) => {
    if (!contextMenu?.nodeId) return;
    setNodes((nds) => nds.map((node) => {
      if (node.id === contextMenu.nodeId) {
        const fieldMap: Record<string, string> = {
          header: 'fontSize',
          fields: 'fieldFontSize',
          methods: 'methodFontSize'
        };
        const key = fieldMap[fontSizeTarget] || 'fontSize';
        return { ...node, data: { ...node.data, [key]: fontSize } };
      }
      return node;
    }));
  }, [contextMenu, fontSizeTarget, setNodes]);

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

  const saveLayout = async () => {
    setIsSaving(true);
    const posData = nodes.reduce<Record<string, any>>((acc, node) => {
      const nodeData = node.data as any;
      acc[node.id] = {
        position: node.position,
        fontSize: nodeData.fontSize,
        fieldFontSize: nodeData.fieldFontSize,
        methodFontSize: nodeData.methodFontSize,
      };
      if (node.type === 'package') {
        const width = node.measured?.width || (node.style?.width as number);
        const height = node.measured?.height || (node.style?.height as number);
        acc[node.id].width = width;
        acc[node.id].height = height;
        acc[node.id].color = nodeData.color;
      }
      return acc;
    }, {});

    const edgePersistence = edges.reduce<Record<string, any>>((acc: any, edge: any) => ({
      ...acc,
      [edge.id]: {
        vertices: (edge.data?.vertices as any[]) || [],
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }
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

  const exportAsImage = async () => {
    const allNodes = getNodes();
    const selectedNodes = allNodes.filter((node) => node.selected);
    const targetNodes = selectedNodes.length > 0 ? selectedNodes : allNodes;

    if (allNodes.length === 0) return;

    setIsExporting(true);
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      setIsExporting(false);
      return;
    }

    try {
      const padding = 60;

      // Calculate bounds of target nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      targetNodes.forEach(node => {
        const x = node.position.x;
        const y = node.position.y;
        const w = node.measured?.width || (node.style?.width as number) || 200;
        const h = node.measured?.height || (node.style?.height as number) || 150;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });

      const width = maxX - minX;
      const height = maxY - minY;

      const targetIds = new Set(targetNodes.map(n => n.id));

      // For selection mode, we only want edges between selected nodes
      // For full mode, we want all edges
      const targetEdgeIds = new Set(
        edges.filter(e => {
          if (selectedNodes.length > 0) {
            return targetIds.has(e.source) && targetIds.has(e.target);
          }
          return true;
        }).map(e => e.id)
      );

      const exportConfig: any = {
        backgroundColor: '#fdfdfd',
        pixelRatio: 2,
        skipFonts: true,
        width: width + padding * 2,
        height: height + padding * 2,
        style: {
          width: `${width + padding * 2}px`,
          height: `${height + padding * 2}px`,
          transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`,
        },
        filter: (domNode: any) => {
          const id = domNode.getAttribute?.('data-id');
          const isNode = domNode.classList?.contains('react-flow__node');
          const isEdge = domNode.classList?.contains('react-flow__edge');

          if (isNode || isEdge) {
            if (selectedNodes.length > 0) {
              return targetIds.has(id) || targetEdgeIds.has(id);
            }
            return true; // Keep all if it's a full export
          }

          if (domNode.classList?.contains('react-flow__background')) return false;
          return true;
        }
      };

      const dataUrl = await toPng(viewport, exportConfig);
      const link = document.createElement('a');
      const suffix = selectedNodes.length > 0 ? 'selection' : 'full';
      link.download = `aetheris-${suffix}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
      closeContextMenu();
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
          <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
            <div className="mode-toggle" style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginRight: '8px' }}>
              <button
                className={`mode-button ${!isSelectMode ? 'active' : ''}`}
                onClick={() => setIsSelectMode(false)}
                title="Pan Mode"
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: !isSelectMode ? '#fff' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: !isSelectMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                <Hand size={16} color={!isSelectMode ? '#3b82f6' : '#64748b'} />
              </button>
              <button
                className={`mode-button ${isSelectMode ? 'active' : ''}`}
                onClick={() => setIsSelectMode(true)}
                title="Selection Mode"
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: isSelectMode ? '#fff' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: isSelectMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
              >
                <MousePointer2 size={16} color={isSelectMode ? '#3b82f6' : '#64748b'} />
              </button>
            </div>

            <button className={`save-button secondary ${isExporting ? 'loading' : ''}`} onClick={exportAsImage} disabled={isExporting} style={{ background: '#64748b' }}>
              <Download size={18} />
              {isExporting ? 'Exporting...' : nodes.some(n => n.selected) ? 'Export Selection' : 'Export Image'}
            </button>
            <button className={`save-button ${isSaving ? 'loading' : ''}`} onClick={saveLayout} disabled={isSaving}>
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Layout'}
            </button>
          </div>
        </div>
      </header>

      <div className={`canvas-wrapper ${isSelectMode ? 'selection-mode' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds: any) => addEdge(params, eds))}
          onReconnect={(oldEdge, newConnection) => setEdges((els: any) => reconnectEdge(oldEdge, newConnection, els))}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          minZoom={0.05}
          maxZoom={4}
          selectionOnDrag={isSelectMode}
          panOnDrag={isSelectMode ? [1, 2] : true}
          selectionMode={SelectionMode.Partial}
          fitView
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background variant={BackgroundVariant.Dots} color="#94a3b8" gap={25} />
        </ReactFlow>
      </div>

      {contextMenu && (
        <div
          className="custom-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {nodes.some(n => n.selected) && (
            <div className="context-menu-item" onClick={exportAsImage} style={{ borderBottom: '1px solid #eee', marginBottom: '4px', fontWeight: 'bold', color: '#3b82f6' }}>
              <Download size={14} /> Export Selection as Image
            </div>
          )}

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

          {contextMenu.nodeId && (
            <div className="context-menu-section">
              <div className="context-menu-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Type size={14} /> Font Control
              </div>

              {nodes.find(n => n.id === contextMenu.nodeId)?.type === 'class' && (
                <div className="target-selector">
                  {['header', 'fields', 'methods'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFontSizeTarget(t as any)}
                      className={`font-size-button ${fontSizeTarget === t ? 'active' : ''}`}
                      style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="font-size-picker">
                {FONT_SIZES.map((size) => {
                  const currentNode = nodes.find(n => n.id === contextMenu.nodeId);
                  const nodeData = currentNode?.data as any;
                  const currentSize = fontSizeTarget === 'header' ? (nodeData?.fontSize || 16) :
                    fontSizeTarget === 'fields' ? (nodeData?.fieldFontSize || 14) :
                      (nodeData?.methodFontSize || 14);

                  return (
                    <button
                      key={size}
                      onClick={() => updateFontSize(size)}
                      className={`font-size-button ${currentSize === size ? 'active' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {contextMenu.nodeId.startsWith('pkg-') && (
                <>
                  <div className="context-menu-label" style={{ borderTop: '1px solid #eee', marginTop: '4px' }}>
                    <Settings size={14} /> Background
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
                </>
              )}
            </div>
          )}

          <div className="context-menu-item" onClick={closeContextMenu} style={{ borderTop: '1px solid #eee', marginTop: '4px' }}>
            <X size={14} /> Close Menu
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
