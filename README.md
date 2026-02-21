# Java & Kotlin to PlantUML Converter

A sleek command-line tool to automatically generate PlantUML class diagrams from Java and Kotlin source code.

## 🚀 Features

-   **Dual-Language Support**: Seamlessly parses both `.java` and `.kt` files.
-   **Intelligent Parsing**:
    -   **Java**: Full AST parsing for classes, interfaces, enums, and inheritance.
    -   **Kotlin**: Support for primary constructors, properties, objects, and delegation specifiers using Tree-sitter.
-   **Member Extraction**: Captures fields, methods, return types, and visibility modifiers.
-   **Relationship Mapping**: Automatically identifies and maps inheritance (`<|--`) and interface implementations (`<|..`).
-   **Modern Stack**: Built with Python, `uv`, `javalang`, and `tree-sitter`.

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
