/*
  Título: Principal JS do Painel ASD 2D
  Autor: Jossian Brito
  Data da última modificação: 02/04/2026 09:25
  Versão: 3.4
*/

// ====================== CLASSES PERSONALIZADAS ======================
        // --- CLASSES DE COMPONENTES DE UI (código minificado para brevidade) ---
        class BaseControl{constructor(){this._events={}}
on(e,t){this._events[e]||(this._events[e]=[]),this._events[e].push(t)}
fire(e,t){this._events[e]&&this._events[e].forEach(e=>e(t))}}
class AzimuthControl2D extends BaseControl{constructor(e){super(),this.canvas=document.getElementById(e),this.canvas.width=this.canvas.getBoundingClientRect().width,this.canvas.height=this.canvas.getBoundingClientRect().height,this.ctx=this.canvas.getContext("2d"),this.radius=this.canvas.width/2,this.center={x:this.radius,y:this.radius},this.state={angle:0,thrust:0},this.handlePosition={x:this.center.x,y:this.center.y},this.isDragging=!1,this.activePointerId=null,this.isReturningToCenter=!1,this.lastClickTime=0,this._initListeners(),this.animate()}
_initListeners(){this.canvas.addEventListener("pointerdown",this._handlePointerDown.bind(this)),window.addEventListener("pointermove",this._handlePointerMove.bind(this)),window.addEventListener("pointerup",this._handlePointerUp.bind(this)),window.addEventListener("pointercancel",this._handlePointerUp.bind(this))}
_handlePointerDown(e){this.isReturningToCenter=!1;const t=Date.now(),s=t-this.lastClickTime;s<300?(this.fire("doubleclick"),this.isDragging=!1,this.activePointerId=null,this.lastClickTime=0):((this.lastClickTime=t,this.isDragging=!0,this.activePointerId=e.pointerId,this._updateControl(e)))}
_handlePointerMove(e){this.isDragging&&!this.isReturningToCenter&&e.pointerId===this.activePointerId&&this._updateControl(e)}
_handlePointerUp(e){this.isDragging&&e.pointerId===this.activePointerId&&(this.isDragging=!1,this.activePointerId=null)}
_zeroOutControl(){this.isReturningToCenter=!0}
_updateControl(e){const t=this.canvas.getBoundingClientRect(),s=e.clientX-t.left,i=e.clientY-t.top,n=s-this.center.x,a=i-this.center.y;let o=Math.sqrt(n*n+a*a);let l=Math.atan2(a,n);let r=180/Math.PI*l+90;r<0&&(r+=360),o>this.radius*.85&&(o=this.radius*.85),this.handlePosition.x=this.center.x+Math.cos(l)*o,this.handlePosition.y=this.center.y+Math.sin(l)*o;const h=o/(this.radius*.85)*100;this.state={angle:r,thrust:h},this.fire("change",this.state)}
draw(){const e=this.ctx;e.clearRect(0,0,this.canvas.width,this.canvas.height),e.strokeStyle="#567a9e",e.lineWidth=4,e.beginPath(),e.arc(this.center.x,this.center.y,this.radius*.9,0,2*Math.PI),e.stroke(),e.fillStyle="#c1d7ee",e.font="12px Arial",e.textAlign="center",e.textBaseline="middle";const t={"0°":-Math.PI/2,"90°":0,"180°":Math.PI/2,"270°":Math.PI};for(const[s,i]of Object.entries(t)){const t=this.radius*.75;e.fillText(s,this.center.x+Math.cos(i)*t,this.center.y+Math.sin(i)*t)}
e.strokeStyle="#34e7e4",e.lineWidth=3,e.beginPath(),e.moveTo(this.center.x,this.center.y),e.lineTo(this.handlePosition.x,this.handlePosition.y),e.stroke();const s=Math.atan2(this.handlePosition.y-this.center.y,this.handlePosition.x-this.center.x);e.save(),e.translate(this.handlePosition.x,this.handlePosition.y),e.rotate(s),e.fillStyle="#34e7e4",e.beginPath(),e.moveTo(0,0),e.lineTo(-10,-5),e.lineTo(-10,5),e.closePath(),e.fill(),e.restore(),e.fillStyle="rgba(236, 240, 241, 0.9)",e.strokeStyle="#bdc3c7",e.lineWidth=2,e.beginPath(),e.arc(this.handlePosition.x,this.handlePosition.y,12,0,2*Math.PI),e.fill(),e.stroke()}
animate(){if(this.isReturningToCenter){const e=.1,t=this.handlePosition.x-this.center.x,s=this.handlePosition.y-this.center.y;this.handlePosition.x-=t*e,this.handlePosition.y-=s*e;const i=Math.sqrt(t*t+s*s);let n=Math.atan2(s,t);let a=180/Math.PI*n+90;a<0&&(a+=360);const o=i/(this.radius*.85)*100;this.state={angle:a,thrust:o},this.fire("change",this.state),i<1&&(this.isReturningToCenter=!1,this.handlePosition.x=this.center.x,this.handlePosition.y=this.center.y,this.state={angle:0,thrust:0},this.fire("change",this.state))}
this.draw(),requestAnimationFrame(this.animate.bind(this))}}
class AngleIndicator{constructor(e){this.canvas=document.getElementById(e);const t=this.canvas.getBoundingClientRect().width;this.canvas.width=t,this.canvas.height=t,this.ctx=this.canvas.getContext("2d"),this.radius=t/2,this.center={x:this.radius,y:this.radius}}
update(e){const t=this.ctx;t.clearRect(0,0,this.canvas.width,this.canvas.height),t.strokeStyle="#567a9e",t.lineWidth=2,t.beginPath(),t.arc(this.center.x,this.center.y,.8*this.radius,0,2*Math.PI),t.stroke(),t.save(),t.translate(this.center.x,this.center.y),t.rotate(e*Math.PI/180),t.fillStyle="#34e7e4",t.beginPath(),t.moveTo(0,-.7*this.radius),t.lineTo(8,.5*this.radius),t.lineTo(-8,.5*this.radius),t.closePath(),t.fill(),t.restore()}}
class RpmGauge{constructor(e,t=1600){this.canvas=document.getElementById(e);const s=this.canvas.getBoundingClientRect();this.canvas.width=s.width,this.canvas.height=s.height,this.ctx=this.canvas.getContext("2d"),this.maxRpm=t}
update(e){const t=this.ctx,s=this.canvas.width,i=this.canvas.height,n={x:s/2,y:.9*i},a=.8*i;t.clearRect(0,0,s,i);const o=Math.PI,l=0;t.lineWidth=12,t.strokeStyle="#2ecc71",t.beginPath(),t.arc(n.x,n.y,a,o,o+.6*Math.PI),t.stroke(),t.strokeStyle="#f1c40f",t.beginPath(),t.arc(n.x,n.y,a,o+.6*Math.PI,o+.85*Math.PI),t.stroke(),t.strokeStyle="#e74c3c",t.beginPath(),t.arc(n.x,n.y,a,o+.85*Math.PI,l),t.stroke();const r=o+e/this.maxRpm*Math.PI;t.save(),t.translate(n.x,n.y),t.rotate(r),t.strokeStyle="#ecf0f1",t.lineWidth=3,t.beginPath(),t.moveTo(0,0),t.lineTo(.9*a,0),t.stroke(),t.restore()}}

        // --- Instanciação e Gestão de Estado ---
        const uiRefs = {
            bb: { angleIndicator: new AngleIndicator('angle-canvas-bb'), angleValue: document.getElementById('angle-value-bb'), rpmGauge: new RpmGauge('rpm-canvas-bb'), rpmValue: document.getElementById('rpm-value-bb'), controlCanvas: document.getElementById('azimuth-control-bb'), startButton: document.getElementById('start-bb'), coupleButton: document.getElementById('couple-bb'), },
            be: { angleIndicator: new AngleIndicator('angle-canvas-be'), angleValue: document.getElementById('angle-value-be'), rpmGauge: new RpmGauge('rpm-canvas-be'), rpmValue: document.getElementById('rpm-value-be'), controlCanvas: document.getElementById('azimuth-control-be'), startButton: document.getElementById('start-be'), coupleButton: document.getElementById('couple-be'), },
        };

        const masterState = {
            bb: { angle: 0, thrust: 0, engineOn: false, clutchState: 'off' }, // off, standby, engaged
            be: { angle: 0, thrust: 0, engineOn: false, clutchState: 'off' },
        };
        
        const displayState = {
            bb: { angle: 270, rpm: 0 },
            be: { angle: 90, rpm: 0 }
        };

        const controlBB = new AzimuthControl2D('azimuth-control-bb');
        const controlBE = new AzimuthControl2D('azimuth-control-be');
        
        // --- Lógica dos Botões de Função ---
        uiRefs.bb.startButton.addEventListener('click', () => {
            masterState.bb.engineOn = !masterState.bb.engineOn;
            if (!masterState.bb.engineOn) { 
                masterState.bb.clutchState = 'off';
                controlBB._zeroOutControl(); 
            }
        });
        uiRefs.bb.coupleButton.addEventListener('click', () => { 
            if (masterState.bb.engineOn) {
                masterState.bb.clutchState = masterState.bb.clutchState === 'off' ? 'standby' : 'off';
                if(masterState.bb.clutchState === 'off') controlBB._zeroOutControl();
            }
        });
        uiRefs.be.startButton.addEventListener('click', () => {
            masterState.be.engineOn = !masterState.be.engineOn;
            if (!masterState.be.engineOn) {
                masterState.be.clutchState = 'off';
                controlBE._zeroOutControl();
            }
        });
        uiRefs.be.coupleButton.addEventListener('click', () => { 
            if (masterState.be.engineOn) {
                masterState.be.clutchState = masterState.be.clutchState === 'off' ? 'standby' : 'off';
                 if(masterState.be.clutchState === 'off') controlBE._zeroOutControl();
            }
        });

        // --- Lógica de Controlo ---
        controlBB.on('change', (state) => {
            if (masterState.bb.engineOn) {
                 masterState.bb.thrust = state.thrust;
                 if (masterState.bb.clutchState === 'engaged') {
                    masterState.bb.angle = state.angle;
                 }
            }
        });
        controlBB.on('doubleclick', () => {
            if (masterState.bb.clutchState === 'engaged') {
                masterState.bb.clutchState = 'idleRpm';
                masterState.bb.thrust = 65; // CORREÇÃO: Força o comando de aceleração para 650 RPM
                controlBB._zeroOutControl();
            }
        });

        controlBE.on('change', (state) => { 
             if (masterState.be.engineOn) {
                 masterState.be.thrust = state.thrust;
            }
            if (masterState.be.clutchState === 'engaged') {
                masterState.be.angle = state.angle;
            }
        });
        controlBE.on('doubleclick', () => {
            if (masterState.be.clutchState === 'engaged') {
                masterState.be.clutchState = 'idleRpm';
                masterState.be.thrust = 650; // CORREÇÃO: Força o comando de aceleração para 650 RPM
                controlBE._zeroOutControl();
            }
        });
        
        // --- Funções de Interpolação ---
        function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }
        function lerpAngle(start, end, amt) {
            const delta = (end - start + 360 + 180) % 360 - 180;
            return (start + delta * amt + 360) % 360;
        }

        // --- Ciclo Principal de Animação e UI ---
        function animate() {
            const maxRpm = 1600;
            const idleRpm = 650;
            
            const updateSide = (side) => {
                const state = masterState[side];
                const display = displayState[side];
                const ui = uiRefs[side];

                // --- Lógica da Máquina de Estados ---
                let targetRpm = 0;
                let targetAngle;
                
                const commandedPropulsionRpm = state.thrust * (maxRpm / 100);

                if (state.clutchState === 'standby' && commandedPropulsionRpm > idleRpm) {
                    state.clutchState = 'engaged';
                }

                if (state.engineOn) {
                    if (state.clutchState === 'engaged') {
                        targetRpm = commandedPropulsionRpm;
                        targetAngle = state.angle;
                    } else { // 'standby' ou 'off'
                        targetRpm = idleRpm;
                        targetAngle = (side === 'bb') ? 270 : 90;
                    }
                } else {
                    targetRpm = 0;
                    targetAngle = (side === 'bb') ? 270 : 90;
                }
                
                const rpmLerpFactor = 0.03;
                const angleLerpFactor = 0.2;

                display.rpm = lerp(display.rpm, targetRpm, rpmLerpFactor);
                display.angle = lerpAngle(display.angle, targetAngle, angleLerpFactor);

                // --- Atualização da UI ---
                ui.controlCanvas.classList.toggle('disabled', !state.engineOn);
                ui.startButton.classList.toggle('active', state.engineOn);
                ui.coupleButton.disabled = !state.engineOn;
                
                ui.coupleButton.classList.remove('active', 'standby');
                if (state.clutchState === 'engaged') {
                    ui.coupleButton.classList.add('active');
                } else if (state.clutchState === 'standby') {
                    ui.coupleButton.classList.add('standby');
                }
                
                ui.rpmValue.textContent = `${display.rpm.toFixed(0)}`;
                ui.rpmGauge.update(display.rpm);

                ui.angleValue.textContent = `${display.angle.toFixed(1)}°`;
                ui.angleIndicator.update(display.angle);
            };

            updateSide('bb');
            updateSide('be');

            // Envia o estado atualizado para a janela pai (o simulador)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'asdControlState',
                    payload: {
                        port: {
                            angle: displayState.bb.angle,
                            rpm: displayState.bb.rpm
                        },
                        starboard: {
                            angle: displayState.be.angle,
                            rpm: displayState.be.rpm
                        }
                    }
                }, '*'); // Em produção, use um origin específico para segurança
            }

            requestAnimationFrame(animate);
        }
        
        animate();
