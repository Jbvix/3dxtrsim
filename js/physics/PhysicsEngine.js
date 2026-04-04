import * as THREE from 'three';

export class PhysicsEngine {
    constructor() {
        this.gravity = 9.81;
    }

    // Retorna a Força e o Torque brutos calculados do Tugboat 
    // com base nos controles e simetria dos Azimuthais
    calculateTugboatThrust(tug, cgOffset) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        let totalTorque = 0;

        const thrusters = [
            { angle: tug.asdControls.port.angle, thrust: tug.asdControls.port.thrust, posX: -tug.physics.thrusterOffset.x },
            { angle: tug.asdControls.starboard.angle, thrust: tug.asdControls.starboard.thrust, posX: tug.physics.thrusterOffset.x }
        ];

        thrusters.forEach(thruster => {
            const power = (thruster.thrust / 100) * tug.physics.maxThrust;
            const angleRad = THREE.MathUtils.degToRad(thruster.angle);
            const localForce = new THREE.Vector3(Math.sin(angleRad), 0, Math.cos(angleRad)).multiplyScalar(power);
            
            // Torque em 2D
            const leverArmOffset = new THREE.Vector3(thruster.posX, 0, tug.physics.thrusterOffset.z).sub(cgOffset);
            const torque = leverArmOffset.x * localForce.z - leverArmOffset.z * localForce.x;
            totalTorque += torque;

            const globalForce = localForce.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), tug.state.yaw);
            totalForce.add(globalForce);
        });

        return { totalForce, totalTorque };
    }

    // Calcula os efeitos do Vento e da Correnteza
    calculateEnvironment(entity, environmentControls, isShip = false) {
        let force = new THREE.Vector3(0, 0, 0);
        let torque = 0;
        const physics = entity.physics;

        // VENTO
        if (environmentControls.wind.strength > 0) {
            const windDirRad = THREE.MathUtils.degToRad(environmentControls.wind.direction);
            const windVector = new THREE.Vector3(Math.sin(windDirRad), 0, Math.cos(windDirRad)).normalize();
            
            const relativeYaw = (isShip ? entity.state.yaw + Math.PI/2 : entity.state.yaw) - windDirRad;
            const frontalAreaRatio = Math.abs(Math.cos(relativeYaw));
            const sideAreaRatio = Math.abs(Math.sin(relativeYaw));
            
            const effectiveArea = (frontalAreaRatio * 0.2) + (sideAreaRatio * 1.0);
            const windForceMagnitude = physics.windCoefficient * Math.pow(environmentControls.wind.strength, 2) * effectiveArea;
            
            force.add(windVector.clone().multiplyScalar(windForceMagnitude));
            torque += windForceMagnitude * physics.windLeverArm * Math.sign(Math.sin(relativeYaw));
        }

        // CORRENTEZA
        if (environmentControls.current.strength > 0) {
            const currentDirRad = THREE.MathUtils.degToRad(environmentControls.current.direction);
            const currentVector = new THREE.Vector3(Math.sin(currentDirRad), 0, Math.cos(currentDirRad)).normalize();
            
            const relativeYaw = (isShip ? entity.state.yaw + Math.PI/2 : entity.state.yaw) - currentDirRad;
            const sideAreaRatio = Math.abs(Math.sin(relativeYaw));
            
            const currentForceMagnitude = physics.currentCoefficient * Math.pow(environmentControls.current.strength, 2) * sideAreaRatio;
            
            force.add(currentVector.clone().multiplyScalar(currentForceMagnitude));
            torque += currentForceMagnitude * physics.currentLeverArm * Math.sign(Math.sin(relativeYaw));
        }

        return { force, torque };
    }

    applyNewtonDynamics(entity, totalForce, totalTorque, dt) {
        const physics = entity.physics;
        const state = entity.state;

        const linearAcc = totalForce.clone().divideScalar(physics.mass);
        state.velocity.add(linearAcc.multiplyScalar(dt));

        // Drag Lateral / Deriva
        const forwardDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
        const rightDir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
        
        let velFwd = state.velocity.dot(forwardDir);
        let velLat = state.velocity.dot(rightDir);

        velFwd *= (1.0 - (1.0 - physics.linearDamping) * dt * 60);
        velLat *= (1.0 - (1.0 - 0.985) * dt * 60); 

        state.velocity.copy(forwardDir.clone().multiplyScalar(velFwd).add(rightDir.clone().multiplyScalar(velLat)));

        const angularAcc = totalTorque / physics.momentOfInertia;
        state.yawRate += angularAcc * dt;
        state.yawRate *= (1.0 - (1.0 - physics.angularDamping) * dt * 60);

        state.position.add(state.velocity.clone().multiplyScalar(dt));
        state.yaw += state.yawRate * dt;
    }
}
