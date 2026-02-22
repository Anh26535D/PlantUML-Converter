import { type NodeProps, NodeResizer } from '@xyflow/react';

export function PackageNode({ data, selected }: NodeProps) {
    const bgColor = (data as any).color || 'rgba(219, 234, 254, 0.4)';
    const fontSize = (data as any).fontSize || 18;

    return (
        <div className="aetheris-package-node" style={{ backgroundColor: bgColor }}>
            <NodeResizer
                minWidth={200}
                minHeight={150}
                isVisible={!!selected}
                lineClassName="resize-line"
                handleClassName="resize-handle"
            />
            <div className="package-header custom-drag-handle" style={{ fontSize: `${fontSize}px` }}>
                <span className="package-icon">📦</span>
                <span className="package-label">{String(data.label || 'Package')}</span>
            </div>
            <div className="package-body" />
        </div>
    );
}
