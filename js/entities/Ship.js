import * as THREE from 'three';

export class Ship {
    constructor() {
        this.state = {
            position: new THREE.Vector3(50, 0, -30),
            velocity: new THREE.Vector3(0, 0, 0),
            yaw: -Math.PI / 6,
            yawRate: 0,
            boundingBox: new THREE.Box3(),
            collisionForce: new THREE.Vector3(),
            collisionTorque: 0
        };

        this.controls = { engine: 0, rudder: 0, bowThruster: 0, draft: 5.0 };

        this.physics = {
            mass: 10000000,
            momentOfInertia: 150000000,
            linearDamping: 0.9997,
            angularDamping: 0.998,
            windCoefficient: 8000,
            currentCoefficient: 150000,
            windLeverArm: 10,
            currentLeverArm: 5,
        };

        this.mooringState = {
            bow: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0, 10, 60), restLength: 0, targetRestLength: 0 },
            stern: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0, 10, -60), restLength: 0, targetRestLength: 0 }
        };

        // Instâncias Gráficas (Serão associadas no Loader de app.js)
        this.meshGroup = null; 
        this.colliderMesh = null;
    }
}
