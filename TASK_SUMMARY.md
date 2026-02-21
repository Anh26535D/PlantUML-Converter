# Task Summary: Java/Kotlin to PlantUML Converter

## Objective
Implement a tool that automatically generates PlantUML class diagrams from Java and Kotlin source code.

## Implementation Status
- [x] **Source Code Parsing**:
    - [x] Java parsing implemented using `javalang`.
    - [x] Kotlin parsing implemented using `tree-sitter-kotlin`.
- [x] **Relationship Extraction**:
    - [x] Inheritance and interface implementation for Java.
    - [x] Inheritance for Kotlin.
- [x] **Package-level grouping**:
    - [x] Automatic grouping of classes into `package` blocks in PlantUML.
- [x] **PlantUML Generation**:
    - [x] Automated PUML syntax generation for classes, interfaces, enums, objects, fields, and methods.
- [x] **CLI Interface**:
    - [x] Implemented with `click`, supporting directory/file input and output file specification.

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
