import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ExampleShell, Viewport } from '../shell';
import { useExampleApp } from '../use-example-app';
import { TrackFeed } from './audio';
import { HEIGHT, WAVE_POINTS, WIDTH, orbitingDot } from './graph';

const PIPELINE = [
  'UVNode',
  'PolarNode',
  'SignalNode.sample',
  'clamp · smoothstep',
  'sin ×3',
  'RendererNode',
];

// Formats every browser decodes: MP3 everywhere, WAV everywhere, M4A/AAC on all
// but old Firefox. No OGG/Opus — Safari still won't decode it.
const ACCEPT = 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,.mp3,.wav,.m4a';

function Example() {
  const { mountRef, app, graph, shader } = useExampleApp(orbitingDot, WIDTH, HEIGHT);
  const feed = useMemo(() => new TrackFeed(), []);
  const silence = useMemo(() => new Float32Array(WAVE_POINTS), []);
  const fileInput = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => feed.destroy(), [feed]);

  useEffect(() => {
    if (!app || !graph) return;
    const { wave } = graph;
    const onFrame = () => {
      wave.set(feed.playing ? feed.window(WAVE_POINTS) : silence);
    };
    app.addEventListener('frame', onFrame);
    return () => app.removeEventListener('frame', onFrame);
  }, [app, graph, feed, silence]);

  async function loadFile(file: File): Promise<void> {
    setLoading(true);
    try {
      const credit = await feed.load(file);
      app?.setAttribution({ x: 'right', y: 'bottom', text: credit });
      setLoaded(true);
      setPlaying(true);
    } finally {
      setLoading(false);
    }
  }

  function onFile(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void loadFile(file);
  }

  function togglePlay(): void {
    if (playing) {
      feed.pause();
      setPlaying(false);
    } else {
      feed.resume();
      setPlaying(true);
    }
  }

  return (
    <ExampleShell
      title="orbiting-dot"
      description="A dot orbits the centre; its comet tail traces the waveform of the playing track. The tail is defined in polar coordinates — PolarNode transforms the pixel, and the waveform (a uniform float[] fed each frame) displaces the orbit ring radially. Load a track and play it; pause and the dot keeps orbiting with a flat tail."
      pipeline={PIPELINE}
      fragmentShader={shader}
    >
      <Viewport width={WIDTH} height={HEIGHT} mountRef={mountRef} />

      <div class="mt-6 flex gap-3" style={{ maxWidth: WIDTH }}>
        <button
          type="button"
          class="control-btn"
          disabled={loading}
          onClick={() => fileInput.current?.click()}
        >
          {loading ? (
            <>
              <span class="control-btn__spinner" aria-hidden="true" />
              loading…
            </>
          ) : (
            '⤓ load track'
          )}
        </button>
        <button
          type="button"
          class="control-btn"
          disabled={!loaded || loading}
          onClick={togglePlay}
        >
          {playing ? '⏸ pause' : '▶ play'}
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        class="sr-only"
        onChange={onFile}
      />
    </ExampleShell>
  );
}

render(<Example />, document.getElementById('app')!);
