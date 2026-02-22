import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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
import {
  Save,
  Download,
  MousePointer2,
  Hand,
  Code,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Type,
  Plus,
  Trash2,
  Zap
} from 'lucide-react';
import { parseAML, generateAML } from './utils/aml-logic';
import { getLayoutedElements } from './utils/layout';

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

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [amlCode, setAmlCode] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'error' | 'syncing'>('synced');
  const [contextMenu, setContextMenu] = useState<any>(null);
  const [fontSizeTarget, setFontSizeTarget] = useState<'header' | 'fields' | 'methods'>('header');

  const { screenToFlowPosition, setViewport, fitView } = useReactFlow();

  const isUpdatingFromCode = useRef(false);
  const isEditingCode = useRef(false);

  // 1. Initial Load from model.json and layout.json
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [modelRes, layoutRes] = await Promise.all([
          fetch(`${API_BASE}/model`),
          fetch(`${API_BASE}/layout`)
        ]);

        const modelData = await modelRes.json();
        const layoutData = await layoutRes.json();
        const positions = layoutData.positions || {};
        const hasSavedPositions = Object.keys(positions).length > 0;

        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        const packageNodes: Record<string, Node> = {};

        // Process Packages
        modelData.forEach((cls: any) => {
          if (cls.package && !packageNodes[cls.package]) {
            const pkgId = `pkg-${cls.package}`;
            const pkgLayout = positions[pkgId] || {};
            packageNodes[cls.package] = {
              id: pkgId,
              type: 'package',
              position: pkgLayout.position || { x: 50, y: 50 },
              style: { width: pkgLayout.width || 500, height: pkgLayout.height || 400 },
              data: {
                label: cls.package,
                color: pkgLayout.color || COLORS[Object.keys(packageNodes).length % COLORS.length]
              },
              zIndex: -1,
              dragHandle: '.package-header',
            };
            initialNodes.push(packageNodes[cls.package]);
          }
        });

        // Process Classes
        modelData.forEach((cls: any) => {
          const layout = positions[cls.name] || {};
          initialNodes.push({
            id: cls.name,
            type: 'class',
            position: layout.position || { x: 100, y: 100 },
            parentId: cls.package ? `pkg-${cls.package}` : undefined,
            extent: cls.package ? 'parent' : undefined,
            dragHandle: '.node-header',
            data: {
              ...cls,
              label: cls.name,
              fontSize: layout.fontSize || 18,
              fieldFontSize: layout.fieldFontSize || 14,
              methodFontSize: layout.methodFontSize || 14
            },
          });

          // Edges extraction
          const relations = [
            ...(cls.extends ? [{ target: cls.extends, type: 'inheritance', op: '--|>' }] : []),
            ...(cls.implements?.map((i: string) => ({ target: i, type: 'realization', op: '..|>' })) || []),
            ...(cls.associations?.map((a: string) => ({ target: a, type: 'association', op: '->' })) || []),
            ...(cls.aggregations?.map((a: string) => ({ target: a, type: 'aggregation', op: 'o--' })) || []),
            ...(cls.compositions?.map((c: string) => ({ target: c, type: 'composition', op: '*--' })) || []),
            ...(cls.dependencies?.map((d: string) => ({ target: d, type: 'dependency', op: '..>' })) || [])
          ];

          relations.forEach((rel: any) => {
            const edgeId = `e-${cls.name}-${rel.target}-${rel.type}`;
            const edgeLayout = positions[edgeId] || {};

            initialEdges.push({
              id: edgeId,
              source: cls.name,
              target: rel.target,
              type: 'editable',
              data: {
                label: rel.type,
                vertices: edgeLayout.vertices || []
              },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b' },
              style: {
                strokeWidth: 2,
                stroke: '#1e293b',
                strokeDasharray: (rel.op.includes('..') || rel.type === 'dependency') ? '5,5' : '0'
              }
            });
          });
        });

        if (!hasSavedPositions) {
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          setAmlCode(generateAML(layoutedNodes, layoutedEdges));
        } else {
          setNodes(initialNodes);
          setEdges(initialEdges);
          setAmlCode(generateAML(initialNodes, initialEdges));
        }

        if (layoutData.viewport) {
          setViewport(layoutData.viewport);
        }
      } catch (e) {
        console.error('Failed to load chart data:', e);
      }
    };
    loadInitialData();
  }, [setNodes, setEdges, setViewport]);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    setTimeout(() => fitView(), 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // 2. SYNC: Code -> Diagram
  const handleAmlChange = (newCode: string) => {
    setAmlCode(newCode);
    setSyncStatus('syncing');

    try {
      isUpdatingFromCode.current = true;
      const { nodes: parsedNodes, edges: parsedEdges } = parseAML(newCode);

      const updatedNodes = parsedNodes.map(pn => {
        const existing = nodes.find(n => n.id === pn.id);
        if (existing) {
          return {
            ...pn,
            position: existing.position,
            style: existing.style,
            data: { ...pn.data, color: existing.data.color, fontSize: existing.data.fontSize }
          };
        }
        return pn;
      });

      setNodes(updatedNodes);
      setEdges(parsedEdges);
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setTimeout(() => {
        isUpdatingFromCode.current = false;
      }, 200);
    }
  };

  // 3. SYNC: Diagram -> Code
  useEffect(() => {
    if (isUpdatingFromCode.current || isEditingCode.current) return;

    const debounce = setTimeout(() => {
      const currentAML = generateAML(nodes, edges);
      if (currentAML && currentAML !== amlCode) {
        setAmlCode(currentAML);
      }
    }, 1500);

    return () => clearTimeout(debounce);
  }, [nodes, edges, amlCode]);

  // 7. Drag and Drop from Palette
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `New${type}${Date.now()}`,
        type: type === 'package' ? 'package' : 'class',
        position,
        data: {
          label: `New${type}`,
          type: type === 'package' ? undefined : type,
          fields: [],
          methods: []
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const saveLayout = async () => {
    setIsSaving(true);
    try {
      const posData: Record<string, any> = {};
      nodes.forEach(node => {
        posData[node.id] = {
          position: node.position,
          width: node.measured?.width || (node.style?.width as number),
          height: node.measured?.height || (node.style?.height as number),
          color: node.data.color,
          fontSize: node.data.fontSize,
          fieldFontSize: node.data.fieldFontSize,
          methodFontSize: node.data.methodFontSize
        };
      });

      edges.forEach(edge => {
        if (edge.data?.vertices) {
          posData[edge.id] = { vertices: edge.data.vertices };
        }
      });

      await fetch(`${API_BASE}/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: posData }),
      });
    } catch (e) {
      alert('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsImage = async () => {
    setIsExporting(true);
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) return;

    try {
      const dataUrl = await toPng(viewport, { backgroundColor: '#fdfdfd', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `architecture-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id, type: 'node', clientX: event.clientX, clientY: event.clientY });
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id, type: 'edge', clientX: event.clientX, clientY: event.clientY });
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, type: 'pane', clientX: event.clientX, clientY: event.clientY });
  }, []);

  const addWaypoint = useCallback(() => {
    if (!contextMenu?.edgeId) return;
    const { x, y } = screenToFlowPosition({ x: contextMenu.clientX, y: contextMenu.clientY });
    setEdges(eds => eds.map(e => e.id === contextMenu.edgeId ? { ...e, data: { ...e.data, vertices: [...((e.data?.vertices as any[]) || []), { x, y }] } } : e));
    setContextMenu(null);
  }, [contextMenu, screenToFlowPosition, setEdges]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="brand">
            <span className="brand-icon">🌌</span>
            <div className="brand-text">
              <h1>Aetheris Architect</h1>
              <p>State-of-the-art Architectural Visualizer</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className={`action-btn secondary ${showCode ? 'active' : ''}`}
            onClick={() => setShowCode(!showCode)}
          >
            <Code size={18} />
            {showCode ? 'Hide Editor' : 'Show Editor'}
          </button>

          <div className="mode-toggle">
            <button
              className={`mode-btn ${!isSelectMode ? 'active' : ''}`}
              onClick={() => setIsSelectMode(false)}
            >
              <Hand size={18} />
              Pan
            </button>
            <button
              className={`mode-btn ${isSelectMode ? 'active' : ''}`}
              onClick={() => setIsSelectMode(true)}
            >
              <MousePointer2 size={18} />
              Select
            </button>
          </div>

          <button className="action-btn secondary" onClick={onLayout}>
            <Zap size={18} />
            Auto Layout
          </button>

          <button className="action-btn secondary" onClick={exportAsImage} disabled={isExporting}>
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>

          <button className="action-btn primary" onClick={saveLayout} disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Layout'}
          </button>
        </div>
      </header>

      <main className="app-main">
        {showCode && (
          <aside className="code-panel">
            <div className="code-panel-header">
              <div className="code-panel-title">
                <Code size={16} />
                AML Editor
              </div>
              <div className={`sync-indicator ${syncStatus}`}>
                {syncStatus === 'synced' && <><CheckCircle2 size={14} /> Synced</>}
                {syncStatus === 'syncing' && <>Syncing...</>}
                {syncStatus === 'error' && <><AlertCircle size={14} /> Syntax Error</>}
              </div>
            </div>

            <div className="aml-editor-container">
              <textarea
                className="aml-editor"
                value={amlCode}
                onFocus={() => isEditingCode.current = true}
                onBlur={() => isEditingCode.current = false}
                onChange={(e) => handleAmlChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newValue = amlCode.substring(0, start) + '    ' + amlCode.substring(end);
                    setAmlCode(newValue);

                    // Force the cursor to stay after the inserted spaces
                    const target = e.currentTarget;
                    requestAnimationFrame(() => {
                      target.selectionStart = target.selectionEnd = start + 4;
                    });
                  }
                }}
                spellCheck={false}
              />
            </div>

            <div className="component-palette">
              <div className="palette-title">
                <LayoutDashboard size={12} />
                Component Palette
              </div>
              <div className="palette-items">
                <div className="palette-item" onDragStart={(e) => onDragStart(e, 'class')} draggable>
                  <Type size={14} /> Class
                </div>
                <div className="palette-item" onDragStart={(e) => onDragStart(e, 'interface')} draggable>
                  <Type size={14} /> Interface
                </div>
                <div className="palette-item" onDragStart={(e) => onDragStart(e, 'enum')} draggable>
                  <Type size={14} /> Enum
                </div>
                <div className="palette-item" onDragStart={(e) => onDragStart(e, 'package')} draggable>
                  <Plus size={14} /> Package
                </div>
              </div>
            </div>
          </aside>
        )}

        <div className={`canvas-wrapper ${isSelectMode ? 'selection-mode' : ''}`}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={() => setContextMenu(null)}
            onDragOver={onDragOver}
            onDrop={onDrop}
            selectionMode={isSelectMode ? SelectionMode.Partial : (undefined as any)}
            panOnDrag={!isSelectMode}
            selectionOnDrag={isSelectMode}
            nodesDraggable={true}
            nodesConnectable={true}
            minZoom={0.05}
            maxZoom={4}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls />
            <MiniMap
              nodeColor={(n: any) => n.data?.color || '#eee'}
              maskColor="rgba(241, 245, 249, 0.7)"
              style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </ReactFlow>

          {contextMenu && (
            <div
              className="context-menu"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              {contextMenu.type === 'edge' && (
                <button onClick={addWaypoint} className="menu-item">
                  <Plus size={14} /> Add Waypoint
                </button>
              )}
              {contextMenu.type === 'node' && (
                <>
                  <div className="context-menu-label">Colors</div>
                  <div className="color-grid">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        className="color-swatch"
                        style={{ background: c }}
                        onClick={() => {
                          setNodes(nds => nds.map(n => n.id === contextMenu.nodeId ? { ...n, data: { ...n.data, color: c } } : n));
                          setContextMenu(null);
                        }}
                      />
                    ))}
                  </div>

                  <div className="context-menu-label">Font Target</div>
                  <div className="target-selector">
                    <button
                      className={`font-size-button ${fontSizeTarget === 'header' ? 'active' : ''}`}
                      onClick={() => setFontSizeTarget('header')}
                    >Header</button>
                    <button
                      className={`font-size-button ${fontSizeTarget === 'fields' ? 'active' : ''}`}
                      onClick={() => setFontSizeTarget('fields')}
                    >Fields</button>
                    <button
                      className={`font-size-button ${fontSizeTarget === 'methods' ? 'active' : ''}`}
                      onClick={() => setFontSizeTarget('methods')}
                    >Methods</button>
                  </div>

                  <div className="context-menu-label">Size</div>
                  <div className="font-size-picker">
                    {FONT_SIZES.map(sz => (
                      <button
                        key={sz}
                        className="font-size-button"
                        onClick={() => {
                          setNodes(nds => nds.map(n => {
                            if (n.id === contextMenu.nodeId) {
                              const dataKey = fontSizeTarget === 'header' ? 'fontSize' :
                                fontSizeTarget === 'fields' ? 'fieldFontSize' : 'methodFontSize';
                              return { ...n, data: { ...n.data, [dataKey]: sz } };
                            }
                            return n;
                          }));
                          setContextMenu(null);
                        }}
                      >{sz}</button>
                    ))}
                  </div>

                  <button className="menu-item destructive" onClick={() => {
                    setNodes(nds => nds.filter(n => n.id !== contextMenu.nodeId));
                    setContextMenu(null);
                  }}>
                    <Trash2 size={14} /> Delete Component
                  </button>
                </>
              )}
              <button className="menu-item" onClick={() => setContextMenu(null)}>Close</button>
            </div>
          )}
        </div>
      </main>
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
