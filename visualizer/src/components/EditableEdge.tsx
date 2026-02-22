import { BaseEdge, type EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

export function EditableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    const vertices = (data?.vertices as Array<{ x: number; y: number }>) || [];

    let path = `M ${sourceX},${sourceY}`;
    vertices.forEach((v) => {
        path += ` L ${v.x},${v.y}`;
    });
    path += ` L ${targetX},${targetY}`;

    return (
        <>
            <BaseEdge
                id={id}
                path={path}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: 3,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                }}
            />
            <EdgeLabelRenderer>
                {vertices.map((v, index) => (
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${v.x}px,${v.y}px)`,
                            width: '14px',
                            height: '14px',
                            background: '#3b82f6',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'grab',
                            pointerEvents: 'all',
                            zIndex: 1000,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                        className="nodrag nopan waypoint-handle"
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            const handleMove = (moveEvent: MouseEvent) => {
                                const event = new CustomEvent('waypoint-move', {
                                    detail: {
                                        edgeId: id,
                                        vertexIndex: index,
                                        clientX: moveEvent.clientX,
                                        clientY: moveEvent.clientY
                                    }
                                });
                                window.dispatchEvent(event);
                            };
                            const handleUp = () => {
                                window.removeEventListener('mousemove', handleMove);
                                window.removeEventListener('mouseup', handleUp);
                            };
                            window.addEventListener('mousemove', handleMove);
                            window.addEventListener('mouseup', handleUp);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const event = new CustomEvent('waypoint-context-menu', {
                                detail: {
                                    edgeId: id,
                                    vertexIndex: index,
                                    clientX: e.clientX,
                                    clientY: e.clientY
                                }
                            });
                            window.dispatchEvent(event);
                        }}
                    />
                ))}
            </EdgeLabelRenderer>
        </>
    );
}
