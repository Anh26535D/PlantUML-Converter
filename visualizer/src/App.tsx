import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ClassNode } from './components/ClassNode';
import modelData from './assets/model.json';

const nodeTypes = {
  class: ClassNode,
};

// Transform model data to React Flow nodes and edges
const initialNodes = modelData.map((cls, index) => ({
  id: cls.name,
  type: 'class',
  position: { x: (index % 3) * 400, y: Math.floor(index / 3) * 450 },
  data: cls,
}));

const initialEdges: Edge[] = [];
const nodeIds = new Set(modelData.map(cls => cls.name));

modelData.forEach((cls) => {
  const source = cls.name;

  // 1. Inheritance (Extends)
  if (cls.extends && nodeIds.has(cls.extends)) {
    initialEdges.push({
      id: `${source}-extends-${cls.extends}`,
      source: source,
      target: cls.extends,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b', width: 20, height: 20 },
      style: { strokeWidth: 2, stroke: '#1e293b' },
    });
  }

  // 2. Realization (Implements)
  cls.implements?.forEach((impl) => {
    if (nodeIds.has(impl)) {
      initialEdges.push({
        id: `${source}-implements-${impl}`,
        source: source,
        target: impl,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1e293b', width: 20, height: 20 },
        style: { strokeWidth: 2, stroke: '#1e293b', strokeDasharray: '5,5' },
      });
    }
  });

  // 3. Associations
  cls.associations?.forEach((assoc, i) => {
    if (nodeIds.has(assoc)) {
      initialEdges.push({
        id: `${source}-assoc-${assoc}-${i}`,
        source: source,
        target: assoc,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { strokeWidth: 1.5, stroke: '#64748b' },
      });
    }
  });

  // 4. Aggregations
  cls.aggregations?.forEach((agg, i) => {
    if (nodeIds.has(agg)) {
      initialEdges.push({
        id: `${source}-agg-${agg}-${i}`,
        source: source,
        target: agg,
        markerStart: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { strokeWidth: 1.5, stroke: '#64748b' },
      });
    }
  });

  // 5. Compositions
  cls.compositions?.forEach((comp, i) => {
    if (nodeIds.has(comp)) {
      initialEdges.push({
        id: `${source}-comp-${comp}-${i}`,
        source: source,
        target: comp,
        markerStart: { type: MarkerType.ArrowClosed, color: '#1e293b' },
        style: { strokeWidth: 2, stroke: '#1e293b' },
      });
    }
  });

  // 6. Dependencies
  cls.dependencies?.forEach((dep, i) => {
    if (nodeIds.has(dep)) {
      initialEdges.push({
        id: `${source}-dep-${dep}-${i}`,
        source: source,
        target: dep,
        markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' },
        style: { strokeWidth: 1, stroke: '#94a3b8', strokeDasharray: '4,4' },
      });
    }
  });
});

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="app-container">
      <header className="main-header">
        <h1 className="title">
          <span className="icon">🌌</span> Aetheris Architect
        </h1>
        <p className="subtitle">Interactive Code Visualizer Prototype</p>
      </header>

      <div className="canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background color="#cbd5e1" gap={20} />
        </ReactFlow>
      </div>

      <div className="footer-info">
        Drag nodes to rearrange. Connections update automatically.
      </div>
    </div>
  );
}
