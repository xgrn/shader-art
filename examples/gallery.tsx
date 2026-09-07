import { Fragment, render } from 'preact';
import './tailwind.css';
import './ui.scss';
import { ThemeToggle } from './theme';

interface ExampleCard {
  slug: string;
  title: string;
  blurb: string;
  pipeline: string[];
}

const EXAMPLES: ExampleCard[] = [
  {
    slug: 'sine-colors',
    title: 'sine-colors',
    blurb: 'One phase-shifted sine per channel, driven by time.',
    pipeline: ['time', 'sin ×3', 'renderer'],
  },
  {
    slug: 'orbiting-dot',
    title: 'orbiting-dot',
    blurb: "A comet whose tail traces a playing track's waveform, in polar space.",
    pipeline: ['uv', 'polar · signal', 'renderer'],
  },
  {
    slug: 'limacon',
    title: 'limaçon',
    blurb: "Pascal's snail, r = b + a·cos θ, breathing through the cardioid.",
    pipeline: ['uv', 'polar · cos · min', 'renderer'],
  },
  {
    slug: 'julia',
    title: 'julia',
    blurb: 'A full-viewport Julia set morphing as c circles the Mandelbrot boundary.',
    pipeline: ['uv', 'escape-time loop', 'renderer'],
  },
  {
    slug: 'domain-warp',
    title: 'domain-warp',
    blurb: 'Domain-warped fBm — a flowing, non-repeating organic field.',
    pipeline: ['uv', 'noise ×5', 'renderer'],
  },
  {
    slug: 'cube',
    title: 'cube',
    blurb: 'A cube spinning on three axes — projected and rasterised in the graph, no meshes.',
    pipeline: ['rotate3d', 'perspective · triangle ×12', 'renderer'],
  },
];

function Gallery() {
  return (
    <main class="mx-auto max-w-3xl px-6 py-16">
      <header class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            shader-art
          </h1>
          <p class="mt-2 max-w-prose text-neutral-500 dark:text-neutral-400">
            Pure fragment-shader art as graphs of typed nodes. Wire nodes in
            TypeScript; the library compiles the graph to GLSL and runs it.
          </p>
        </div>
        <div class="shrink-0">
          <ThemeToggle />
        </div>
      </header>

      <section class="mt-10 grid gap-4 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <a
            key={ex.slug}
            href={`${import.meta.env.BASE_URL}examples/${ex.slug}/`}
            class="group rounded-xl border border-neutral-200 bg-neutral-50 p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
          >
            <h2 class="font-medium text-neutral-900 dark:text-neutral-100">{ex.title}</h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ex.blurb}</p>
            <div class="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-xs text-neutral-500">
              {ex.pipeline.map((node, i) => (
                <Fragment key={node}>
                  {i > 0 && <span class="text-neutral-400 dark:text-neutral-700">→</span>}
                  <span class="rounded border border-neutral-200 px-1.5 py-0.5 dark:border-neutral-800">
                    {node}
                  </span>
                </Fragment>
              ))}
            </div>
          </a>
        ))}
      </section>
    </main>
  );
}

render(<Gallery />, document.getElementById('app')!);
