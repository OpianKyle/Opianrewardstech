import { useEffect, useRef } from 'react';

interface StarsBackgroundProps {
  className?: string;
}

export function StarsBackground({ className }: StarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const frameRef = useRef<number>();
  const isActiveRef = useRef(true);
  const lastRenderRef = useRef(0);

  const fragmentShader = `#version 300 es
/*********
* Simplified stars-only background 
*/
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep

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

void main() {
        vec2 uv=(FC-.5*R)/min(R.x,R.y);
        vec3 col=vec3(0);
        
        // Simple camera direction for stars
        vec3 rd=normalize(vec3(uv,1));
        
        // Create starfield
        vec2 sn=.5+vec2(atan(rd.x,rd.z),atan(length(rd.xz),rd.y))/6.28318;
        col=vec3(sky(sn,true)+sky(2.+sn*2.,true));
        
        // Fade edges
        uv=FC/R*2.-1.;
        uv*=.7;
        float v=pow(dot(uv,uv),1.8);
        col=mix(col,vec3(0),v);
        
        // Ensure minimum brightness for black background
        col=max(col,.02);
        
        O=vec4(col,1);
}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Setup IntersectionObserver for performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isActiveRef.current = entry.isIntersecting;
          if (!entry.isIntersecting && frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = undefined;
          } else if (entry.isIntersecting && !frameRef.current && rendererRef.current) {
            loop(0);
          }
        });
      },
      { threshold: 0.2 }
    );
    
    observer.observe(canvas);

    // Mobile detection and optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Simplified Renderer class without mobile interaction
    class StarsRenderer {
      private vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
      private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
      private gl: WebGL2RenderingContext;
      private scale: number;
      private shaderSource: string;
      private program: WebGLProgram | null = null;
      private vs: WebGLShader | null = null;
      private fs: WebGLShader | null = null;
      private buffer: WebGLBuffer | null = null;

      constructor(canvas: HTMLCanvasElement, scale: number, gl: WebGL2RenderingContext) {
        if (!gl) throw new Error('WebGL2 not supported');
        
        this.gl = gl;
        this.scale = scale;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.shaderSource = fragmentShader;
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
      }

      render(now = 0) {
        const { gl, program, buffer } = this;
        if (!program || !canvas) return;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        if (buffer) gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
        gl.uniform1f((program as any).time, now * 1e-3);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }

    // Initialize WebGL components with mobile optimization
    const dpr = isMobile ? 1 : Math.max(1, 0.5 * window.devicePixelRatio);
    const scale = isMobile ? 0.75 : 1;
    
    const resize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      canvas.width = width * dpr * scale;
      canvas.height = height * dpr * scale;
      if (rendererRef.current) {
        rendererRef.current.updateScale(dpr);
      }
    };

    const loop = (now: number) => {
      if (!isActiveRef.current) {
        frameRef.current = undefined;
        return;
      }
      
      // FPS throttling for mobile (30fps)
      if (isMobile && now - lastRenderRef.current < 33) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      
      if (rendererRef.current) {
        rendererRef.current.render(now);
        lastRenderRef.current = now;
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    try {
      // Create WebGL context with mobile-friendly options
      const gl = canvas.getContext('webgl2', { 
        antialias: !isMobile,
        powerPreference: isMobile ? 'low-power' : 'default'
      });
      
      if (!gl) throw new Error('WebGL2 not supported');
      
      rendererRef.current = new StarsRenderer(canvas, dpr, gl);
      
      rendererRef.current.setup();
      rendererRef.current.init();
      
      resize();
      loop(0);
      
      window.addEventListener('resize', resize);
    } catch (error) {
      console.error('Failed to initialize stars background:', error);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      observer.disconnect();
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
        pointerEvents: 'none',
        touchAction: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      data-testid="stars-background"
    />
  );
}