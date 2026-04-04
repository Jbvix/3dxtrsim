export class GameLoop {
    constructor(updateCallback, renderCallback) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;
        this.isRunning = false;
        
        // Timer de estabilidade (Clock)
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.accumulator = 0;
        this.stepSize = 1 / 60; // Frequência de simulação de Física a 60Hz
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop(performance.now());
        }
    }

    stop() {
        this.isRunning = false;
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // Calculando Delta Time limitado para não explodir em travamentos longos
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        if (this.deltaTime > 0.25) this.deltaTime = 0.25; 
        this.lastTime = currentTime;

        this.accumulator += this.deltaTime;

        // Atualização Física Restrita a 60Hz para consistência gravitacional
        while (this.accumulator >= this.stepSize) {
            if (this.updateCallback) {
                this.updateCallback(this.stepSize);
            }
            this.accumulator -= this.stepSize;
        }

        // Atualização Gráfica sem restrição no Main Thread
        if (this.renderCallback) {
            this.renderCallback();
        }

        requestAnimationFrame((time) => this.loop(time));
    }
}
