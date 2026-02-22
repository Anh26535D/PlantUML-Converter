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

### 1. Extract the Model
Scan your Java/Kotlin source code and export it to the visualizer assets.
```bash
uv run main.py <source_path> -o visualizer/src/assets/model.json -f json
```

### 2. Start the Persistence Service
Launch the local API server to enable "Save Layout" functionality.
```bash
uv run python service.py
```

### 3. Launch the Visualizer
Open the interactive draggable canvas.
```bash
cd visualizer
npm run dev
```
*Navigate to [http://localhost:5173](http://localhost:5173) in your browser.*

### Features in Action:
- **Design Mode**: Drag class nodes to your desired spatial arrangement.
- **Persistence**: Click **"Save Layout"** to permanently store positions in `layout.json`.
- **Code Updates**: Rescan your code anytime; your visual layout stays preserved.

## 📂 Project Structure

-   `main.py`: CLI entry point.
-   `converter/`: Core logic containing individual parsers and the PUML generator.
-   `examples/`: Sample source files to test the converter.
-   `TASK_SUMMARY.md`: Detailed implementation status and technical roadmap.

## 📄 License
MIT
