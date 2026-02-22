# 🌌 Aetheris: The Interactive Code Architect

Aetheris is a next-generation architectural visualization tool that transforms Java and Kotlin source code into interactive, editable, and beautiful diagrams. Unlike static generators, Aetheris decouples code structure from visual layout, giving you total control over how your architecture is presented.

## 🚀 Key Innovations

-   **Interactive Canvas**: Drag-and-drop components to create the perfect layout. Your visual arrangements are preserved even as your code evolves.
-   **Aetheris Modeling Language (AML)**: An independent, human-readable DSL that defines your architecture without the constraints of legacy diagramming engines.
-   **Intelligent Extraction**:
    *   **Java**: Deep AST parsing using `javalang`.
    *   **Kotlin**: Advanced property and relationship mapping via Tree-sitter.
-   **Relational Intelligence**: Automatically maps complex hierarchies, associations, aggregations, and dependencies.
-   **Independent Rendering**: Decouple the "What" (structure) from the "Where" (layout).

## 🛠️ Installation

This project uses `uv` for lightning-fast dependency management.

1.  **Clone or create the project directory.**
2.  **Install dependencies:**
    ```bash
    uv sync
    ```

## 📖 Usage

Run the converter by pointing it to a source file or a directory containing your code.

```bash
uv run main.py <source_path> [OPTIONS]
```

### Options:

-   `-o, --output TEXT`: Specify the output filename (default: `diagram.puml`).
-   `--help`: Show the help message.

### Examples:

**Convert a whole directory:**
```bash
uv run main.py ./src -o project_layout.puml
```

**Convert a single file:**
```bash
uv run main.py examples/Sample.kt -o single_class.puml
```

## 📂 Project Structure

-   `main.py`: CLI entry point.
-   `converter/`: Core logic containing individual parsers and the PUML generator.
-   `examples/`: Sample source files to test the converter.
-   `TASK_SUMMARY.md`: Detailed implementation status and technical roadmap.

## 📄 License
MIT
