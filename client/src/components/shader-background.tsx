import { useEffect, useRef } from 'react';

interface ShaderBackgroundProps {
  className?: string;
  starsOnly?: boolean;
}

export function ShaderBackground({ className, starsOnly = false }: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  // Mobile-optimized shader with reduced precision and iterations
  const fragmentShaderMobile = `#version 300 es
  precision mediump float;
  out vec4 O;
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 move;
  uniform bool starsOnly;
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
    for(float i=min(.0,time); i<4.; i++) {
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
    for(float i=min(.0,time); i<40.; i++) {
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
    if (!starsOnly) {
      col=march(p,rd);
      col=S(-.2,.9,col);
    }
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

  // Desktop shader
  const fragmentShader = `#version 300 es
  precision highp float;
  out vec4 O;
  uniform float time;
  uniform vec2 resolution;
  uniform vec2 move;
  uniform bool starsOnly;
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
    if (!starsOnly) {
      col=march(p,rd);
      col=S(-.2,.9,col);
    }
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

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Performance constants
    const dpr = isMobile ? 1 : Math.max(1, 0.5 * window.devicePixelRatio);
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    // Define loop function early so it can be referenced in IntersectionObserver
    let loop: (now: number) => void;

    // IntersectionObserver to pause when not visible and resume when visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (!entry.isIntersecting && frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = undefined;
          } else if (entry.isIntersecting && !frameRef.current && renderer) {
            // Resume animation when back in view
            frameRef.current = requestAnimationFrame(loop);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(canvas);

    class Renderer {
      private vertexSrc = "#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}";
      private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
      private gl: WebGL2RenderingContext;
      private canvas: HTMLCanvasElement;
      private program: WebGLProgram | null = null;
      private vs: WebGLShader | null = null;
      private fs: WebGLShader | null = null;
      private buffer: WebGLBuffer | null = null;
      private starsOnly: boolean;
      private isMobile: boolean;
      private contextLost = false;

      constructor(canvas: HTMLCanvasElement, starsOnly: boolean, isMobile: boolean) {
        this.canvas = canvas;
        const gl = canvas.getContext("webgl2", {
          powerPreference: isMobile ? "low-power" : "default",
          antialias: !isMobile,
          alpha: false,
          preserveDrawingBuffer: false
        });
        if (!gl) throw new Error("WebGL2 not supported");
        this.gl = gl;
        this.starsOnly = starsOnly;
        this.isMobile = isMobile;

        // Add context loss handling
        canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this));
        canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this));
      }

      handleContextLost(event: Event) {
        event.preventDefault();
        this.contextLost = true;
        console.warn('WebGL context lost');
      }

      handleContextRestored() {
        console.log('WebGL context restored, reinitializing...');
        this.contextLost = false;
        try {
          this.setup();
          this.init();
          this.updateViewport(this.canvas.width, this.canvas.height);
        } catch (error) {
          console.error('Failed to restore WebGL context:', error);
        }
      }

      updateViewport(width: number, height: number) {
        if (this.contextLost) return;
        this.gl.viewport(0, 0, width, height);
      }

      compile(shader: WebGLShader, source: string) {
        if (this.contextLost) return;
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
        }
      }

      setup() {
        if (this.contextLost) return;
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER)!;
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        this.compile(this.vs, this.vertexSrc);
        this.compile(this.fs, this.isMobile ? fragmentShaderMobile : fragmentShader);
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(this.program));
        }
      }

      init() {
        if (this.contextLost) return;
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
        (program as any).starsOnly = gl.getUniformLocation(program, "starsOnly");
      }

      render(now = 0) {
        if (this.contextLost || !this.gl || !this.program || !canvas) return;
        
        try {
          const { gl, program, buffer } = this;

          // auto "move" values to keep cosmic effect alive
          const autoMoveX = Math.sin(now * 0.0001) * 0.5;
          const autoMoveY = Math.cos(now * 0.0001) * 0.5;

          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          if (buffer) gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.uniform2f((program as any).resolution, canvas.width, canvas.height);
          gl.uniform1f((program as any).time, now * 1e-3);
          gl.uniform2f((program as any).move, autoMoveX, autoMoveY);
          gl.uniform1i((program as any).starsOnly, this.starsOnly ? 1 : 0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } catch (error) {
          console.error('WebGL render error:', error);
          this.contextLost = true;
        }
      }
    }

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      if (renderer) {
        renderer.updateViewport(canvas.width, canvas.height);
      }
    };

    loop = (now: number) => {
      if (!isVisibleRef.current) {
        frameRef.current = undefined;
        return;
      }

      // FPS throttling
      if (now - lastFrameTimeRef.current < frameInterval) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }
      
      lastFrameTimeRef.current = now;
      if (renderer) {
        renderer.render(now);
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    let renderer: Renderer;
    try {
      renderer = new Renderer(canvas, starsOnly, isMobile);
      renderer.setup();
      renderer.init();
      resize();
      
      // Only start animation loop if visible
      if (isVisibleRef.current) {
        loop(0);
      }
      
      window.addEventListener("resize", resize);
    } catch (error) {
      console.error("Failed to initialize shader background:", error);
      // Fallback: set canvas to black background
      canvas.style.backgroundColor = '#000000';
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [starsOnly]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover z-0 ${className}`}
      style={{ width: "100%", height: "100%", backgroundColor: "#000000" }}
      data-testid="shader-background"
    />
  );
}