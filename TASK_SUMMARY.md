# Task Summary: Java/Kotlin to PlantUML Converter

## Objective
Implement a tool that automatically generates PlantUML class diagrams from Java and Kotlin source code.

## Implementation Status
- [x] **Source Code Parsing**:
    - [x] Java parsing implemented using `javalang`.
    - [x] Kotlin parsing implemented using `tree-sitter-kotlin`.
- [x] **Relationship Extraction**:
    - [x] Java: Extends, Implements, Association (fields), Aggregation (collections), Dependency (methods).
    - [x] Kotlin: Extends, Implements, Association, Aggregation, Dependency.
- [x] **Package-level grouping**:
    - [x] Automatic grouping of classes into `package` blocks in PlantUML.
    - [x] Smart relationship routing (definitions in packages, links outside) to prevent duplication.
- [x] **Advanced Features**:
    - [x] **Auto-Layout**: Heuristic-based diagram alignment (Left-to-Right vs Top-to-Bottom).
    - [x] **Dynamic Spacing**: Nodesep/ranksep adjusted based on diagram complexity.
    - [x] **Premium Theming**: Clean black & white design with rounded corners.
- [x] **CLI Interface**:
    - [x] Implemented with `click`, supporting recursive directory scanning and diagram naming.

## Usage
Run the following command to generate a diagram:
```bash
uv run main.py <source_path> -o <output_file.puml>
```

Example:
```bash
uv run main.py examples -o diagram.puml
```

## Technical Considerations
*   **Parsing Strategy**: 
    *   For Java: Use an AST parser like `javalang` (Python) or `JavaParser` (Java).
    *   For Kotlin: Use the official Kotlin compiler embeddable or a library like `kotlin-compile-testing` or specialized parsers if using Python.
*   **Language Choice**: 
    *   A JVM-based implementation (Java/Kotlin) might be more robust as it can leverage official compiler tools.
    *   A Python implementation might be quicker for simple scripts but harder for complex Kotlin syntax.
*   **Scope Limitation**: Initial versions may focus on structural elements (classes/methods) rather than detailed method body analysis.

## Roadmap
1.  **Phase 1: Research & Setup** - Identify the best parsing libraries for both languages.
2.  **Phase 2: Java Support** - Implement parsing and PUML generation for Java.
3.  **Phase 3: Kotlin Support** - Implement parsing and PUML generation for Kotlin.
4.  **Phase 4: Optimization & CLI** - Refine the output and add a user-friendly interface.
5.  **Phase 5: Documentation & Testing** - Finalize the tool and provide usage examples.
