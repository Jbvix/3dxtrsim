import io, re

with io.open('js/main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Add Globals
js = js.replace(
    'let hullGroup, cgPivot;\nlet tug, tugCollider;',
    'let hullGroup, cgPivot;\nlet tug, tugCollider;\nlet shipGroup, shipColliderMesh;'
)

# 2. Add Ship State and Physics
state_block = """
const shipState = {
    position: new THREE.Vector3(50, 0, -30),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: -Math.PI / 6,
    yawRate: 0,
    boundingBox: new THREE.Box3()
};

const shipPhysics = {
    mass: 5000000, 
    momentOfInertia: 150000000, 
    linearDamping: 0.995, 
    angularDamping: 0.995,
    windCoefficient: 8000,
    currentCoefficient: 150000,
    windLeverArm: 10,
    currentLeverArm: 5,
};
"""
js = js.replace('const asdControls = {', state_block + '\nconst asdControls = {')

# 3. Add UI refs
ui_refs = """    topTugSpeed: document.getElementById('topTugSpeed'),
    topShipSpeed: document.getElementById('topShipSpeed'),
    topWind: document.getElementById('topWind'),
    topCurrent: document.getElementById('topCurrent'),"""
js = js.replace('const ui = {', 'const ui = {\n' + ui_refs)

# 4. Modify loadCargoShip
# Find the exact lines pushing the pier collider. We've seen it around line 474:
ship_pier_block = """        portElements.push({
            id: THREE.MathUtils.generateUUID(),
            type: 'pier', // Atua com a mesma física de rebote brutal do pier/oceano
            mesh: shipCollider
        });"""

ship_init_block = """        shipGroup = new THREE.Group();
        shipGroup.add(ship);"""

js = js.replace(ship_pier_block, "        shipColliderMesh = shipCollider;")
js = js.replace('const shipGroup = new THREE.Group();\n        shipGroup.add(ship);', ship_init_block)


# 5. Modify updatePhysics
# We will inject the code right at the start of updatePhysics and before totalForce calculations.
physics_start = 'let totalTorque = 0;'
ship_physics_init = """    let totalTorque = 0;
    
    let totalShipForce = new THREE.Vector3(0, 0, 0);
    let totalShipTorque = 0;"""
js = js.replace(physics_start, ship_physics_init)

# Inject Wind on Ship
wind_tug_code = """totalForce.add(windForceVector);
    totalTorque += lateralWindForce * physics.windLeverArm;"""
wind_ship_code = wind_tug_code + """

    const relativeWindAngleShip = windAngleRad - shipState.yaw;
    const windMagnitudeShip = windSpeed * windSpeed * shipPhysics.windCoefficient;
    const lateralWindForceShip = windMagnitudeShip * Math.sin(relativeWindAngleShip);
    const longitudinalWindForceShip = windMagnitudeShip * Math.cos(relativeWindAngleShip);
    const windForceVectorShip = new THREE.Vector3(lateralWindForceShip, 0, longitudinalWindForceShip).applyAxisAngle(new THREE.Vector3(0,1,0), shipState.yaw);
    totalShipForce.add(windForceVectorShip);
    totalShipTorque += lateralWindForceShip * shipPhysics.windLeverArm;"""
js = js.replace(wind_tug_code, wind_ship_code)

# Inject Current on Ship
curr_tug_code = """totalForce.add(currentForceVector);
    totalTorque += lateralCurrentForce * physics.currentLeverArm;"""
curr_ship_code = curr_tug_code + """

    const relativeCurrentAngleShip = currentAngleRad - shipState.yaw;
    const currentMagnitudeShip = currentSpeed * shipPhysics.currentCoefficient;
    const lateralCurrentForceShip = currentMagnitudeShip * Math.sin(relativeCurrentAngleShip);
    const longitudinalCurrentForceShip = currentMagnitudeShip * Math.cos(relativeCurrentAngleShip);
    const currentForceVectorShip = new THREE.Vector3(lateralCurrentForceShip, 0, longitudinalCurrentForceShip).applyAxisAngle(new THREE.Vector3(0,1,0), shipState.yaw);
    totalShipForce.add(currentForceVectorShip);
    totalShipTorque += lateralCurrentForceShip * shipPhysics.currentLeverArm;"""
js = js.replace(curr_tug_code, curr_ship_code)

# Inject Mooring React Force on Ship
mooring_tug_code = """const lineForceVector = forceDirection.clone().multiplyScalar(totalLineForce);
                totalForce.add(lineForceVector);"""
mooring_ship_code = mooring_tug_code + """
                
                // Identify if bollard is on ship
                const targetBollard = portElements.find(el => el.isShipBollard && el.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(state.bollard) < 0.2);
                if (targetBollard) {
                    const lineForceVectorShip = forceDirection.clone().negate().multiplyScalar(totalLineForce);
                    totalShipForce.add(lineForceVectorShip);
                    
                    const rShip = new THREE.Vector3().subVectors(state.bollard, shipState.position);
                    totalShipTorque += rShip.z * lineForceVectorShip.x - rShip.x * lineForceVectorShip.z;
                }"""
js = js.replace(mooring_tug_code, mooring_ship_code)

# Ship Integration loop
tug_integ_code = """tugState.yaw += tugState.yawRate * dt;"""
ship_integ_code = tug_integ_code + """

    // --- Ship Integration ---
    const shipLinAcc = totalShipForce.clone().divideScalar(shipPhysics.mass);
    shipState.velocity.add(shipLinAcc.multiplyScalar(dt));
    shipState.velocity.multiplyScalar(1.0 - (1.0 - shipPhysics.linearDamping) * dt * 60);

    const shipAngAcc = totalShipTorque / shipPhysics.momentOfInertia;
    shipState.yawRate += shipAngAcc * dt;
    shipState.yawRate *= (1.0 - (1.0 - shipPhysics.angularDamping) * dt * 60);

    shipState.position.add(shipState.velocity.clone().multiplyScalar(dt));
    shipState.yaw += shipState.yawRate * dt;"""
js = js.replace(tug_integ_code, ship_integ_code)

# 6. Update Scene & UI
update_scene_code = """function updateScene() {
    const newPos = tugState.position.clone();
    newPos.y = waterlineY;
    cgPivot.position.copy(newPos);
    cgPivot.rotation.y = tugState.yaw;

    const speedKnots = tugState.velocity.length() * 1.94384; 
    const headingDeg = (THREE.MathUtils.radToDeg(tugState.yaw) % 360 + 360) % 360;
    const yawRateDps = THREE.MathUtils.radToDeg(tugState.yawRate);
    ui.statusSpeed.textContent = `${speedKnots.toFixed(2)} nós`;
    ui.statusHeading.textContent = `${headingDeg.toFixed(1)} °`;
    ui.statusYawRate.textContent = `${yawRateDps.toFixed(2)} °/s`;
}"""
new_update_scene = """function updateScene() {
    const newPos = tugState.position.clone();
    newPos.y = waterlineY;
    cgPivot.position.copy(newPos);
    cgPivot.rotation.y = tugState.yaw;

    if (shipGroup) {
        shipGroup.position.copy(shipState.position);
        shipGroup.rotation.y = shipState.yaw;
    }

    const speedKnots = tugState.velocity.length() * 1.94384; 
    const headingDeg = (THREE.MathUtils.radToDeg(tugState.yaw) % 360 + 360) % 360;
    const yawRateDps = THREE.MathUtils.radToDeg(tugState.yawRate);
    ui.statusSpeed.textContent = `${speedKnots.toFixed(2)} nós`;
    ui.statusHeading.textContent = `${headingDeg.toFixed(1)} °`;
    ui.statusYawRate.textContent = `${yawRateDps.toFixed(2)} °/s`;

    // Update Top Telemetry UI
    const shipSpeedKnots = shipState.velocity.length() * 1.94384;
    if (ui.topTugSpeed) ui.topTugSpeed.textContent = `${speedKnots.toFixed(1)} kn`;
    if (ui.topShipSpeed) ui.topShipSpeed.textContent = `${shipSpeedKnots.toFixed(1)} kn`;
    
    // Wind and Current Top Bar Update
    if (ui.topWind) ui.topWind.textContent = `${environmentControls.wind.strength.toFixed(0)} kn (${environmentControls.wind.direction.toFixed(0)}°)`;
    if (ui.topCurrent) ui.topCurrent.textContent = `${environmentControls.current.strength.toFixed(1)} kn (${environmentControls.current.direction.toFixed(0)}°)`;
}"""
js = js.replace(update_scene_code, new_update_scene)

# 7. checkCollisions bounce against Ship
collisions_pier_block = """    portElements.filter(el => el.type === 'pier').forEach(pierEl => {"""
ship_bounds_code = """
    if (shipColliderMesh && shipGroup) {
        shipColliderMesh.updateWorldMatrix(true, false);
        const shipBox = new THREE.Box3().setFromObject(shipColliderMesh);
        shipState.boundingBox.copy(shipBox);
        
        if (tugState.boundingBox.intersectsBox(shipBox)) {
             const overlap = new THREE.Vector3();
             const tugCenter = tugState.boundingBox.getCenter(new THREE.Vector3());
             const shipCenter = shipBox.getCenter(new THREE.Vector3());
             overlap.subVectors(tugCenter, shipCenter);

             const tugSize = tugState.boundingBox.getSize(new THREE.Vector3());
             const shipSize = shipBox.getSize(new THREE.Vector3());

             const overlapX = (tugSize.x / 2) + (shipSize.x / 2) - Math.abs(overlap.x);
             const overlapZ = (tugSize.z / 2) + (shipSize.z / 2) - Math.abs(overlap.z);

             if(overlapX > 0 && overlapZ > 0){
                if (overlapX < overlapZ) {
                    tugState.position.x += overlapX * Math.sign(overlap.x);
                    tugState.velocity.x *= -0.5;
                } else {
                    tugState.position.z += overlapZ * Math.sign(overlap.z);
                    tugState.velocity.z *= -0.5;
                }
             }
        }
    }
"""
js = js.replace(collisions_pier_block, ship_bounds_code + '\n' + collisions_pier_block)


with io.open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(js)
