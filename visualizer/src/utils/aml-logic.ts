import { type Node, type Edge, MarkerType } from '@xyflow/react';

export interface AMLProject {
    nodes: Node[];
    edges: Edge[];
}

export function parseAML(text: string): AMLProject {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const lines = text.split('\n');

    let currentPackage: string | null = null;
    let currentClass: any | null = null;

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

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) return;

        // Namespace start
        const nsMatch = trimmed.match(/^namespace\s+([\w.]+)\s*{/);
        if (nsMatch) {
            currentPackage = nsMatch[1];
            const pkgId = `pkg-${currentPackage}`;
            nodes.push({
                id: pkgId,
                type: 'package',
                position: { x: 50 + nodes.length * 100, y: 50 },
                data: { label: currentPackage, color: COLORS[nodes.length % COLORS.length] },
                style: { width: 500, height: 400 },
                zIndex: -1
            });
            return;
        }

        // Class start
        const classMatch = trimmed.match(/^(?:(abstract)\s+)?(class|interface|enum)\s+(\w+)\s*{/);
        if (classMatch) {
            const isAbstract = !!classMatch[1];
            const type = classMatch[2];
            const name = classMatch[3];

            currentClass = {
                id: name,
                type: 'class',
                position: { x: 50, y: 50 },
                parentId: currentPackage ? `pkg-${currentPackage}` : undefined,
                data: {
                    label: name,
                    type,
                    isAbstract,
                    fields: [],
                    methods: [],
                    package: currentPackage
                }
            };
            nodes.push(currentClass);
            return;
        }

        // Closing brace
        if (trimmed === '}') {
            if (currentClass) currentClass = null;
            else if (currentPackage) currentPackage = null;
            return;
        }

        // Members (inside class)
        if (currentClass) {
            // Field: name: type [vis] [static]
            const fieldMatch = trimmed.match(/^(\w+):\s*([\w<>.]+)(?:\s+\[([\+\-#~])\])?(?:\s+(static))?$/);
            if (fieldMatch) {
                currentClass.data.fields.push({
                    name: fieldMatch[1],
                    type: fieldMatch[2],
                    visibility: fieldMatch[3] || '+',
                    static: !!fieldMatch[4]
                });
                return;
            }

            // Method: name(params): ret [vis] [static]
            const methodMatch = trimmed.match(/^(\w+)\(([^)]*)\):\s*([\w<>.]+)(?:\s+\[([\+\-#~])\])?(?:\s+(static))?$/);
            if (methodMatch) {
                currentClass.data.methods.push({
                    name: methodMatch[1],
                    parameters: methodMatch[2] ? methodMatch[2].split(',').map(p => p.trim()) : [],
                    return_type: methodMatch[3],
                    visibility: methodMatch[4] || '+',
                    static: !!methodMatch[5]
                });
                return;
            }
        }

        // Relationships (outside class)
        // A -> B [type: association]
        const relMatch = trimmed.match(/^([\w.]+)\s+(--|>|\.\.>|\.\.\|>|--\|>|o--|\*--)\s+([\w.]+)(?:\s+\[type:\s+(\w+)\])?/);
        if (relMatch) {
            const source = relMatch[1];
            const operator = relMatch[2];
            const target = relMatch[3];
            const explicitType = relMatch[4];

            let markerEnd: any = { type: MarkerType.ArrowClosed, color: '#1e293b' };
            let style: any = { strokeWidth: 1.5, stroke: '#1e293b' };

            if (operator === '--|>' || operator === '..|>') {
                if (operator === '..|>') style.strokeDasharray = '5,5';
            } else if (operator === '..>') {
                style.strokeDasharray = '5,5';
            }

            edges.push({
                id: `e-${source}-${target}-${index}`,
                source,
                target,
                type: 'editable',
                data: { label: explicitType || '' },
                markerEnd,
                style
            });
        }
    });

    return { nodes, edges };
}

export function generateAML(nodes: Node[], edges: Edge[]): string {
    const lines: string[] = [];

    const packages: Record<string, Node[]> = {};
    const globalNodes: Node[] = [];

    nodes.filter(n => n.type === 'class').forEach(node => {
        const pkgData = nodes.find(n => n.id === node.parentId);
        if (pkgData) {
            const pkgName = String(pkgData.data.label);
            if (!packages[pkgName]) packages[pkgName] = [];
            packages[pkgName].push(node);
        } else {
            globalNodes.push(node);
        }
    });

    const renderClass = (cls: Node, indent = '') => {
        const data = cls.data as any;
        const prefix = data.isAbstract ? 'abstract ' : '';
        lines.push(`${indent}${prefix}${data.type || 'class'} ${data.label} {`);

        (data.fields || []).forEach((f: any) => {
            const vis = f.visibility ? ` [${f.visibility}]` : '';
            const stat = f.static ? ' static' : '';
            lines.push(`${indent}    ${f.name}: ${f.type}${vis}${stat}`);
        });

        (data.methods || []).forEach((m: any) => {
            const vis = m.visibility ? ` [${m.visibility}]` : '';
            const stat = m.static ? ' static' : '';
            const params = (m.parameters || []).join(', ');
            lines.push(`${indent}    ${m.name}(${params}): ${m.return_type}${vis}${stat}`);
        });

        lines.push(`${indent}}`);
    };

    Object.entries(packages).forEach(([pkgName, pkgClasses]) => {
        lines.push(`namespace ${pkgName} {`);
        pkgClasses.forEach(cls => {
            renderClass(cls, '    ');
            lines.push('');
        });
        lines.push('}');
        lines.push('');
    });

    globalNodes.forEach(cls => {
        renderClass(cls);
        lines.push('');
    });

    if (edges.length > 0) {
        lines.push('// Relationships');
        const seen = new Set();
        edges.forEach(edge => {
            let operator = '->';
            const style = edge.style as any;
            if (style?.strokeDasharray) {
                operator = '..>';
            }
            if (edge.data?.label === 'inheritance') operator = '--|>';
            if (edge.data?.label === 'realization') operator = '..|>';

            const line = `${edge.source} ${operator} ${edge.target}${edge.data?.label ? ` [type: ${edge.data.label}]` : ''}`;
            if (!seen.has(line)) {
                lines.push(line);
                seen.add(line);
            }
        });
    }

    return lines.join('\n');
}
