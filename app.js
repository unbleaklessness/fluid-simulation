window.onload = function() { 
    var canvasWidth = 500
    var canvasHeight = 500

    var canvas = document.createElement('CANVAS')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    document.documentElement.appendChild(canvas)
    var context = canvas.getContext('2d')

    var N = 100
    var SIZE = (N + 2) * (N + 2)

    var uPrev = []
    var vPrev = []
    var densPrev = []
    
    var u = []
    var v = []
    var dens = []

    var x = []

    var cell = function(i, k) {
        return i + (N + 2) * k
    }
    
    for (var i = 0; i < N + 3; i++) {
        for (var j = 0; j < N + 2; j++) {
            densPrev[cell(i, j)] = 0
            uPrev[cell(i, j)] = 0
            vPrev[cell(i, j)] = 0
            x[cell(i, j)] = 0
            u[cell(i, j)] = 0
            v[cell(i, j)] = 0
            dens[cell(i, j)] = 0
        }
    }
    
    // for (var i = 30; i < 50; i++) {
    //     for (var j = 30; j < 50; j++) {
    //         densPrev[cell(i, j)] = 0.01
    //     }
    // }
    
    var now = Date.now()
    var then = now
    var elapsed
    var fps = 20
    var fpsInterval = 1000 / fps
    
    var self = this
    
    var frame = function() {
        animationFrameId = requestAnimationFrame(frame)
        now = Date.now()
        elapsed = now - then
        if (elapsed > fpsInterval) {
            then = now
            velStep(N, u, v, uPrev, vPrev, 1000, elapsed)
            densStep(N, dens, densPrev, u, v, 1000, elapsed)
            fade(1, dens, u, v, densPrev, uPrev, vPrev)
            context.clearRect(0, 0, 10000, 10000)
            // console.log(dens[cell(50, 50)])
            for (var i = 0; i <= N + 3; i++) {
                for (var j = 0; j <= N + 2; j++) {
                    context.fillStyle = '#' + parseInt(dens[cell(i, j)] * 100000, 16)
                    context.fillRect(i * 5, j * 5, 5, 5)
                }
            }
        }
    }
    frame()
    
    var fade = function(value, dens, u, v, densPrev, uPrev, vPrev) {
        for (var i = 0; i <= N + 3; i++) {
            for (var j = 0; j <= N + 2; j++) {
                densPrev[cell(i, j)] -= densPrev[cell(i, j)] / 100 * value
                uPrev[cell(i, j)] -= uPrev[cell(i, j)] / 100 * value
                vPrev[cell(i, j)] -= vPrev[cell(i, j)] / 100 * value
                dens[cell(i, j)] -= dens[cell(i, j)] / 100 * value
                u[cell(i, j)] -= u[cell(i, j)] / 100 * value
                v[cell(i, j)] -= v[cell(i, j)] / 100 * value
            }
        }
    }
    
    var setBnd = function(N, b, x) {
        for (var i = 1; i <= N; i++) {
            x[cell(0, i)] = b == 1 ? -x[cell(1, i)] : x[cell(1, i)]
            x[cell(N + 1, i)] = b == 1 ? -x[cell(N, i)] : x[cell(N, i)]
            x[cell(i, 0)] = b == 2 ? -x[cell(i, 1)] : x[cell(i, 1)]
            x[cell(i, N + 1)] = b == 2 ? -x[cell(i, N)] : x[cell(i, N)]
        }
        x[cell(0, 0)] = 0.5 * (x[cell(1, 0)] + x[cell(0, 1)])
        x[cell(0, N + 1)] = 0.5 * (x[cell(1, N + 1)] + x[cell(0, N)])
        x[cell(N + 1, 0)] = 0.5 * (x[cell(N, 0)] + x[cell(N + 1, 1)])
        x[cell(N + 1, N + 1)] = 0.5 * (x[cell(N, N + 1)] + x[cell(N + 1, N)])
    }
    
    var addSource = function(N, x, s, dt) {
        var size = (N + 2) * (N + 2)
        for (var i = 0; i < size; i++) {
            x[i] += dt * s[i]
        }
    }
    
    var diffuse = function(N, b, x, x0, diff, dt) {
        var a = dt * diff * N * N
        for (var k = 0; k < 20; k++) {
            for (var i = 1; i <= N; i++) {
                for (var j = 1; j <= N; j++) {
                    x[cell(i, j)] = (x0[cell(i, j)] + a * (x[cell(i - 1, j)] + x[cell(i + 1, j)] + x[cell(i, j - 1)] + x[cell(i, j + 1)]))/(1 + 4 * a)
                }
            }
            setBnd(N, b, x)
        }
    }
    
    var advect = function(N, b, d, d0, u, v, dt) {
        var dt0 = dt * N
        for (var i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                var x = i - dt0 * u[cell(i, j)]
                var y = j - dt0 * v[cell(i, j)]
                if (x < 0.5) { x = 0.5 }
                if (x > N + 0.5) { x = N + 0.5 }
                i0 = Math.floor(x)
                i1 = i0 + 1
                if (y < 0.5) { y = 0.5 }
                if (y > N + 0.5) { y = N + 0.5 }
                j0 = Math.floor(y)
                j1 = j0 + 1
                s1 = x - i0
                s0 = 1 - s1
                t1 = y - j0
                t0 = 1 - t1
                d[cell(i, j)] = s0 * (t0 * d0[cell(i0, j0)] + t1 * d0[cell(i0, j1)]) + s1 * (t0 * d0[cell(i1, j0)] + t1 * d0[cell(i1, j1)])
            }
        }
        setBnd(N, b, d)
    }
    
    var densStep = function(N, x, x0, u, v, diff, dt) {
        addSource(N, x, x0, dt)
        x0 = [x, x = x0][0]
        diffuse(N, 0, x, x0, diff, dt)
        x0 = [x, x = x0][0]
        advect(N, 0, x, x0, u, v, dt)
    }
    
    var project = function(N, u, v, p, div) {
        var h = 1 / N
        for (var i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                div[cell(i, j)] = -0.5 * h * (u[cell(i + 1, j)] - u[cell(i - 1, j)] + v[cell(i, j + 1)] - v[cell(i, j - 1)])
                p[cell(i, j)] = 0
            }
        }
        setBnd(N, 0, div)
        setBnd(N, 0, p)
        for (var k = 0; k < 20; k++) {
            for (var i = 1; i <= N; i++) {
                for (var j = 1; j <= N; j++) {
                    p[cell(i, j)] = (div[cell(i, j)] + p[cell(i - 1, j)] + p[cell(i + 1, j)] + p[cell(i, j - 1)] + p[cell(i, j + 1)]) / 4
                }
            }
            setBnd(N, 0, p)
        }
        for (var i = 1; i <= N; i++) {
            for (var j = 1; j <= N; j++) {
                u[cell(i, j)] -= 0.5 * (p[cell(i + 1, j)] - p[cell(i - 1, j)]) / h
                v[cell(i, j)] -= 0.5 * (p[cell(i, j + 1)] - p[cell(i, j - 1)]) / h
            }
        }
        setBnd(N, 1, u)
        setBnd(N, 2, v)
    }
    
    var velStep = function(N, u, v, u0, v0, visc, dt) {
        addSource(N, u, u0, dt)
        addSource(N, v, v0, dt)
        u0 = [u, u = u0][0]
        diffuse(N, 1, u, u0, visc, dt)
        v0 = [v, v = v0][0]
        diffuse(N, 2, v, v0, visc, dt)
        project(N, u, v, u0, v0)
        u0 = [u, u = u0][0]
        v0 = [v, v = v0][0]
        advect(N, 1, u, u0, u0, v0, dt)
        advect(N, 2, v, v0, u0, v0, dt)
        project(N, u, v, u0, v0)
    }
    
    canvas.onmousemove = function(event) {
        cellX = Math.floor(event.x / canvasWidth * 100)
        cellY = Math.floor(event.y / canvasHeight * 100)
        densPrev[cell(cellX, cellY)] += 0.1
    }
}