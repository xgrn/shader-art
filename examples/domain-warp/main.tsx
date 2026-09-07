import { render } from 'preact';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { HEIGHT, WIDTH, domainWarp } from './graph';

function Example() {
  const { mountRef, shader } = useExampleApp(domainWarp, WIDTH, HEIGHT);
  return (
    <ExampleShell
      title="domain-warp"
      description="Domain-warped fBm: fbm(p + fbm(p + fbm(p))). Each layer bends the sampling coordinates of the next, giving a flowing, organic field with no repeating motif. NoiseNode (engine) supplies the fBm; the domain drifts over time."
      pipeline={['UVNode', 'NoiseNode ×5', 'mix', 'RendererNode']}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
