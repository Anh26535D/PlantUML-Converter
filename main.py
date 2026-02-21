import click
import os
from pathlib import Path
from converter.java_parser import JavaParser
from converter.kotlin_parser import KotlinParser
from converter.puml_generator import PUMLGenerator

@click.command()
@click.argument('path', type=click.Path(exists=True))
@click.option('--output', '-o', default='diagram.puml', help='Output PlantUML file')
def main(path, output):
    """
    Convert Java/Kotlin source code to PlantUML class diagrams.
    PATH can be a file or a directory.
    """
    java_parser = JavaParser()
    kotlin_parser = KotlinParser()
    puml_gen = PUMLGenerator()
    
    all_classes = []
    
    files_to_process = []
    if os.path.isfile(path):
        files_to_process.append(Path(path))
    else:
        for ext in ['*.java', '*.kt']:
            files_to_process.extend(Path(path).rglob(ext))

    if not files_to_process:
        click.echo("No Java or Kotlin files found.")
        return

    for file_path in files_to_process:
        click.echo(f"Processing {file_path}...")
        try:
            content = file_path.read_text(encoding='utf-8')
            if file_path.suffix == '.java':
                all_classes.extend(java_parser.parse(content))
            elif file_path.suffix == '.kt':
                all_classes.extend(kotlin_parser.parse(content))
        except Exception as e:
            click.echo(f"Failed to parse {file_path}: {e}", err=True)

    if not all_classes:
        click.echo("No classes extracted.")
        return

    puml_content = puml_gen.generate(all_classes)
    
    with open(output, 'w', encoding='utf-8') as f:
        f.write(puml_content)
    
    click.echo(f"Successfully generated {output}")

if __name__ == '__main__':
    main()
