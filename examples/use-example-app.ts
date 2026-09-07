import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { App, type RendererNode } from '../src';

interface Ready<T> {
  app: App;
  shader: string;
  graph: T;
}

/**
 * Bridges an imperative `App` into a Preact component: builds the graph and the
 * `App` once the mount div exists, (optionally) runs it, and tears it down on
 * unmount.
 */
export function useExampleApp<T extends { renderer: RendererNode }>(
  build: () => T,
  width: number,
  height: number,
  options: { autoRun?: boolean } = {},
): {
  mountRef: RefObject<HTMLDivElement>;
  app: App | null;
  graph: T | null;
  shader: string;
} {
  const autoRun = options.autoRun ?? true;
  const mountRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<Ready<T> | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const graph = build();
    const app = new App(graph.renderer, { mount, width, height });
    if (autoRun) app.run();
    setReady({ app, shader: app.shader.fragmentShader, graph });

    return () => {
      app.destroy();
      setReady(null);
    };
  }, []);

  return {
    mountRef,
    app: ready?.app ?? null,
    graph: ready?.graph ?? null,
    shader: ready?.shader ?? '',
  };
}
