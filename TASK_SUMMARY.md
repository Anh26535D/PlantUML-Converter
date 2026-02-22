# 🌌 Task Summary: Aetheris Project

## Objective
Build **Aetheris**, an advanced architectural visualization platform that transforms source code into interactive, editable diagrams through a custom modeling DSL and a draggable canvas.

## Implementation Status
- [x] **Source Code Parsing**:
    - [x] Java parsing implemented using `javalang`.
    - [x] Kotlin parsing implemented using `tree-sitter-kotlin`.
- [x] **Relationship Extraction**:
    - [x] Full support for Inheritance, Implementation, Association, Aggregation, and Dependency.
- [x] **Core Rendering (Initial)**:
    - [x] PlantUML generation with auto-layout and package grouping.
- [ ] **Aetheris Modeling Language (AML)**:
    - [ ] Define the `.aml` plain-text specification.
    - [ ] Implement `AMLGenerator` to replace the dependency on PlantUML syntax.
- [ ] **Interactive Visualizer**:
    - [ ] Vite/React-based drag-and-drop canvas.
    - [ ] Persistent layout engine (`.layout.json`).
    - [ ] Real-time synchronization between AML source and Visual Canvas.

## Roadmap
1.  **Phase 1: Research & Setup** - Completed.
2.  **Phase 2: Multilingual Support** - Completed (Java/Kotlin).
3.  **Phase 3: AML Evolution** - Shift from PlantUML to the custom Aetheris Modeling Language.
4.  **Phase 4: The Canvas Stage** - Implement the React Flow-based interactive editor.
5.  **Phase 5: Layout Persistence** - Implement sidecar JSON logic to preserve user-defined arrangements.
6.  **Phase 6: Advanced Viz** - Add theme engines, SVG exports, and architectural heatmaps.

## Architecture
```text
Source Code (Java/KT) -> Aetheris Parser -> AML Definition (.aml)
                                               |
                                               v
Persistent Layout (.json) <-> Interactive Canvas (React) -> SVG/PDF
```
