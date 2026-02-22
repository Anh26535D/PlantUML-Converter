import dagre from 'dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const NODE_WIDTH = 420;
const NODE_HEIGHT = 500;

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
    const isHorizontal = direction === 'LR';

    // Create a new graph instance for every layout to avoid state pollution
    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 140, // More space between siblings
        ranksep: 200, // More space between levels/ranks
        marginx: 100,
        marginy: 100
    });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // 1. Add all nodes to dagre
    nodes.forEach((node) => {
        if (node.type === 'package') {
            // Packages are compound nodes
            dagreGraph.setNode(node.id, { label: node.data?.label || node.id });
        } else {
            // Classes are regular nodes with fixed dimensions
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        }

        // Handle hierarchy
        if (node.parentId) {
            dagreGraph.setParent(node.id, node.parentId);
        }
    });

    // 2. Add edges to dagre
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // 3. Run dagre layout
    dagre.layout(dagreGraph);

    // 4. Transfer positions back, handling relative offsets for children
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        let position = {
            x: nodeWithPosition.x - (nodeWithPosition.width || 0) / 2,
            y: nodeWithPosition.y - (nodeWithPosition.height || 0) / 2,
        };

        // If the node is a class inside a package, dagre gives global coordinates.
        // React Flow expects local coordinates for children.
        if (node.parentId) {
            const parentPosition = dagreGraph.node(node.parentId);
            position = {
                x: (nodeWithPosition.x - nodeWithPosition.width / 2) - (parentPosition.x - parentPosition.width / 2),
                y: (nodeWithPosition.y - nodeWithPosition.height / 2) - (parentPosition.y - parentPosition.height / 2),
            };
        }

        const newNode = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position,
        };

        // Update style for package nodes based on dagre's calculated size
        if (node.type === 'package') {
            newNode.style = {
                ...node.style,
                width: nodeWithPosition.width,
                height: nodeWithPosition.height,
            };
        }

        return newNode;
    });

    // 5. Smart Handle Selection based on relative positioning
    const finalEdges = edges.map(edge => {
        const sourceNode = layoutedNodes.find(n => n.id === edge.source);
        const targetNode = layoutedNodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode || sourceNode.type === 'package' || targetNode.type === 'package') {
            return edge;
        }

        const sPos = dagreGraph.node(sourceNode.id);
        const tPos = dagreGraph.node(targetNode.id);

        const dx = tPos.x - sPos.x;
        const dy = tPos.y - sPos.y;

        let sourceHandle = 'b2';
        let targetHandle = 't2';

        if (Math.abs(dx) > Math.abs(dy)) {
            // Primarily Horizontal
            if (dx > 0) {
                sourceHandle = 'r2';
                targetHandle = 'l2-t';
            } else {
                sourceHandle = 'l2';
                targetHandle = 'r2-t';
            }
        } else {
            // Primarily Vertical
            if (dy > 0) {
                sourceHandle = 'b2';
                targetHandle = 't2';
            } else {
                sourceHandle = 't2-s';
                targetHandle = 'b2-t';
            }
        }

        return {
            ...edge,
            sourceHandle,
            targetHandle
        };
    });

    return { nodes: layoutedNodes, edges: finalEdges };
}
