document.addEventListener('DOMContentLoaded', () => {

    // --- WEBGL LIGHTNING SHADER (HERO ODYSSEY) ---
    const canvas = document.getElementById('lightning-canvas');

    if (canvas) {
        const gl = canvas.getContext('webgl');

        if (!gl) {
            console.error('WebGL not supported');
        } else {
            // Shader Sources
            const vertexShaderSource = `
                attribute vec2 aPosition;
                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);
                }
            `;

            const fragmentShaderSource = `
                precision mediump float;
                uniform vec2 iResolution;
                uniform float iTime;
                uniform float uHue;
                
                #define OCTAVE_COUNT 10

                // Convert HSV to RGB
                vec3 hsv2rgb(vec3 c) {
                    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                    return c.z * mix(vec3(1.0), rgb, c.y);
                }

                float hash11(float p) {
                    p = fract(p * .1031);
                    p *= p + 33.33;
                    p *= p + p;
                    return fract(p);
                }

                float hash12(vec2 p) {
                    vec3 p3 = fract(vec3(p.xyx) * .1031);
                    p3 += dot(p3, p3.yzx + 33.33);
                    return fract((p3.x + p3.y) * p3.z);
                }

                mat2 rotate2d(float theta) {
                    float c = cos(theta);
                    float s = sin(theta);
                    return mat2(c, -s, s, c);
                }

                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 fp = fract(p);
                    float a = hash12(ip);
                    float b = hash12(ip + vec2(1.0, 0.0));
                    float c = hash12(ip + vec2(0.0, 1.0));
                    float d = hash12(ip + vec2(1.0, 1.0));
                    
                    vec2 t = smoothstep(0.0, 1.0, fp);
                    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
                }

                float fbm(vec2 p) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < OCTAVE_COUNT; ++i) {
                        value += amplitude * noise(p);
                        p *= rotate2d(0.45);
                        p *= 2.0;
                        amplitude *= 0.5;
                    }
                    return value;
                }

                void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
                    vec2 uv = fragCoord / iResolution.xy;
                    uv = 2.0 * uv - 1.0;
                    uv.x *= iResolution.x / iResolution.y;
                    
                    // Lightning Shape (Slower Speed: 0.2)
                    uv += 2.0 * fbm(uv * 1.5 + 0.8 * iTime * 0.2) - 1.0;
                    
                    float dist = abs(uv.x);
                    
                    // Color Logic (Green Hue ~150/360 = 0.41)
                    vec3 baseColor = hsv2rgb(vec3(uHue, 0.8, 0.8));
                    
                    // Intensity (Slower Pulse)
                    vec3 col = baseColor * pow(mix(0.0, 0.08, hash11(iTime * 0.2)) / dist, 1.0);
                    
                    fragColor = vec4(col, 1.0);
                }

                void main() {
                    mainImage(gl_FragColor, gl_FragCoord.xy);
                }
            `;

            // Compile Shader Helper
            const compileShader = (source, type) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            };

            const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
            const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

            if (vertexShader && fragmentShader) {
                const program = gl.createProgram();
                gl.attachShader(program, vertexShader);
                gl.attachShader(program, fragmentShader);
                gl.linkProgram(program);
                gl.useProgram(program);

                // Buffer Setup
                const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
                const vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

                const aPosition = gl.getAttribLocation(program, "aPosition");
                gl.enableVertexAttribArray(aPosition);
                gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

                // Uniforms
                const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
                const iTimeLocation = gl.getUniformLocation(program, "iTime");
                const uHueLocation = gl.getUniformLocation(program, "uHue");

                // Render Loop
                const startTime = performance.now();
                const resizeCanvas = () => {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                    gl.viewport(0, 0, canvas.width, canvas.height);
                };

                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();

                const render = () => {
                    const currentTime = performance.now();
                    gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
                    gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);

                    // Hue 152deg (Green) normalized to 0-1 range -> 152/360 = 0.422
                    gl.uniform1f(uHueLocation, 0.422);

                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    requestAnimationFrame(render);
                };

                render();
            }
        }
    }

    // --- FAQ ACCORDION ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            question.classList.toggle('active');
            if (question.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.classList.add('open');
            } else {
                answer.style.maxHeight = 0;
                answer.classList.remove('open');
            }
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== question && otherQuestion.classList.contains('active')) {
                    otherQuestion.classList.remove('active');
                    otherQuestion.nextElementSibling.style.maxHeight = 0;
                    otherQuestion.nextElementSibling.classList.remove('open');
                }
            });
        });
    });

    // --- SCROLL ANIMATIONS ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.section-title, .card, .feature-card, .step, .problem-item, .testimonial-card, .col, .fade-in-up');

    animatedElements.forEach(el => {
        // Force initial state via JS to ensure animation happens
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(el);
    });

    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // --- SHOOTING STARS INITIALIZATION ---
    // Create multiple shooting star layers with different colors and speeds
    if (window.ShootingStars) {
        // Layer 1: Primary brand color (green)
        new ShootingStars('shooting-stars-container', {
            starColor: '#169E5F',
            trailColor: '#0a5030',
            minSpeed: 15,
            maxSpeed: 35,
            minDelay: 1000,
            maxDelay: 3000,
            starWidth: 12,
            starHeight: 1.5
        });

        // Layer 2: Complementary cyan/blue
        new ShootingStars('shooting-stars-container', {
            starColor: '#2EB9DF',
            trailColor: '#1a6d8a',
            minSpeed: 10,
            maxSpeed: 25,
            minDelay: 2000,
            maxDelay: 4000,
            starWidth: 10,
            starHeight: 1
        });

        // Layer 3: Subtle white/silver
        new ShootingStars('shooting-stars-container', {
            starColor: '#ffffff',
            trailColor: '#888888',
            minSpeed: 20,
            maxSpeed: 40,
            minDelay: 1500,
            maxDelay: 3500,
            starWidth: 8,
            starHeight: 1
        });
    }
});
