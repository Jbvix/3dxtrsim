import * as THREE from 'three';

export class HudJoystickController {
    constructor(canvasId, rpmSliderId, coupleBtnId, side, asdControlsRef) {
        this.canvas = document.getElementById(canvasId);
        this.rpmSlider = document.getElementById(rpmSliderId);
        this.coupleBtn = document.getElementById(coupleBtnId);
        
        this.side = side; // 'port' ou 'starboard'
        this.asdControls = asdControlsRef; // referência a mainTug.asdControls
        
        this.ctx = this.canvas.getContext('2d');
        this._resizeCanvas();
        
        this.center = { x: this.radius, y: this.radius };
        this.handlePosition = { x: this.center.x, y: this.center.y };
        
        this.isDragging = false;
        this.isActive = false; // Começa desligado
        
        this._initListeners();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }
    
    _resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.radius = this.canvas.width / 2;
    }

    _initListeners() {
        this.canvas.addEventListener('pointerdown', this._onDown.bind(this));
        window.addEventListener('pointermove', this._onMove.bind(this));
        window.addEventListener('pointerup', this._onUp.bind(this));
        
        this.rpmSlider.addEventListener('input', (e) => {
            if (this.isActive) {
                this.asdControls[this.side].thrust = parseFloat(e.target.value);
            } else {
                e.target.value = 0; // Bloqueia RPM se desengatado
            }
        });
        
        this.coupleBtn.addEventListener('click', () => {
            this.isActive = !this.isActive;
            if (this.isActive) {
                this.coupleBtn.classList.remove('off');
                this.coupleBtn.classList.add('on');
                this.coupleBtn.textContent = '🟢 ACOPLADO';
                this.canvas.style.opacity = '1.0';
                this.rpmSlider.style.opacity = '1.0';
                this.rpmSlider.disabled = false;
            } else {
                this.coupleBtn.classList.remove('on');
                this.coupleBtn.classList.add('off');
                this.coupleBtn.textContent = '🔴 DESACOPLADO';
                this.canvas.style.opacity = '0.4';
                this.rpmSlider.style.opacity = '0.4';
                this.rpmSlider.value = 0;
                this.rpmSlider.disabled = true;
                
                // Zera inputs
                this.handlePosition = { x: this.center.x, y: this.center.y };
                this.asdControls[this.side].thrust = 0;
            }
        });
    }

    _onDown(e) {
        if (!this.isActive) return;
        this.isDragging = true;
        this._updateControl(e);
    }

    _onMove(e) {
        if (this.isDragging && this.isActive) {
            this._updateControl(e);
        }
    }

    _onUp() {
        if (this.isDragging) {
            this.isDragging = false;
        }
    }
    
    _updateControl(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const dx = mouseX - this.center.x;
        const dy = mouseY - this.center.y;
        
        let dist = Math.sqrt(dx * dx + dy * dy);
        let radian = Math.atan2(dy, dx);
        
        let angleDeg = (180 / Math.PI) * radian + 90;
        if (angleDeg < 0) angleDeg += 360;
        
        // Limitar raio para visualização do círculo (Azimute apenas)
        if (dist > this.radius * 0.85) {
            dist = this.radius * 0.85;
        }
        
        this.handlePosition.x = this.center.x + Math.cos(radian) * dist;
        this.handlePosition.y = this.center.y + Math.sin(radian) * dist;
        
        this.asdControls[this.side].angle = angleDeg;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fundo do círculo
        ctx.strokeStyle = "rgba(100, 200, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.center.x, this.center.y, this.radius * 0.9, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Marcações cardeais
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("N", this.center.x, this.center.y - this.radius * 0.7);
        ctx.fillText("S", this.center.x, this.center.y + this.radius * 0.7);
        ctx.fillText("W", this.center.x - this.radius * 0.7, this.center.y);
        ctx.fillText("E", this.center.x + this.radius * 0.7, this.center.y);
        
        if (!this.isActive) return;

        // Linha indicadora
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.center.x, this.center.y);
        ctx.lineTo(this.handlePosition.x, this.handlePosition.y);
        ctx.stroke();
        
        // Handle (bolinha do azimute)
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(this.handlePosition.x, this.handlePosition.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }

    animate() {
        this.draw();
        
        // Se a interface mudou o valor através do painel original, os HUDs devem atualizar fisicamente.
        // O sincronismo visual inverso para HUD joystick a partir de teclado/manobras programadas 
        if (!this.isDragging && this.isActive) {
            const externalAngle = this.asdControls[this.side].angle;
            const externalThrust = this.asdControls[this.side].thrust;
            
            this.rpmSlider.value = externalThrust;
            
            const radian = (externalAngle - 90) * (Math.PI / 180);
            const r = this.radius * 0.85; 
            this.handlePosition.x = this.center.x + Math.cos(radian) * r;
            this.handlePosition.y = this.center.y + Math.sin(radian) * r;
        }

        requestAnimationFrame(this.animate);
    }
}
