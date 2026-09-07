import { render } from 'preact';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { HEIGHT, WIDTH, julia } from './graph';

function Example() {
  const { mountRef, shader } = useExampleApp(julia, WIDTH, HEIGHT);
  return (
    <ExampleShell
      title="julia"
      description="A full-viewport Julia set: z → z² + c, iterated per pixel in a GLSL loop (an example-scoped EscapeFractalNode) and coloured by smooth escape time. c drifts around the Mandelbrot boundary, so the set morphs between connected shapes and dust."
      pipeline={['UVNode', 'EscapeFractalNode', 'smoothstep', 'sin ×3', 'RendererNode']}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
