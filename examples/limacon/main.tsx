import { render } from 'preact';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { HEIGHT, WIDTH, limacon } from './graph';

function Example() {
  const { mountRef, shader } = useExampleApp(limacon, WIDTH, HEIGHT);
  return (
    <ExampleShell
      title="limaçon"
      description="Pascal's snail: the polar curve r = b + a·cos θ, drawn from its implicit form in polar coordinates. a breathes up and down through a = b, morphing the figure between a dimpled limaçon, a cardioid, and a limaçon with an inner loop."
      pipeline={['UVNode', 'PolarNode', 'cos · abs', 'smoothstep · min', 'sin ×3', 'RendererNode']}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
