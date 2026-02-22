import { Handle, Position } from '@xyflow/react';

interface ClassNodeProps {
    data: {
        name: string;
        type: string;
        fields: any[];
        methods: any[];
        visibility: string;
        is_abstract: boolean;
    };
}

export function ClassNode({ data }: ClassNodeProps) {
    const isInterface = data.type === 'interface';
    const isAbstract = data.is_abstract;

    return (
        <div className="aetheris-node">
            <Handle type="target" position={Position.Top} className="handle-point target" />

            <div className={`node-header ${isInterface ? 'interface' : isAbstract ? 'abstract' : 'class'}`}>
                {isInterface && <div className="type-tag blue">«interface»</div>}
                {isAbstract && data.type === 'class' && <div className="type-tag grey">«abstract»</div>}
                <div className="class-name">{data.name}</div>
            </div>

            {data.fields.length > 0 && (
                <div className="node-section fields">
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
                <div className="node-section methods">
                    {data.methods.map((m, i) => (
                        <div key={i} className="member-row">
                            <span className="visibility">{m.visibility || '+'}</span>
                            <span className="member-name">{m.name}({m.parameters.join(', ')})</span>
                            <span className="member-type">: {m.return_type}</span>
                        </div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="handle-point source" />
        </div>
    );
}
