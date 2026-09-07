import type { ComponentChildren, Ref } from 'preact';
import { Fragment } from 'preact';
import './tailwind.css';
import './ui.scss';
import { ThemeToggle } from './theme';

const CHIP =
  'rounded border border-neutral-200 bg-neutral-100 px-2 py-1 text-neutral-600 ' +
  'dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300';

export interface ExampleShellProps {
  title: string;
  description: string;
  /** Node kinds in pipeline order. */
  pipeline: string[];
  /** Compiled GLSL to show in the collapsible panel. */
  fragmentShader?: string;
  /** The framed viewport, plus any example-specific controls. */
  children?: ComponentChildren;
}

export function ExampleShell({
  title,
  description,
  pipeline,
  fragmentShader,
  children,
}: ExampleShellProps) {
  return (
    <main class="mx-auto max-w-3xl px-6 py-12">
      <div class="flex items-center justify-between">
        <a
          href={import.meta.env.BASE_URL}
          class="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-300"
        >
          ← examples
        </a>
        <ThemeToggle />
      </div>

      <h1 class="mt-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      <p class="mt-1 max-w-prose text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        {description}
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
        {pipeline.map((node, i) => (
          <Fragment key={node}>
            {i > 0 && <span class="text-neutral-400 dark:text-neutral-600">→</span>}
            <span class={CHIP}>{node}</span>
          </Fragment>
        ))}
      </div>

      {children}

      {fragmentShader ? (
        <details class="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
          <summary class="cursor-pointer select-none px-4 py-2.5 text-sm text-neutral-500 transition-colors marker:text-neutral-400 hover:text-neutral-900 dark:text-neutral-400 dark:marker:text-neutral-600 dark:hover:text-neutral-200">
            compiled fragment shader
          </summary>
          <pre class="overflow-x-auto border-t border-neutral-200 px-4 py-3 font-mono text-xs leading-relaxed text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
            <code>{fragmentShader}</code>
          </pre>
        </details>
      ) : null}
    </main>
  );
}

export interface ViewportProps {
  width: number;
  height: number;
  /** Handed to `new App(..., { mount })`. */
  mountRef: Ref<HTMLDivElement>;
}

/** The framed canvas host and its dimension label. */
export function Viewport({ width, height, mountRef }: ViewportProps) {
  return (
    <>
      <div class="viewport-frame mt-6 inline-block" style={{ width, height }}>
        <div ref={mountRef} class="relative h-full w-full" />
      </div>
      <div class="mt-2 font-mono text-xs text-neutral-400 dark:text-neutral-600">
        {width} × {height}
      </div>
    </>
  );
}
