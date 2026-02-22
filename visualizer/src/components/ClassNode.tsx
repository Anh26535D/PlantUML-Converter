import { Handle, Position } from '@xyflow/react';

interface ClassNodeProps {
    data: {
        name: string;
        type: string;
        fields: any[];
        methods: any[];
        visibility: string;
        is_abstract: boolean;
        fontSize?: number;
        fieldFontSize?: number;
        methodFontSize?: number;
    };
}

export function ClassNode({ data }: ClassNodeProps) {
    const isInterface = data.type === 'interface';
    const isAbstract = data.is_abstract;
    const headerFontSize = data.fontSize || 16;
    const fieldFontSize = data.fieldFontSize || 14;
    const methodFontSize = data.methodFontSize || 14;

    return (
        <div className="aetheris-node">
            {/* Top Row of Handles */}
            <Handle type="target" position={Position.Top} id="t1" style={{ left: '25%' }} className="handle-point" />
            <Handle type="target" position={Position.Top} id="t2" style={{ left: '50%' }} className="handle-point" />
            <Handle type="target" position={Position.Top} id="t3" style={{ left: '75%' }} className="handle-point" />
            <Handle type="source" position={Position.Top} id="t1-s" style={{ left: '25%' }} className="handle-point" />
            <Handle type="source" position={Position.Top} id="t2-s" style={{ left: '50%' }} className="handle-point" />
            <Handle type="source" position={Position.Top} id="t3-s" style={{ left: '75%' }} className="handle-point" />

            {/* Bottom Row of Handles */}
            <Handle type="source" position={Position.Bottom} id="b1" style={{ left: '25%' }} className="handle-point" />
            <Handle type="source" position={Position.Bottom} id="b2" style={{ left: '50%' }} className="handle-point" />
            <Handle type="source" position={Position.Bottom} id="b3" style={{ left: '75%' }} className="handle-point" />
            <Handle type="target" position={Position.Bottom} id="b1-t" style={{ left: '25%' }} className="handle-point" />
            <Handle type="target" position={Position.Bottom} id="b2-t" style={{ left: '50%' }} className="handle-point" />
            <Handle type="target" position={Position.Bottom} id="b3-t" style={{ left: '75%' }} className="handle-point" />

            {/* Right Column of Handles */}
            <Handle type="source" position={Position.Right} id="r1" style={{ top: '25%' }} className="handle-point" />
            <Handle type="source" position={Position.Right} id="r2" style={{ top: '50%' }} className="handle-point" />
            <Handle type="source" position={Position.Right} id="r3" style={{ top: '75%' }} className="handle-point" />
            <Handle type="target" position={Position.Right} id="r1-t" style={{ top: '25%' }} className="handle-point" />
            <Handle type="target" position={Position.Right} id="r2-t" style={{ top: '50%' }} className="handle-point" />
            <Handle type="target" position={Position.Right} id="r3-t" style={{ top: '75%' }} className="handle-point" />

            {/* Left Column of Handles */}
            <Handle type="source" position={Position.Left} id="l1" style={{ top: '25%' }} className="handle-point" />
            <Handle type="source" position={Position.Left} id="l2" style={{ top: '50%' }} className="handle-point" />
            <Handle type="source" position={Position.Left} id="l3" style={{ top: '75%' }} className="handle-point" />
            <Handle type="target" position={Position.Left} id="l1-t" style={{ top: '25%' }} className="handle-point" />
            <Handle type="target" position={Position.Left} id="l2-t" style={{ top: '50%' }} className="handle-point" />
            <Handle type="target" position={Position.Left} id="l3-t" style={{ top: '75%' }} className="handle-point" />

            <div className={`node-header ${isInterface ? 'interface' : isAbstract ? 'abstract' : 'class'}`} style={{ fontSize: `${headerFontSize}px` }}>
                {isInterface && <div className="type-tag blue" style={{ fontSize: '0.65em' }}>«interface»</div>}
                {isAbstract && data.type === 'class' && <div className="type-tag grey" style={{ fontSize: '0.65em' }}>«abstract»</div>}
                <div className="class-name">{data.name}</div>
            </div>

            {data.fields.length > 0 && (
                <div className="node-section fields" style={{ fontSize: `${fieldFontSize}px` }}>
                    {data.fields.map((f, i) => (
                        <div key={i} className="member-row">
                            <span className="visibility">{f.visibility || '+'}</span>
                            <span className="member-name">{f.name}</span>
                            <span className="member-type">: {f.type}</span>
                        </div>
                    ))}
                </div>
            )}

            {data.methods.length > 0 && (
                <div className="node-section methods" style={{ fontSize: `${methodFontSize}px` }}>
                    {data.methods.map((m, i) => (
                        <div key={i} className="member-row">
                            <span className="visibility">{m.visibility || '+'}</span>
                            <span className="member-name">{m.name}({m.parameters.join(', ')})</span>
                            <span className="member-type">: {m.return_type}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
