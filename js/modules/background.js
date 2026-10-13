export function initBackground(canvas) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        console.warn("WebGL is not supported, background animation disabled.");
        return;
    }

    const vsSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision highp float;
        uniform vec3 iResolution;
        uniform float iTime;
        uniform vec4 iMouse;

        /*
          Feel free to do anything you want with this code.
          This shader uses "runes" code by FabriceNeyret2 (https://www.shadertoy.com/view/4ltyDM)
          which is based on "runes" by otaviogood (https://shadertoy.com/view/MsXSRn).
          These random runes look good as matrix symbols and have acceptable performance.
        */

        const int ITERATIONS = 40;   //use less value if you need more performance
        const float SPEED = 1.;

        const float STRIP_CHARS_MIN =  7.;
        const float STRIP_CHARS_MAX = 40.;
        const float STRIP_CHAR_HEIGHT = 0.15;
        const float STRIP_CHAR_WIDTH = 0.10;
        const float ZCELL_SIZE = 1. * (STRIP_CHAR_HEIGHT * STRIP_CHARS_MAX);  //the multiplier can't be less than 1.
        const float XYCELL_SIZE = 12. * STRIP_CHAR_WIDTH;  //the multiplier can't be less than 1.

        const int BLOCK_SIZE = 10;  //in cells
        const int BLOCK_GAP = 2;    //in cells

        const float WALK_SPEED = 1. * XYCELL_SIZE;
        const float BLOCKS_BEFORE_TURN = 3.;

        const float PI = 3.14159265359;

        //        ----  random  ----

        float hash(float v) {
            return fract(sin(v)*43758.5453123);
        }

        float hash(vec2 v) {
            return hash(dot(v, vec2(5.3983, 5.4427)));
        }

        vec2 hash2(vec2 v) {
            vec2 seed = vec2(dot(v, vec2(127.1, 311.7)), dot(v, vec2(269.5, 183.3)));
            return fract(sin(seed)*43758.5453123);
        }

        vec4 hash4(vec2 v) {
            vec4 p = vec4(
                dot(v, vec2(127.1, 311.7)),
                dot(v, vec2(269.5, 183.3)),
                dot(v, vec2(113.5, 271.9)),
                dot(v, vec2(246.1, 124.6))
            );
            return fract(sin(p)*43758.5453123);
        }

        vec4 hash4(vec3 v) {
            vec4 p = vec4(
                dot(v, vec3(127.1, 311.7, 74.7)),
                dot(v, vec3(269.5, 183.3, 246.1)),
                dot(v, vec3(113.5, 271.9, 124.6)),
                dot(v, vec3(271.9, 269.5, 311.7))
            );
            return fract(sin(p)*43758.5453123);
        }

        //        ----  symbols  ----
        float rune_line(vec2 p, vec2 a, vec2 b) {
            p -= a, b -= a;
            float h = clamp(dot(p, b) / dot(b, b), 0., 1.);
            return length(p - b * h);
        }

        float rune(vec2 U, vec2 seed, float highlight) {
            float d = 1e5;
            for (int i = 0; i < 4; i++) {
                vec4 pos = hash4(seed);
                seed += 1.;

                if (i == 0) pos.y = .0;
                if (i == 1) pos.x = .999;
                if (i == 2) pos.x = .0;
                if (i == 3) pos.y = .999;
                vec4 snaps = vec4(2, 3, 2, 3);
                pos = ( floor(pos * snaps) + .5) / snaps;

                if (pos.xy != pos.zw)
                    d = min(d, rune_line(U, pos.xy, pos.zw + .001) );
            }
            return smoothstep(0.1, 0., d) + highlight*smoothstep(0.4, 0., d);
        }

        float random_char(vec2 outer, vec2 inner, float highlight) {
            vec2 seed = vec2(dot(outer, vec2(269.5, 183.3)), dot(outer, vec2(113.5, 271.9)));
            return rune(inner, seed, highlight);
        }

        //        ----  digital rain  ----
        vec3 rain(vec3 ro3, vec3 rd3, float time) {
            vec4 result = vec4(0.);
            vec2 ro2 = vec2(ro3);
            vec2 rd2 = normalize(vec2(rd3));

            bool prefer_dx = abs(rd2.x) > abs(rd2.y);
            float t3_to_t2 = prefer_dx ? rd3.x / rd2.x : rd3.y / rd2.y;

            ivec3 cell_side = ivec3(step(0., rd3));
            ivec3 cell_shift = ivec3(sign(rd3));

            float t2 = 0.;
            ivec2 next_cell = ivec2(floor(ro2/XYCELL_SIZE));
            for (int i=0; i<ITERATIONS; i++) {
                ivec2 cell = next_cell;
                float t2s = t2;

                vec2 side = vec2(next_cell + cell_side.xy) * XYCELL_SIZE;
                vec2 t2_side = (side - ro2) / rd2;
                if (t2_side.x < t2_side.y) {
                    t2 = t2_side.x;
                    next_cell.x += cell_shift.x;
                } else {
                    t2 = t2_side.y;
                    next_cell.y += cell_shift.y;
                }

                vec2 cell_in_block = fract(vec2(cell) / float(BLOCK_SIZE));
                float gap = float(BLOCK_GAP) / float(BLOCK_SIZE);
                if (cell_in_block.x < gap || cell_in_block.y < gap || (cell_in_block.x < (gap+0.1) && cell_in_block.y < (gap+0.1))) {
                    continue;
                }

                float t3s = t2s / t3_to_t2;
                float pos_z = ro3.z + rd3.z * t3s;
                float xycell_hash = hash(vec2(cell));
                float z_shift = xycell_hash*11. - time * (0.5 + xycell_hash * 1.0 + xycell_hash * xycell_hash * 1.0 + pow(xycell_hash, 16.) * 3.0);
                float char_z_shift = floor(z_shift / STRIP_CHAR_HEIGHT);
                z_shift = char_z_shift * STRIP_CHAR_HEIGHT;
                int zcell = int(floor((pos_z - z_shift)/ZCELL_SIZE));
                for (int j=0; j<2; j++) {
                    vec4 cell_hash = hash4(vec3(ivec3(cell, zcell)));
                    vec4 cell_hash2 = fract(cell_hash * vec4(127.1, 311.7, 271.9, 124.6));

                    float chars_count = cell_hash.w * (STRIP_CHARS_MAX - STRIP_CHARS_MIN) + STRIP_CHARS_MIN;
                    float target_length = chars_count * STRIP_CHAR_HEIGHT;
                    float target_rad = STRIP_CHAR_WIDTH / 2.;
                    float target_z = (float(zcell)*ZCELL_SIZE + z_shift) + cell_hash.z * (ZCELL_SIZE - target_length);
                    vec2 target = vec2(cell) * XYCELL_SIZE + target_rad + cell_hash.xy * (XYCELL_SIZE - target_rad*2.);

                    vec2 s = target - ro2;
                    float tmin = dot(s, rd2);
                    if (tmin >= t2s && tmin <= t2) {
                        float u = s.x * rd2.y - s.y * rd2.x;
                        if (abs(u) < target_rad) {
                            u = (u/target_rad + 1.) / 2.;
                            float z = ro3.z + rd3.z * tmin/t3_to_t2;
                            float v = (z - target_z) / target_length;
                            if (v >= 0.0 && v < 1.0) {
                                float c = floor(v * chars_count);
                                float q = fract(v * chars_count);
                                vec2 char_hash = hash2(vec2(c+char_z_shift, cell_hash2.x));
                                if (char_hash.x >= 0.1 || c == 0.) {
                                    float time_factor = floor(c == 0. ? time*5.0 :
                                            time*(1.0*cell_hash2.z +
                                                    cell_hash2.w*cell_hash2.w*4.*pow(char_hash.y, 4.)));
                                    float a = random_char(vec2(char_hash.x, time_factor), vec2(u,q), max(1., 3. - c/2.)*0.2);
                                    a *= clamp((chars_count - 0.5 - c) / 2., 0., 1.);
                                    if (a > 0.) {
                                        float attenuation = 1. + pow(0.06*tmin/t3_to_t2, 2.);
                                        vec3 col = (c == 0. ? vec3(1.0, 0.6, 0.85) : vec3(0.9, 0.2, 0.6)) / attenuation;
                                        float a1 = result.a;
                                        result.a = a1 + (1. - a1) * a;
                                        result.xyz = (result.xyz * a1 + col * (1. - a1) * a) / result.a;
                                        if (result.a > 0.98)  return result.xyz;
                                    }
                                }
                            }
                        }
                    }
                    zcell += cell_shift.z;
                }
            }
            return result.xyz * result.a;
        }

        //        ----  main, camera  ----
        vec2 rotate(vec2 v, float a) {
            float s = sin(a);
            float c = cos(a);
            mat2 m = mat2(c, -s, s, c);
            return m * v;
        }

        vec3 rotateX(vec3 v, float a) {
            float s = sin(a);
            float c = cos(a);
            return mat3(1.,0.,0.,0.,c,-s,0.,s,c) * v;
        }

        vec3 rotateY(vec3 v, float a) {
            float s = sin(a);
            float c = cos(a);
            return mat3(c,0.,-s,0.,1.,0.,s,0.,c) * v;
        }

        vec3 rotateZ(vec3 v, float a) {
            float s = sin(a);
            float c = cos(a);
            return mat3(c,-s,0.,s,c,0.,0.,0.,1.) * v;
        }

        float smoothstep1(float x) {
            return smoothstep(0., 1., x);
        }

        void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
            if (STRIP_CHAR_WIDTH > XYCELL_SIZE || STRIP_CHAR_HEIGHT * STRIP_CHARS_MAX > ZCELL_SIZE) {
                fragColor = vec4(1., 0., 0., 1.);
                return;
            }

            vec2 uv = (fragCoord.xy * 2. - iResolution.xy) / iResolution.y;
            float time = iTime * SPEED;

            const float turn_rad = 0.25 / BLOCKS_BEFORE_TURN;
            const float turn_abs_time = (PI/2.*turn_rad) * 1.5;
            const float turn_time = turn_abs_time / (1. - 2.*turn_rad + turn_abs_time);

            float level1_size = float(BLOCK_SIZE) * BLOCKS_BEFORE_TURN * XYCELL_SIZE;
            float level2_size = 4. * level1_size;
            float gap_size = float(BLOCK_GAP) * XYCELL_SIZE;

            vec3 ro = vec3(gap_size/2., gap_size/2., 0.);
            vec3 rd = vec3(uv.x, 2.0, uv.y);

            float tq = fract(time / (level2_size*4.) * WALK_SPEED);
            float t8 = fract(tq*4.);
            float t1 = fract(t8*8.);

            vec2 prev;
            vec2 dir;
            if (tq < 0.25) {
                prev = vec2(0.,0.);
                dir = vec2(0.,1.);
            } else if (tq < 0.5) {
                prev = vec2(0.,1.);
                dir = vec2(1.,0.);
            } else if (tq < 0.75) {
                prev = vec2(1.,1.);
                dir = vec2(0.,-1.);
            } else {
                prev = vec2(1.,0.);
                dir = vec2(-1.,0.);
            }
            float angle = floor(tq * 4.);

            prev *= 4.;

            const float first_turn_look_angle = 0.4;
            const float second_turn_drift_angle = 0.5;
            const float fifth_turn_drift_angle = 0.25;

            vec2 turn;
            float turn_sign = 0.;
            vec2 dirL = rotate(dir, -PI/2.);
            vec2 dirR = -dirL;
            float up_down = 0.;
            float rotate_on_turns = 1.;
            float roll_on_turns = 1.;
            float add_angel = 0.;
            if (t8 < 0.125) {
                turn = dirL;
                turn_sign = -1.;
                angle -= first_turn_look_angle * (max(0., t1 - (1. - turn_time*2.)) / turn_time - max(0., t1 - (1. - turn_time)) / turn_time * 2.5);
                roll_on_turns = 0.;
            } else if (t8 < 0.250) {
                prev += dir;
                turn = dir;
                dir = dirL;
                angle -= 1.;
                turn_sign = 1.;
                add_angel += first_turn_look_angle*0.5 + (-first_turn_look_angle*0.5+1.0+second_turn_drift_angle)*t1;
                rotate_on_turns = 0.;
                roll_on_turns = 0.;
            } else if (t8 < 0.375) {
                prev += dir + dirL;
                turn = dirR;
                turn_sign = 1.;
                add_angel += second_turn_drift_angle*sqrt(1.-t1);
            } else if (t8 < 0.5) {
                prev += dir + dir + dirL;
                turn = dirR;
                dir = dirR;
                angle += 1.;
                turn_sign = 0.;
                up_down = sin(t1*PI) * 0.37;
            } else if (t8 < 0.625) {
                prev += dir + dir;
                turn = dir;
                dir = dirR;
                angle += 1.;
                turn_sign = -1.;
                up_down = sin(-min(1., t1/(1.-turn_time))*PI) * 0.37;
            } else if (t8 < 0.750) {
                prev += dir + dir + dirR;
                turn = dirL;
                turn_sign = -1.;
                add_angel -= (fifth_turn_drift_angle + 1.) * smoothstep1(t1);
                rotate_on_turns = 0.;
                roll_on_turns = 0.;
            } else if (t8 < 0.875) {
                prev += dir + dir + dir + dirR;
                turn = dir;
                dir = dirL;
                angle -= 1.;
                turn_sign = 1.;
                add_angel -= fifth_turn_drift_angle - smoothstep1(t1) * (fifth_turn_drift_angle * 2. + 1.);
                rotate_on_turns = 0.;
                roll_on_turns = 0.;
            } else {
                prev += dir + dir + dir;
                turn = dirR;
                turn_sign = 1.;
                angle += fifth_turn_drift_angle * (1.5*min(1., (1.-t1)/turn_time) - 0.5*smoothstep1(1. - min(1.,t1/(1.-turn_time))));
            }

            if (iMouse.x > 10. || iMouse.y > 10.) {
                vec2 mouse = iMouse.xy / iResolution.xy * 2. - 1.;
                up_down = -0.7 * mouse.y;
                angle += mouse.x;
                rotate_on_turns = 1.;
                roll_on_turns = 0.;
            } else {
                angle += add_angel;
            }

            rd = rotateX(rd, up_down);

            vec2 p;
            if (turn_sign == 0.) {
                p = prev + dir * (turn_rad + 1. * t1);
            } else if (t1 > (1. - turn_time)) {
                float tr = (t1 - (1. - turn_time)) / turn_time;
                vec2 c = prev + dir * (1. - turn_rad) + turn * turn_rad;
                p = c + turn_rad * rotate(dir, (tr - 1.) * turn_sign * PI/2.);
                angle += tr * turn_sign * rotate_on_turns;
                rd = rotateY(rd, sin(tr*turn_sign*PI) * 0.2 * roll_on_turns);
            } else {
                t1 /= (1. - turn_time);
                p = prev + dir * (turn_rad + (1. - turn_rad*2.) * t1);
            }

            rd = rotateZ(rd, angle * PI/2.);
            ro.xy += level1_size * p;
            ro += rd * 0.2;
            rd = normalize(rd);

            vec3 col = rain(ro, rd, time);
            fragColor = vec4(col, 1.);
        }

        void main() {
            mainImage(gl_FragColor, gl_FragCoord.xy);
        }
    `;

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ]), gl.STATIC_DRAW);

    const aPositionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const uMouseLocation = gl.getUniformLocation(program, "iMouse");

    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = canvas.height - e.clientY;
    });

    let startTime = performance.now();

    function render() {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform3f(uResolutionLocation, canvas.width, canvas.height, 1.0);
        const currentTime = (performance.now() - startTime) * 0.001;
        gl.uniform1f(gl.getUniformLocation(program, "iTime"), currentTime);
        gl.uniform4f(uMouseLocation, mouseX, mouseY, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}