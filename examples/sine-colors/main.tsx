import { render } from 'preact';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { HEIGHT, WIDTH, sineColors } from './graph';

function Example() {
  const { mountRef, shader } = useExampleApp(sineColors, WIDTH, HEIGHT);
  return (
    <ExampleShell
      title="sine-colors"
      description="One phase-shifted sine wave per channel, driven by time. Nothing reads per-pixel input, so the whole viewport is a single colour that cycles."
      pipeline={['TimeNode', 'AddNode', 'SinNode ×3', 'RendererNode']}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
