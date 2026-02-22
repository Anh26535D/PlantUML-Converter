# 🌌 Aetheris: The Interactive Code Architect

Aetheris is a next-generation architectural visualization tool that transforms Java and Kotlin source code into interactive, editable, and beautiful diagrams. Unlike static generators, Aetheris decouples code structure from visual layout, giving you total control over how your architecture is presented.

## 🚀 Key Innovations

-   **Interactive Canvas**: Drag-and-drop components to create the perfect layout. Your visual arrangements are preserved even as your code evolves.
-   **Package Grouping**: Automatically organize classes into interactive, resizable containers based on their source code namespace.
-   **Manual Edge Routing**: Take control of your relationships. Add draggable waypoints to route lines around obstacles or create custom architectural paths.
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
3.  **Install Frontend dependencies:**
    ```bash
    cd visualizer && npm install
    ```

## 📖 Usage

### 1. Extract the Model
Scan your Java/Kotlin source code and export it to the visualizer assets.
```bash
uv run main.py <source_path> -o visualizer/src/assets/model.json -f json
```

### 2. Start the Persistence Service
Launch the local API server to enable "Save Layout" and color customization.
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
- **Design Mode**: Drag class nodes and package containers to your desired arrangement.
- **Routing**: Right-click relationship lines to add/remove waypoints. Drag points to route paths.
- **Styling**: Right-click package headers to customize background colors.
- **Persistence**: Click **"Save Layout"** to permanently store positions, colors, and waypoints in `layout.json`.

## 📂 Project Structure

-   `main.py`: CLI entry point for model extraction.
-   `service.py`: Backend persistence API for the visualizer.
-   `converter/`: Core logic containing individual parsers and the AML engine.
-   `visualizer/`: React/Vite interactive architectural canvas.
-   `examples/`: Sample source files to test the converter.

## 📄 License
MIT
