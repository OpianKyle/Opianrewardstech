import { useEffect, useRef } from 'react';

interface ShaderBackgroundProps {
  className?: string;
}

export function ShaderBackground({ className }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const pointersRef = useRef<any>(null);
  const frameRef = useRef<number>();

  const fragmentShader = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*/
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec2 move;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define N normalize
#define S smoothstep
#define MN min(R.x,R.y)
#define rot(a) mat2(cos((a)-vec4(0,11,33,0)))
#define csqr(a) vec2(a.x*a.x-a.y*a.y,2.*a.x*a.y)
float rnd(vec3 p) {
        p=fract(p*vec3(12.9898,78.233,156.34));
        p+=dot(p,p+34.56);
        return fract(p.x*p.y*p.z);
}
float swirls(in vec3 p) {
        float d=.0;
        vec3 c=p;
        for(float i=min(.0,time); i<9.; i++) {
                p=.7*abs(p)/dot(p,p)-.7;
                p.yz=csqr(p.yz);
                p=p.zxy;
                d+=exp(-19.*abs(dot(p,c)));
        }
        return d;
}
vec3 march(in vec3 p, vec3 rd) {
        float d=.2, t=.0, c=.0, k=mix(.9,1.,rnd(rd)),
        maxd=length(p)-1.;
        vec3 col=vec3(0);
        for(float i=min(.0,time); i<120.; i++) {
                t+=d*exp(-2.*c)*k;
                c=swirls(p+rd*t);
                if (t<5e-2 || t>maxd) break;
                col+=vec3(c*c,c/1.05,c)*8e-3;
        }
        return col;
}
float rnd(vec2 p) {
        p=fract(p*vec2(12.9898,78.233));
        p+=dot(p,p+34.56);
        return fract(p.x*p.y);
}
vec3 sky(vec2 p, bool anim) {
        p.x-=.17-(anim?2e-4*T:.0);
        p*=500.;
        vec2 id=floor(p), gv=fract(p)-.5;
        float n=rnd(id), d=length(gv);
        if (n<.975) return vec3(0);
        return vec3(S(3e-2*n,1e-3*n,d*d));
}
void cam(inout vec3 p) {
        p.yz*=rot(move.y*6.3/MN-T*.05);
        p.xz*=rot(-move.x*6.3/MN+T*.025);
}
void main() {
        vec2 uv=(FC-.5*R)/MN;
        vec3 col=vec3(0),
        p=vec3(0,0,-16),
        rd=N(vec3(uv,1)), rdd=rd;
        cam(p); cam(rd);
        col=march(p,rd);
        col=S(-.2,.9,col);
        vec2 sn=.5+vec2(atan(rdd.x,rdd.z),atan(length(rdd.xz),rdd.y))/6.28318;
        col=max(col,vec3(sky(sn,true)+sky(2.+sn*2.,true)));
        float t=min((time-.5)*.3,1.);
        uv=FC/R*2.-1.;
        uv*=.7;
        float v=pow(dot(uv,uv),1.8);
        col=mix(col,vec3(0),v);
        col=mix(vec3(0),col,t);
        col=max(col,.08);
  O=vec4(col,1);
}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer class adapted for React
    class Renderer {
      private vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
      private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
      private gl: WebGL2RenderingContext;
      private scale: number;
      private shaderSource: string;
      private mouseMove = [0, 0];
      private mouseCoords = [0, 0];
      private program: WebGLProgram | null = null;
      private vs: WebGLShader | null = null;
      private fs: WebGLShader | null = null;
      private buffer: WebGLBuffer | null = null;

      constructor(canvas: HTMLCanvasElement, scale: number) {
        const gl = canvas.getContext("webgl2");
        if (!gl) throw new Error('WebGL2 not supported');
        
        this.gl = gl;
        this.scale = scale;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.shaderSource = fragmentShader;
      }

      updateMove(deltas: number[]) {
        this.mouseMove = deltas;
      }

      updateMouse(coords: number[]) {
        this.mouseCoords = coords;
      }

      updateScale(scale: number) {
        this.scale = scale;
        this.gl.viewport(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      }

      compile(shader: WebGLShader, source: string) {
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
        }
      }

      setup() {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER)!;
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        this.compile(this.vs, this.vertexSrc);
        this.compile(this.fs, this.shaderSource);
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(this.program));
        }
      }

      init() {
        const { gl, program } = this;
        if (!program) return;
        
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        (program as any).resolution = gl.getUniformLocation(program, "resolution");
        (program as any).time = gl.getUniformLocation(program, "time");
        (program as any).move = gl.getUniformLocation(program, "move");
      }

      render(now = 0) {
        const { gl, program, buffer, mouseMove } = this;
        if (!program || !canvas) return;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        if (buffer) gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
        gl.uniform1f((program as any).time, now * 1e-3);
        gl.uniform2f((program as any).move, mouseMove[0], mouseMove[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    // PointerHandler class adapted for React
    class PointerHandler {
      private scale: number;
      private active = false;
      private pointers = new Map();
      private lastCoords = [0, 0];
      private moves = [0, 0];

      constructor(element: HTMLCanvasElement, scale: number) {
        this.scale = scale;
        const map = (element: HTMLCanvasElement, scale: number, x: number, y: number) => {
          const rect = element.getBoundingClientRect();
          const relX = (x - rect.left) * scale;
          const relY = (y - rect.top) * scale;
          return [relX, element.height - relY];
        };

        element.addEventListener("pointerdown", (e) => {
          this.active = true;
          this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
        });

        element.addEventListener("pointerup", (e) => {
          if (this.count === 1) {
            this.lastCoords = this.first;
          }
          this.pointers.delete(e.pointerId);
          this.active = this.pointers.size > 0;
          // Reset moves when pointer is released
          this.moves = [0, 0];
        });

        element.addEventListener("pointermove", (e) => {
          if (!this.active) return;
          this.lastCoords = [e.clientX, e.clientY];
          this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
          this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
        });
      }

      get count() {
        return this.pointers.size;
      }

      get move() {
        return this.moves;
      }

      get first() {
        return this.pointers.values().next().value || this.lastCoords;
      }
      
      dampen() {
        this.moves = this.moves.map((move: number) => move * 0.95);
      }
    }

    // Initialize WebGL components
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    
    const resize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      if (rendererRef.current) {
        rendererRef.current.updateScale(dpr);
      }
    };

    const loop = (now: number) => {
      if (rendererRef.current && pointersRef.current) {
        rendererRef.current.updateMouse(pointersRef.current.first);
        rendererRef.current.updateMove(pointersRef.current.move);
        rendererRef.current.render(now);
        // Add damping to moves for smoother interaction
        pointersRef.current.dampen();
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    try {
      rendererRef.current = new Renderer(canvas, dpr);
      pointersRef.current = new PointerHandler(canvas, dpr);
      
      rendererRef.current.setup();
      rendererRef.current.init();
      
      resize();
      loop(0);
      
      window.addEventListener('resize', resize);
    } catch (error) {
      console.error('Failed to initialize shader background:', error);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover z-0 ${className}`}
      style={{ 
        width: '100%', 
        height: '100%',
        touchAction: 'none'
      }}
      data-testid="shader-background"
    />
  );
}