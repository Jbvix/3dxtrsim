import * as THREE from 'three';

export class Tugboat {
    constructor() {
        this.state = {
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(0, 0, 0),
            yaw: 0,
            yawRate: 0,
            boundingBox: new THREE.Box3(),
            isPaused: false,
        };

        this.mooringState = {
            bow: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0.0, 0.7, 5.3), restLength: 0, targetRestLength: 0, isCoupled: false, payActive: false, pullActive: false, isBreakRelease: false },
            stern: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0.0, -0.3, -3.6), restLength: 0, targetRestLength: 0, isCoupled: false, payActive: false, pullActive: false, isBreakRelease: false }
        };

        this.physics = {
            mass: 100000,
            momentOfInertia: 3350000,
            maxThrust: 294210.0,
            linearDamping: 0.98,
            angularDamping: 0.98,
            thrusterOffset: { x: 1.5, z: -6.5 }, 
            thrusterDistance: 3.0, 
            lineStiffness: 40.0,
            lineDamping: 0.85,
            lineBreakingLoad: 102 * 9807,
            windCoefficient: 1000,
            currentCoefficient: 15000,
            windLeverArm: 2,
            currentLeverArm: 1,
        };

        this.asdControls = {
            port: { angle: 0, thrust: 0 },
            starboard: { angle: 0, thrust: 0 }
        };

        // Instâncias Gráficas (Serão associadas no Loader de app.js)
        this.meshGroup = null; 
        this.cgPivot = null;
        this.colliderMesh = null;
    }
}
