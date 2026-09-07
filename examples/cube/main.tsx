import { render } from 'preact';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { HEIGHT, WIDTH, cube } from './graph';

function Example() {
  const { mountRef, shader } = useExampleApp(cube, WIDTH, HEIGHT);
  return (
    <ExampleShell
      title="cube"
      description="A cube spinning on all three axes, with no meshes. Each vertex is rotated, translated and perspective-projected in the node graph (time drives the rotation); TriangleNode software-rasterises the 12 triangles per pixel, composited nearest-depth-wins."
      pipeline={['Constant ×8', 'Rotate3DNode', 'PerspectiveNode', 'TriangleNode ×12', 'RendererNode']}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
