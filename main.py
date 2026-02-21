import click
import os
from pathlib import Path
from converter.factory import ParserFactory
from converter.puml_generator import PUMLGenerator

@click.command()
@click.argument('path', type=click.Path(exists=True))
@click.option('--output', '-o', default='diagram.puml', help='Output PlantUML file')
def main(path, output):
    """
    Convert Java/Kotlin source code to PlantUML class diagrams.
    PATH can be a file or a directory.
    """
    parser_factory = ParserFactory()
    puml_gen = PUMLGenerator()
    
    all_classes = []
    supported_extensions = parser_factory.get_supported_extensions()
    
    files_to_process = []
    if os.path.isfile(path):
        files_to_process.append(Path(path))
    else:
        for ext in supported_extensions:
            files_to_process.extend(Path(path).rglob(f"*{ext}"))

    if not files_to_process:
        click.echo(f"No supported files found (supported: {', '.join(supported_extensions)})")
        return

    for file_path in files_to_process:
        parser = parser_factory.get_parser_for_extension(file_path.suffix)
        if not parser:
            click.echo(f"Skipping {file_path}: No parser for extension {file_path.suffix}")
            continue

        click.echo(f"Processing {file_path}...")
        try:
            content = file_path.read_text(encoding='utf-8')
            all_classes.extend(parser.parse(content))
        except Exception as e:
            click.echo(f"Failed to parse {file_path}: {e}", err=True)

    if not all_classes:
        click.echo("No classes extracted.")
        return

    diagram_name = Path(output).stem
    puml_content = puml_gen.generate(all_classes, title=diagram_name)
    
    with open(output, 'w', encoding='utf-8') as f:
        f.write(puml_content)
    
    click.echo(f"Successfully generated {output}")

if __name__ == '__main__':
    main()
