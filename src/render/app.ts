import * as THREE from 'three';
import type { CompiledShader, Value } from '../types';
import type { Node } from '../graph/node';
import type { RendererNode } from '../nodes/renderer';
import { TimeNode, ViewportNode, UVNode, UniformNode } from '../nodes/input';
import { collectNodes } from '../graph/collect';
import { bumpEpoch } from '../graph/epoch';
import { compile } from './compile';

/** Dispatched by `App` once per animation frame (and by `tick()`). */
export class FrameEvent extends Event {
  constructor(
    /** Seconds since `run()` started. */
    readonly time: number,
    /** Seconds since the previous frame. */
    readonly dt: number,
    /** Frame counter, starting at 0. */
    readonly frame: number,
  ) {
    super('frame');
  }
}

interface AppEventMap {
  frame: FrameEvent;
}

/** Where the canvas is mounted: an element, a CSS selector, or `document.body`. */
export type MountTarget = HTMLElement | string;

/** A small text credit shown in a corner of the canvas (plain HTML, not a shader). */
export interface Attribution {
  x: 'left' | 'right';
  y: 'top' | 'bottom';
  text: string;
}

export interface AppOptions {
  /** Canvas host: an element, a CSS selector, or (default) `document.body`. */
  mount?: MountTarget;
  /** Canvas width in CSS pixels. Falls back to the mount's width, then `window.innerWidth`. */
  width?: number;
  /** Canvas height in CSS pixels. Falls back to the mount's height, then `window.innerHeight`. */
  height?: number;
  pixelRatio?: number;
}

export type Rgba = readonly [number, number, number, number];

interface ThreeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
  wrapper: HTMLElement;
}

/**
 * Drives a compiled graph: compiles once, mounts a canvas, animates.
 * An `EventTarget` — listen for `frame` to push per-frame data into
 * `UniformNode`s (`uniform.out.value.set(...)`).
 */
export class App extends EventTarget {
  readonly width: number;
  readonly height: number;
  readonly shader: CompiledShader;
  readonly nodes: readonly Node[];

  private readonly root: RendererNode;
  private readonly options: AppOptions;
  private readonly mountTarget: HTMLElement | undefined;
  private readonly timeNodes: readonly TimeNode[];
  private readonly uvNodes: readonly UVNode[];
  private readonly uniformNodes: readonly UniformNode[];
  private three: ThreeContext | undefined;
  private attribution: Attribution | null = null;
  private attributionEl: HTMLElement | undefined;
  private destroyed = false;
  private running = false;
  private startTime = now();
  private lastElapsed = 0;
  private frameCount = 0;

  constructor(root: RendererNode, options: AppOptions = {}) {
    super();
    this.root = root;
    this.options = options;
    this.mountTarget = resolveMount(options.mount);
    this.width = options.width ?? (this.mountTarget?.clientWidth || fallbackSize('width'));
    this.height = options.height ?? (this.mountTarget?.clientHeight || fallbackSize('height'));
    this.nodes = collectNodes(root);
    this.timeNodes = this.nodes.filter(
      (node): node is TimeNode => node instanceof TimeNode,
    );
    this.uvNodes = this.nodes.filter((node): node is UVNode => node instanceof UVNode);
    this.uniformNodes = this.nodes.filter(
      (node): node is UniformNode => node instanceof UniformNode,
    );
    for (const node of this.nodes) {
      if (node instanceof ViewportNode) node.out.size.setValue([this.width, this.height]);
    }
    this.shader = compile(root);
  }

  override addEventListener<K extends keyof AppEventMap>(
    type: K,
    listener: (event: AppEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | ((event: never) => void),
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }

  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Evaluate the final colour on the CPU for one pixel. No WebGL involved.
   * `uv` is normalised 0..1, matching `UVNode`.
   */
  sample(at: { time?: number; uv?: readonly [number, number] } = {}): Rgba {
    if (at.time !== undefined) {
      for (const node of this.timeNodes) node.out.t.setValue(at.time);
    }
    if (at.uv !== undefined) {
      for (const node of this.uvNodes) node.out.uv.setValue(at.uv);
    }
    bumpEpoch();
    return this.root.out.color.value as Rgba;
  }

  run(): void {
    if (this.destroyed) {
      throw new Error('App: cannot run() after destroy()');
    }
    const three = this.mount();
    this.startTime = now();
    this.lastElapsed = 0;
    this.running = true;
    three.renderer.setAnimationLoop(() => {
      this.tick();
      three.renderer.render(three.scene, three.camera);
    });
  }

  /** Halt the animation loop. `run()` resumes it. */
  stop(): void {
    this.three?.renderer.setAnimationLoop(null);
    this.running = false;
  }

  /** Render a single frame (fires `frame`, syncs uniforms) without the loop. */
  renderOnce(): void {
    if (this.destroyed) {
      throw new Error('App: cannot renderOnce() after destroy()');
    }
    const three = this.mount();
    this.tick();
    three.renderer.render(three.scene, three.camera);
  }

  /** Halt and release the canvas, GPU objects and DOM. Cannot be run again. */
  destroy(): void {
    if (this.destroyed) return;
    this.stop();
    this.attributionEl?.remove();
    this.attributionEl = undefined;
    if (this.three) {
      this.three.geometry.dispose();
      this.three.material.dispose();
      this.three.renderer.dispose();
      this.three.renderer.forceContextLoss();
      this.three.wrapper.remove();
      this.three = undefined;
    }
    this.destroyed = true;
  }

  /**
   * Advance one frame: fire `frame` (so listeners can push uniform values),
   * then sync `TimeNode` / `UniformNode` values to the CPU graph and, if
   * mounted, to the GPU material. Called automatically by `run()`; call it
   * directly to step deterministically (tests). `elapsed` defaults to wall time.
   */
  tick(elapsed: number = (now() - this.startTime) / 1000): void {
    const dt = elapsed - this.lastElapsed;
    this.lastElapsed = elapsed;

    for (const node of this.timeNodes) node.out.t.setValue(elapsed);
    this.dispatchEvent(new FrameEvent(elapsed, dt, this.frameCount++));

    const material = this.three?.material;
    if (material) {
      const uTime = material.uniforms.uTime;
      if (uTime) uTime.value = elapsed;
      for (const node of this.uniformNodes) {
        const u = material.uniforms[node.uniformName];
        if (u) u.value = node.out.value.current;
      }
    }
  }

  set(name: string, value: Value): void {
    const uniform = this.three?.material.uniforms[name];
    if (uniform) uniform.value = value as unknown;
  }

  /** Show (or, with `null`, hide) a corner credit over the canvas. */
  setAttribution(attribution: Attribution | null): void {
    this.attribution = attribution;
    this.renderAttribution();
  }

  private renderAttribution(): void {
    this.attributionEl?.remove();
    this.attributionEl = undefined;
    const a = this.attribution;
    if (!a || !this.three) return;

    const el = document.createElement('div');
    el.className = 'shader-art-attribution';
    el.textContent = a.text;
    Object.assign(el.style, {
      position: 'absolute',
      pointerEvents: 'none',
      margin: '0.5rem',
      padding: '0.15rem 0.45rem',
      borderRadius: '3px',
      font: "12px/1.4 ui-monospace, 'SF Mono', monospace",
      color: 'rgba(255, 255, 255, 0.85)',
      background: 'rgba(0, 0, 0, 0.45)',
    });
    el.style.setProperty(a.x, '0');
    el.style.setProperty(a.y, '0');

    this.three.wrapper.appendChild(el);
    this.attributionEl = el;
  }

  private mount(): ThreeContext {
    if (this.three) return this.three;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(this.options.pixelRatio ?? fallbackPixelRatio());
    renderer.setSize(this.width, this.height);

    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      position: 'relative',
      width: `${this.width}px`,
      height: `${this.height}px`,
    });
    wrapper.appendChild(renderer.domElement);
    (this.mountTarget ?? document.body).appendChild(wrapper);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms: Record<string, THREE.IUniform> = {};
    for (const [name, uniform] of Object.entries(this.shader.uniforms)) {
      uniforms[name] = {
        value: name === 'uResolution' ? [this.width, this.height] : uniform.value,
      };
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.fragmentShader,
      uniforms,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    this.three = { renderer, scene, camera, material, geometry, wrapper };
    this.renderAttribution();
    return this.three;
  }
}

function resolveMount(target: MountTarget | undefined): HTMLElement | undefined {
  if (target === undefined) return undefined;
  if (typeof target !== 'string') return target;
  if (typeof document === 'undefined') return undefined;
  const el = document.querySelector(target);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`App: mount target '${target}' not found`);
  }
  return el;
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function fallbackSize(dim: 'width' | 'height'): number {
  if (typeof window === 'undefined') return 1;
  return dim === 'width' ? window.innerWidth : window.innerHeight;
}

function fallbackPixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio, 2);
}
