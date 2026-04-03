/*
  Título: Principal JS do Simulador 3D
  Autor: Jossian Brito
  Data da última modificação: 01/04/2026 22:45
  Versão: 3.3
  Descrição: Ponto de entrada que inicializa a renderização, loop da física e eventos
*/

// ====================== IMPORTS ======================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ====================== VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ======================

// ===== Variáveis Globais =====
let scene, camera, renderer, controls, clock;
let hullGroup, cgPivot;
let tug, tugCollider;
let shipGroup, shipColliderMesh;
let waterlineY = 2.0;
let tugVisualElevationY = 0;
let portThrusterArrow, starboardThrusterArrow, resultantForceArrow;
let windArrow, currentArrow;
let bowLine, sternLine;
let bowMooringPointMarker, sternMooringPointMarker;
let currentView = 'orbit';
let cameraTargetEntity = 'tug';
const cameraViews = {
    bow: { pos: new THREE.Vector3(0, 2, 2), target: new THREE.Vector3(0, 1, 10) },
    stern: { pos: new THREE.Vector3(0, 5, -12), target: new THREE.Vector3(0, 1, -5) },
    port: { pos: new THREE.Vector3(-3, 1, -3), target: new THREE.Vector3(0, 1, -3) },
    starboard: { pos: new THREE.Vector3(3, 1, -3), target: new THREE.Vector3(0, 1, -3) },
};

let raycaster, mouse;
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// ===== Estado da Simulação =====
const tugState = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    yawRate: 0,
    boundingBox: new THREE.Box3(),
    isPaused: false,
};

const mooringState = {
    bow: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0.0, 0.7, 5.3), restLength: 0, targetRestLength: 0 },
    stern: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0.0, -0.3, -3.6), restLength: 0, targetRestLength: 0 }
};

const shipMooringState = {
    bow: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0, 10, 60), restLength: 0, targetRestLength: 0 },
    stern: { isMoored: false, bollard: null, line: null, mooringPoint: new THREE.Vector3(0, 10, -60), restLength: 0, targetRestLength: 0 }
};
const MOORING_DISTANCE_THRESHOLD = 8;
const WINCH_SPEED = 2.0; // m/s


const shipState = {
    position: new THREE.Vector3(50, 0, -30),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: -Math.PI / 6,
    yawRate: 0,
    boundingBox: new THREE.Box3()
};

const debugData = { lineTension: 0, tugForce: 0, shipForce: 0, shipTorque: 0 };
const shipControls = { engine: 0, rudder: 0, bowThruster: 0, draft: 5.0 };
const shipPhysics = {
    mass: 10000000,
    momentOfInertia: 150000000,
    linearDamping: 0.9997,
    angularDamping: 0.998,
    windCoefficient: 8000,
    currentCoefficient: 150000,
    windLeverArm: 10,
    currentLeverArm: 5,
};

const asdControls = {
    port: { angle: 0, thrust: 0 },
    starboard: { angle: 0, thrust: 0 }
};

const environmentControls = {
    wind: { strength: 0, direction: 0 },
    current: { strength: 0, direction: 0 }
};

const physics = {
    mass: 100000,
    momentOfInertia: 3350000,
    maxThrust: 294210.0,
    linearDamping: 0.98,
    angularDamping: 0.98,
    thrusterOffset: { x: 1.5, z: -6.5 }, // Z centralizado no hemisfério da popa
    lineStiffness: 20000.0,
    lineDamping: 0.85,
    lineBreakingLoad: 102 * 9807,
    windCoefficient: 1000,
    currentCoefficient: 20000,
    windLeverArm: 1.5,
    currentLeverArm: 0.5,
};

const buoyPhysics = {
    mass: 20,
    stiffness: 15,
    damping: 10
};

let savedManeuvers = JSON.parse(localStorage.getItem('savedManeuvers')) || [];

// ===== Sandbox de Construção =====
let isConstructionMode = false;
let placementMode = null;
let ghostObject = null;
let constructionGrid;
let portElements = [];
let buoys = [];
let activeBuoyColor = null;
const constructionSettings = {
    elevation: 1.0,
    rotation: 0,
};

// ===== UI Refs =====
const ui = {
    topTugSpeed: document.getElementById('topTugSpeed'),
    shipEngine: document.getElementById('shipEngine'),
    valShipEngine: document.getElementById('valShipEngine'),
    shipRudder: document.getElementById('shipRudder'),
    valShipRudder: document.getElementById('valShipRudder'),
    btnCenterRudder: document.getElementById('btnCenterRudder'),
    shipBowThruster: document.getElementById('shipBowThruster'),
    valShipBowThruster: document.getElementById('valShipBowThruster'),
    shipDraft: document.getElementById('shipDraft'),
    valShipDraft: document.getElementById('valShipDraft'),
    btnCenterThruster: document.getElementById('btnCenterThruster'),
    topShipSpeed: document.getElementById('topShipSpeed'),
    topWind: document.getElementById('topWind'),
    topCurrent: document.getElementById('topCurrent'),
    statusSpeed: document.getElementById('statusSpeed'),
    statusHeading: document.getElementById('statusHeading'),
    statusYawRate: document.getElementById('statusYawRate'),
    cgX: document.getElementById('cgX'),
    cgZ: document.getElementById('cgZ'),
    vX: document.getElementById('vX'),
    vZ: document.getElementById('vZ'),
    elevationY: document.getElementById('elevationY'),
    valElevationY: document.getElementById('valElevationY'),
    scaleParams: document.getElementById('scaleParams'),
    moorBow: document.getElementById('moorBow'),
    moorStern: document.getElementById('moorStern'),
    bowWinchControl: document.getElementById('bowWinchControl'),
    sternWinchControl: document.getElementById('sternWinchControl'),
    bowLineLength: document.getElementById('bowLineLength'),
    sternLineLength: document.getElementById('sternLineLength'),
    valBowLineLength: document.getElementById('valBowLineLength'),
    valSternLineLength: document.getElementById('valSternLineLength'),
    breakingLoad: document.getElementById('breakingLoad'),
    stiffness: document.getElementById('stiffness'),
    valBreakingLoad: document.getElementById('valBreakingLoad'),
    valStiffness: document.getElementById('valStiffness'),
    bowTensionBar: document.getElementById('bowTensionBar'),
    valBowTension: document.getElementById('valBowTension'),
    sternTensionBar: document.getElementById('sternTensionBar'),
    valSternTension: document.getElementById('valSternTension'),
    
    // UI de Atracacao do Navio
    moorShipBow: document.getElementById('moorShipBow'),
    moorShipStern: document.getElementById('moorShipStern'),
    shipBowWinchControl: document.getElementById('shipBowWinchControl'),
    shipSternWinchControl: document.getElementById('shipSternWinchControl'),
    shipBowLineLength: document.getElementById('shipBowLineLength'),
    shipSternLineLength: document.getElementById('shipSternLineLength'),
    valShipBowLineLength: document.getElementById('valShipBowLineLength'),
    valShipSternLineLength: document.getElementById('valShipSternLineLength'),
    valShipBowTension: document.getElementById('valShipBowTension'),
    shipBowTensionBar: document.getElementById('shipBowTensionBar'),
    valShipSternTension: document.getElementById('valShipSternTension'),
    shipSternTensionBar: document.getElementById('shipSternTensionBar'),
    bowPointZ: document.getElementById('bowPointZ'),
    valBowPointZ: document.getElementById('valBowPointZ'),
    bowPointX: document.getElementById('bowPointX'),
    valBowPointX: document.getElementById('valBowPointX'),
    bowPointY: document.getElementById('bowPointY'),
    valBowPointY: document.getElementById('valBowPointY'),
    sternPointZ: document.getElementById('sternPointZ'),
    valSternPointZ: document.getElementById('valSternPointZ'),
    sternPointX: document.getElementById('sternPointX'),
    valSternPointX: document.getElementById('valSternPointX'),
    sternPointY: document.getElementById('sternPointY'),
    valSternPointY: document.getElementById('valSternPointY'),
    addGreenBuoy: document.getElementById('addGreenBuoy'),
    addRedBuoy: document.getElementById('addRedBuoy'),
    clearBuoys: document.getElementById('clearBuoys'),
    windStrength: document.getElementById('windStrength'),
    valWindStrength: document.getElementById('valWindStrength'),
    windDirection: document.getElementById('windDirection'),
    valWindDirection: document.getElementById('valWindDirection'),
    currentStrength: document.getElementById('currentStrength'),
    valCurrentStrength: document.getElementById('valCurrentStrength'),
    currentDirection: document.getElementById('currentDirection'),
    valCurrentDirection: document.getElementById('valCurrentDirection'),
    toggleConstructionMode: document.getElementById('toggleConstructionMode'),
    constructionTools: document.getElementById('construction-tools'),
    constructionOptions: document.getElementById('construction-options'),
    structureElevation: document.getElementById('structureElevation'),
    valStructureElevation: document.getElementById('valStructureElevation'),
    structureRotation: document.getElementById('structureRotation'),
    valStructureRotation: document.getElementById('valStructureRotation'),
    addPier: document.getElementById('addPier'),
    addBollard: document.getElementById('addBollard'),
    clearPort: document.getElementById('clearPort'),
    maneuverName: document.getElementById('maneuverName'),
    saveManeuver: document.getElementById('saveManeuver'),
    maneuverList: document.getElementById('maneuver-list'),
    // Referências para os novos indicadores
    angleValueBB: document.getElementById('angle-value-bb'),
    rpmValueBB: document.getElementById('rpm-value-bb'),
    angleValueBE: document.getElementById('angle-value-be'),
    rpmValueBE: document.getElementById('rpm-value-be'),
    angleBarBB: document.getElementById('angle-bar-bb'),
    rpmBarBB: document.getElementById('rpm-bar-bb'),
    angleBarBE: document.getElementById('angle-bar-be'),
    rpmBarBE: document.getElementById('rpm-bar-be'),
};


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec0ee); // Céu claro diurno
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 2000);
    camera.position.set(20, 15, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    document.getElementById('app').appendChild(renderer.domElement);
    renderer.domElement.addEventListener('pointerdown', onPointerDown, false);
    renderer.domElement.addEventListener('pointermove', onPointerMove, false);


    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const sea = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: 0x1da2d8, metalness: .6, roughness: .2 }));
    sea.rotation.x = -Math.PI / 2;
    scene.add(sea);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    scene.add(new THREE.AmbientLight(0xffffff, 1.3)); // Luz ambiente mais clara
    const dir = new THREE.DirectionalLight(0xffffff, 2.0); // Sol mais forte
    dir.position.set(10, 25, 10);
    scene.add(dir);

    cgPivot = new THREE.Group();
    scene.add(cgPivot);

    hullGroup = new THREE.Group();
    cgPivot.add(hullGroup);

    const cgMarker = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
    cgPivot.add(cgMarker);

    constructionGrid = new THREE.GridHelper(500, 100, 0x444444, 0x444444);
    constructionGrid.position.y = 0.01;
    constructionGrid.visible = false;
    scene.add(constructionGrid);
    // ===== INÍCIO DO CÓDIGO A SER ADICIONADO =====

    function loadLevel(level) {
        console.log(`Carregando Nível: "${level.name}"`);

        // 1. Limpar o cenário atual
        clearPort();
        clearBuoys();

        // 2. Posicionar o Rebocador no estado inicial
        const initialState = level.initialTugState;
        tugState.position.set(initialState.position.x, initialState.position.y, initialState.position.z);
        tugState.velocity.set(0, 0, 0);
        tugState.yaw = THREE.MathUtils.degToRad(initialState.yaw);
        tugState.yawRate = 0;

        // 3. Configurar as Condições Ambientais
        const env = level.environment;
        ui.windStrength.value = env.wind.strength;
        ui.windDirection.value = env.wind.direction;
        ui.currentStrength.value = env.current.strength;
        ui.currentDirection.value = env.current.direction;
        // Dispara o evento 'input' para que a UI e a física sejam atualizadas com os novos valores
        ['windStrength', 'windDirection', 'currentStrength', 'currentDirection'].forEach(id => ui[id].dispatchEvent(new Event('input')));

        // 4. Construir os Elementos do Porto (Cais, Cabeços)
        if (level.portElements) {
            level.portElements.forEach(elementData => {
                placeObjectFromData(elementData);
            });
        }

        // 5. Adicionar as Bóias
        if (level.buoys) {
            level.buoys.forEach(buoyData => {
                const position = new THREE.Vector3(buoyData.position.x, 0, buoyData.position.z);
                createBuoy(position, buoyData.color);
            });
        }

        // Garante que a posição visual do rebocador seja atualizada imediatamente
        cgPivot.position.copy(tugState.position);
        cgPivot.rotation.y = tugState.yaw;

        // Opcional: Fechar o painel de níveis após a seleção
        document.getElementById('panel-levels').style.display = 'none';

        // Garante que o rebocador não esteja em modo pausado de construção
        if (isConstructionMode) {
            exitConstructionMode();
        }
        tugState.isPaused = false;

        // Garante que a rotação da câmera orbital esteja sempre habilitada ao carregar um nível
        controls.enableRotate = true;
    }

    // Função auxiliar para criar objetos do porto a partir dos dados do nível
    function placeObjectFromData(data) {
        let newMesh;
        const objectRotation = THREE.MathUtils.degToRad(data.rotation);

        if (data.type === 'pier') {
            const pierGeo = new RoundedBoxGeometry(8, 1.5, 40, 2, 0.2);
            const pierMat = new THREE.MeshStandardMaterial({ color: 0x605040, metalness: 0.1, roughness: 0.8 });
            newMesh = new THREE.Mesh(pierGeo, pierMat);
            newMesh.position.y = data.position.y - 0.75;
        } else { // 'bollard'
            const bollardGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
            const bollardMat = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.5 });
            newMesh = new THREE.Mesh(bollardGeo, bollardMat);
            newMesh.position.y = data.position.y + 0.4;
        }

        newMesh.position.x = data.position.x;
        newMesh.position.z = data.position.z;
        newMesh.rotation.y = objectRotation;
        scene.add(newMesh);

        portElements.push({
            id: THREE.MathUtils.generateUUID(),
            type: data.type,
            mesh: newMesh,
        });
    }

    // ===== FIM DO CÓDIGO A SER ADICIONADO =====
    loadModel();
    createVisuals();
    setupUIEvents();
    // Adicionar dentro de setupUIEvents()
    const levelData = {
        "nivel-1": {
            name: "Nível 1: Atracação Básica",
            description: "Atraque o rebocador ao cais. Condições ideais, sem obstáculos.",
            initialTugState: { position: { x: 0, y: 0, z: 50 }, yaw: 180 },
            environment: { wind: { strength: 0, direction: 0 }, current: { strength: 0, direction: 0 } },
            portElements: [
                { type: 'pier', position: { x: 0, y: 1.0, z: 0 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: 15 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: -15 }, rotation: 0 }

            ],
            buoys: []
        },
        "nivel-2": {
            name: "Nível 2: Canal de Boias Reto",
            description: "Navegue pelo canal de boias e aproxime-se do cais.",
            initialTugState: { position: { x: 0, y: 0, z: 150 }, yaw: 180 },
            environment: { wind: { strength: 5, direction: 90 }, current: { strength: 0, direction: 0 } },
            portElements: [
                { type: 'pier', position: { x: 0, y: 1.0, z: 0 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: 15 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: -15 }, rotation: 0 }
            ],
            buoys: [
                { color: 'green', position: { x: -10, z: 120 } }, { color: 'red', position: { x: 10, z: 120 } },
                { color: 'green', position: { x: -10, z: 90 } }, { color: 'red', position: { x: 10, z: 90 } },
                { color: 'green', position: { x: -10, z: 60 } }, { color: 'red', position: { x: 10, z: 60 } }
            ]
        },
        "nivel-3a": {
            name: "Nível 3: Curva com Vento a Favor",
            description: "Navegue pelo canal sinuoso até o cais, com vento empurrando para o berço.",
            initialTugState: { position: { x: 80, y: 0, z: 100 }, yaw: 225 },
            environment: { wind: { strength: 15, direction: 270 }, current: { strength: 0, direction: 0 } },
            portElements: [
                { type: 'pier', position: { x: 0, y: 1.0, z: 0 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: -15 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: 15 }, rotation: 0 }
            ],
            buoys: [
                { "color": "red", "position": { "x": 87, "z": 85 } },
                { "color": "green", "position": { "x": 57, "z": 85 } },
                { "color": "red", "position": { "x": 75, "z": 65 } },
                { "color": "green", "position": { "x": 45, "z": 65 } },
                { "color": "red", "position": { "x": 57, "z": 48 } },
                { "color": "green", "position": { "x": 27, "z": 48 } },
                { "color": "red", "position": { "x": 35, "z": 35 } },
                { "color": "green", "position": { "x": 5, "z": 35 } },

            ]
        },
        "nivel-3b": {
            name: "Nível 3: Curva com Corrente Contra",
            description: "Mesmo percurso, mas agora com corrente contrária à atracação.",
            initialTugState: { position: { x: 80, y: 0, z: 100 }, yaw: 225 },
            environment: { wind: { strength: 0, direction: 0 }, current: { strength: 1.5, direction: 90 } },
            portElements: [
                { type: 'pier', position: { x: 0, y: 1.0, z: 0 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: -15 }, rotation: 0 },
                { type: 'bollard', position: { x: -3.5, y: 1.4, z: 15 }, rotation: 0 }

            ],
            buoys: [
                { "color": "red", "position": { "x": 87, "z": 85 } },
                { "color": "green", "position": { "x": 57, "z": 85 } },
                { "color": "red", "position": { "x": 75, "z": 65 } },
                { "color": "green", "position": { "x": 45, "z": 65 } },
                { "color": "red", "position": { "x": 57, "z": 48 } },
                { "color": "green", "position": { "x": 27, "z": 58 } },
                { "color": "red", "position": { "x": 35, "z": 35 } },
                { "color": "green", "position": { "x": 1, "z": 45 } },
                { "color": "red", "position": { "x": 17, "z": 25 } },
                { "color": "green", "position": { "x": -13, "z": 35 } }
            ]
        }
    };

    document.getElementById('level-buttons').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const levelId = e.target.getAttribute('data-level-id');
            if (levelData[levelId]) {
                loadLevel(levelData[levelId]);
            }
        }
    });


    updateMooringPoints();

    // Inicia carregações
    loadModel();
    loadCargoShip();

    animate();
}

function loadModel() {
    const loader = new GLTFLoader();
    const modelPath = './modelo_rebocador/tugboat.glb';
    const onModelLoad = (modelObject) => {
        // Filtra lixos do GLB (Luzes, câmeras, planos d'água transparentes invisíveis) que corrompiam o Rebocador
        const realBox = new THREE.Box3();
        let boxInitialized = false;
        modelObject.traverse((child) => {
            if (child.isMesh && child.visible) {
                if (child.material && child.material.opacity === 0) return;
                const childBox = new THREE.Box3().setFromObject(child);
                if (!boxInitialized) {
                    realBox.copy(childBox);
                    boxInitialized = true;
                } else {
                    realBox.union(childBox);
                }
            }
        });
        if (!boxInitialized) realBox.setFromObject(modelObject);

        const center = realBox.getCenter(new THREE.Vector3());
        // Trava o Eixo X no 0 absoluto para que detalhes assimétricos (ex: um bote só de um lado do barco) não desalinhem a quilha das setas!
        center.x = 0;
        modelObject.position.sub(center);

        // A filtragem "anti-lixo" centralizou o rebocador perfeitamente no Y=0.
        // Se a água está em Y=0, metade do rebocador estava afundando!
        // Precisamos elevar ele da água baseado no tamanho real do casco (baseY).
        const size = realBox.getSize(new THREE.Vector3());
        tugVisualElevationY = size.y * 0.15;
        modelObject.position.y += tugVisualElevationY; // Sobe o rebocador para nivelar a Linha d'agua

        hullGroup.add(modelObject);
        updateCG();
        updateMooringPoints(); // Dispara recálculo com a elevação visual populada

        const scale = modelObject.scale;
        ui.scaleParams.textContent = `${scale.x.toFixed(1)}, ${scale.y.toFixed(1)}, ${scale.z.toFixed(1)}`;

        // Colisor do Rebocador perfeitamente envelopado na malha de metal pintado
        const colliderGeo = new THREE.BoxGeometry(size.x * 0.95, size.y * 1.5, size.z * 0.98);
        const colliderMat = new THREE.MeshBasicMaterial({ visible: false, wireframe: true });
        tugCollider = new THREE.Mesh(colliderGeo, colliderMat);
        hullGroup.add(tugCollider);
    };

    loader.load(modelPath, (gltf) => {
        tug = gltf.scene;
        tug.scale.set(0.5, 0.5, 0.5);
        tug.rotation.y = -Math.PI / 2;
        onModelLoad(tug);

    }, undefined, (err) => {
        console.error('ERRO AO CARREGAR O MODELO:', err);
        const fallback = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 10), new THREE.MeshStandardMaterial({ color: 0x9999aa, metalness: .4, roughness: .6 }));
        onModelLoad(fallback);
    });
}

function loadCargoShip() {
    const loader = new GLTFLoader();
    const modelPath = './modelo_navio/cargo_ship.glb';

    const onModelLoad = (ship) => {
        const bbox = new THREE.Box3().setFromObject(ship);
        // Calcula um BoundingBox rigoroso apenas com Malhas Visíveis
        // Ignora Câmeras nativas do GLTF, Luzes, Ossos (Bones) estendidos infinitos que corrompem o Bounding Box!
        const realBox = new THREE.Box3();
        let boxInitialized = false;
        ship.traverse((child) => {
            if (child.isMesh && child.visible) {
                if (child.material && child.material.opacity === 0) return;
                const childBox = new THREE.Box3().setFromObject(child);
                if (!boxInitialized) {
                    realBox.copy(childBox);
                    boxInitialized = true;
                } else {
                    realBox.union(childBox);
                }
            }
        });
        if (!boxInitialized) realBox.setFromObject(ship);

        const center = realBox.getCenter(new THREE.Vector3());

        // Trava o eixo X no zero absoluto para garantir que guindastes assimétricos não entortem o CG físico
        center.x = 0;

        // Centraliza de verdade o CG físico e rebaixa no Y perfeitamente, usando as medidas completas e justas!
        ship.position.sub(center);

        shipGroup = new THREE.Group();
        shipGroup.add(ship);

        // CRÍTICO: Usar realBox purificado para determinar o tamanho físico do colisor e da navegação vertical!
        const size = realBox.getSize(new THREE.Vector3());

        // Elevação de 40% solicitada pelo usuário (Salva como BASE pra servir de referencia ancorada no Calado)
        shipState.baseY = size.y * 0.4;
        shipState.position.y = shipState.baseY;
        shipGroup.position.set(50, shipState.position.y, -30);
        shipGroup.rotation.y = -Math.PI / 6; // Ângulo para facilitar as abordagens

        scene.add(shipGroup);

        // = Colisionador Físico = (Oculto)
        // Usamos BoxGeometry e setFromObject vai calcular em cima disto super leve!
        const isZAxisLongerCollider = size.z > size.x;
        const shipLength = isZAxisLongerCollider ? size.z * 0.95 : size.x * 0.95;
        // Muitos modelos GLB vêm com "Lixos Laterais" (Water planes, cranes de doca embutidos)
        // que corrompem a leitura geométrica da largura (Width).
        // Em Engenharia Naval, a 'Boca' (Beam) de um Cargueiro é historicamente ~1/6 do seu Comprimento.
        // Vamos forçar o colisor a ter exatamente a proporção do aço, afinando pra escala Panamax:
        const shipWidth = shipLength / 6.6;
        const colliderGeo = new THREE.BoxGeometry(isZAxisLongerCollider ? shipWidth : shipLength, size.y * 1.5, isZAxisLongerCollider ? shipLength : shipWidth);
        const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
        const shipCollider = new THREE.Mesh(colliderGeo, colliderMat);

        // Como o navio foi perfeitamente centralizado, o collider também fica no zero
        shipCollider.position.set(0, 0, 0);
        shipGroup.add(shipCollider);

        shipColliderMesh = shipCollider;

        // == Ancoradouros / Cabeços do Navio ==
        const isZAxisLonger = size.z > size.x;
        shipPhysics.isZAxisLonger = isZAxisLonger;

        // Pega tamanho absoluto só do casco em vez do bounding box com mastros e guindastes orbitando
        const realSize = realBox.getSize(new THREE.Vector3());

        const deckY = -(realSize.y * 0.20); // Altura típica do convés principal baseada do centro (quase waterline) 

        // Criando visual em amarelo chamativo só para distinguir se precisarmos
        const bowBollard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0xe67e22 }));
        const sternBollard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2), new THREE.MeshStandardMaterial({ color: 0x9b59b6 }));

        if (isZAxisLonger) {
            bowBollard.position.set(0, deckY + 0.5, realSize.z / 2 * 0.85); // Recuado pra 0.85 (evita a quina V) e subido levemente pro Castelo
            sternBollard.position.set(0, deckY, -realSize.z / 2 * 0.95);
        } else {
            bowBollard.position.set(realSize.x / 2 * 0.85, deckY + 0.5, 0);
            sternBollard.position.set(-realSize.x / 2 * 0.95, deckY, 0);
        }

        shipGroup.add(bowBollard);
        shipGroup.add(sternBollard);

        // Submete cabeços de atracação aos cabos de guincho
        portElements.push({ id: THREE.MathUtils.generateUUID(), type: 'bollard', isShipBollard: true, shipLocation: 'bow', mesh: bowBollard });
        portElements.push({ id: THREE.MathUtils.generateUUID(), type: 'bollard', isShipBollard: true, shipLocation: 'stern', mesh: sternBollard });

        // Atualiza cordas físicas para saberem de onde precisam sair no navio escalado e rotacionado
        shipMooringState.bow.mooringPoint.copy(bowBollard.position);
        shipMooringState.stern.mooringPoint.copy(sternBollard.position);
    };

    loader.load(modelPath, (gltf) => {
        onModelLoad(gltf.scene);
    }, undefined, (err) => {
        console.error('ERRO AO CARREGAR O NAVIO:', err);
    });
}

function createVisuals() {
    const arrowLength = 2.5;

    // Conforme instrução do comandante, as posições vetoriais laterais originais estavam corretas
    portThrusterArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(physics.thrusterOffset.x, 0, physics.thrusterOffset.z), arrowLength, 0xff0000, 0.5, 0.5);
    starboardThrusterArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-physics.thrusterOffset.x, 0, physics.thrusterOffset.z), arrowLength, 0x00ff00, 0.5, 0.5);

    resultantForceArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 0, 0x00ffff, 1.0, 0.8);
    cgPivot.add(resultantForceArrow);
    hullGroup.add(portThrusterArrow, starboardThrusterArrow);

    windArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 8, 0), 0, 0xffffff, 1.5, 1);
    currentArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.2, 0), 0, 0x0000ff, 1.5, 1);
    scene.add(windArrow, currentArrow);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const points = [new THREE.Vector3(), new THREE.Vector3()];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    bowLine = new THREE.Line(lineGeo, lineMat);
    sternLine = new THREE.Line(lineGeo.clone(), lineMat.clone());
    bowLine.visible = sternLine.visible = false;
    scene.add(bowLine, sternLine);
    mooringState.bow.line = bowLine;
    mooringState.stern.line = sternLine;

    // Linhas do Cargueiro
    const shipBowLine = new THREE.Line(lineGeo.clone(), lineMat.clone());
    const shipSternLine = new THREE.Line(lineGeo.clone(), lineMat.clone());
    shipBowLine.visible = shipSternLine.visible = false;
    scene.add(shipBowLine, shipSternLine);
    shipMooringState.bow.line = shipBowLine;
    shipMooringState.stern.line = shipSternLine;

    const pointGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12);
    const bowPointMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const sternPointMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });

    bowMooringPointMarker = new THREE.Mesh(pointGeo, bowPointMat);
    sternMooringPointMarker = new THREE.Mesh(pointGeo, sternPointMat);

    hullGroup.add(bowMooringPointMarker);
    hullGroup.add(sternMooringPointMarker);
}

function updateVisuals(totalForce) {
    if (tugState.isPaused) return;

    const portAngleRad = THREE.MathUtils.degToRad(asdControls.port.angle);
    const starboardAngleRad = THREE.MathUtils.degToRad(asdControls.starboard.angle);
    const portForceDir = new THREE.Vector3(Math.sin(portAngleRad), 0, Math.cos(portAngleRad));
    const starboardForceDir = new THREE.Vector3(Math.sin(starboardAngleRad), 0, Math.cos(starboardAngleRad));

    portThrusterArrow.setDirection(portForceDir.clone().negate());
    starboardThrusterArrow.setDirection(starboardForceDir.clone().negate());

    const forceMagnitude = totalForce.length();
    if (forceMagnitude > 1.0) {
        resultantForceArrow.visible = true;
        const localForceDir = totalForce.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -tugState.yaw).normalize();
        const arrowLength = Math.min(forceMagnitude / physics.maxThrust, 1.0) * 8;
        resultantForceArrow.setDirection(localForceDir);
        resultantForceArrow.setLength(arrowLength, 1.0, 0.8);
    } else {
        resultantForceArrow.visible = false;
    }

    const windDirRad = THREE.MathUtils.degToRad(environmentControls.wind.direction);
    const windVector = new THREE.Vector3(Math.sin(windDirRad), 0, Math.cos(windDirRad));
    windArrow.setDirection(windVector);
    windArrow.setLength(environmentControls.wind.strength * 0.2, 1.5, 1);
    windArrow.position.copy(tugState.position).add(new THREE.Vector3(0, 10, 0));

    const currentDirRad = THREE.MathUtils.degToRad(environmentControls.current.direction);
    const currentVector = new THREE.Vector3(Math.sin(currentDirRad), 0, Math.cos(currentDirRad));
    currentArrow.setDirection(currentVector);
    currentArrow.setLength(environmentControls.current.strength * 2.0, 1.5, 1);
    currentArrow.position.copy(tugState.position).add(new THREE.Vector3(0, 12, 0));


    for (const type of ['bow', 'stern']) {
        const state = mooringState[type];
        if (state.isMoored) {
            const mooringPointWorld = cgPivot.localToWorld(state.mooringPoint.clone());
            const bollardPoint = state.bollard;
            const currentLength = mooringPointWorld.distanceTo(bollardPoint);
            const isTaut = currentLength > state.restLength;

            let points = [];
            if (isTaut) {
                points.push(mooringPointWorld);
                points.push(bollardPoint);
                state.line.material.color.set(0xffffff);
            } else {
                const slack = state.restLength - currentLength;
                const sag = Math.min(slack * 0.4, 8);

                const midPoint = new THREE.Vector3().addVectors(mooringPointWorld, bollardPoint).multiplyScalar(0.5);
                const controlPoint = midPoint.clone().add(new THREE.Vector3(0, -sag, 0));

                const curve = new THREE.QuadraticBezierCurve3(mooringPointWorld, controlPoint, bollardPoint);
                points = curve.getPoints(20);
                state.line.material.color.set(0x888888);
            }

            state.line.geometry.setFromPoints(points);
            state.line.visible = true;
        }
    }

    for (const type of ['bow', 'stern']) {
        const state = shipMooringState[type];
        if (state.isMoored) {
            const mooringPointWorld = shipGroup.localToWorld(state.mooringPoint.clone());
            const bollardPoint = state.bollard;
            const currentLength = mooringPointWorld.distanceTo(bollardPoint);
            const isTaut = currentLength > state.restLength;

            let points = [];
            if (isTaut) {
                points.push(mooringPointWorld);
                points.push(bollardPoint);
                // Navio usa cordas mais exóticas (vermelho vivo) tensionadas
                state.line.material.color.set(0xff0000);
            } else {
                const slack = state.restLength - currentLength;
                // Deixar a barriga da corda do navio um pouco maior visualmente caso perca a tensão total
                const sag = Math.min(slack * 0.5, 12);

                const midPoint = new THREE.Vector3().addVectors(mooringPointWorld, bollardPoint).multiplyScalar(0.5);
                const controlPoint = midPoint.clone().add(new THREE.Vector3(0, -sag, 0));

                const curve = new THREE.QuadraticBezierCurve3(mooringPointWorld, controlPoint, bollardPoint);
                points = curve.getPoints(20);
                // Vermelho mais opaco/cinzento quando com folga
                state.line.material.color.set(0xaa5555);
            }

            state.line.geometry.setFromPoints(points);
            state.line.visible = true;
        }
    }
}

function updateCG() {
    const cgX = parseFloat(ui.cgX.value);
    const cgZ = parseFloat(ui.cgZ.value);
    hullGroup.position.set(-cgX, 0, -cgZ);
    ui.vX.textContent = cgX.toFixed(2);
    ui.vZ.textContent = cgZ.toFixed(2);
}

function updateMooringPoints() {
    const bowZ = parseFloat(ui.bowPointZ.value);
    const bowX = parseFloat(ui.bowPointX.value);

    // =========================================================================
    // CONTROLE DE ALTURA DOS MOORING POINTS (Pinos Ciano/Magenta do Rebocador)
    // =========================================================================
    // O valor de "Ajuste Fino" provém diretamente do Slider HTML (ui.bowPointY.value).
    // A inclusão do "tugVisualElevationY" compensa matematicamente o fato de o casco 
    // ter sido elevado da água pós-purificação, evitando que os pinos afundem no convés.
    const bowY = parseFloat(ui.bowPointY.value) + tugVisualElevationY;

    const sternZ = parseFloat(ui.sternPointZ.value);
    const sternX = parseFloat(ui.sternPointX.value);

    // O mesmo princípio de flutuação dinâmica se repete para o pino da Popa
    const sternY = parseFloat(ui.sternPointY.value) + tugVisualElevationY;

    mooringState.bow.mooringPoint.set(bowX, bowY, bowZ);
    mooringState.stern.mooringPoint.set(sternX, sternY, sternZ);

    ui.valBowPointZ.textContent = bowZ.toFixed(1);
    ui.valBowPointX.textContent = bowX.toFixed(1);
    ui.valBowPointY.textContent = bowY.toFixed(1);
    ui.valSternPointZ.textContent = sternZ.toFixed(1);
    ui.valSternPointX.textContent = sternX.toFixed(1);
    ui.valSternPointY.textContent = sternY.toFixed(1);

    if (bowMooringPointMarker && sternMooringPointMarker) {
        bowMooringPointMarker.position.set(bowX, bowY + 0.2, bowZ);
        sternMooringPointMarker.position.set(sternX, sternY + 0.2, sternZ);
    }
}


function makeDraggable(panel) {
    const header = panel.querySelector('.panel-header');
    if (!header) return; // Panels without headers aren't draggable
    let isDragging = false;
    let offset = new THREE.Vector2();

    header.addEventListener('pointerdown', (e) => {
        isDragging = true;
        offset.x = e.clientX - panel.offsetLeft;
        offset.y = e.clientY - panel.offsetTop;
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
        header.setPointerCapture(e.pointerId); // Assegura que touch não seja perdido
    });

    function onPointerMove(e) {
        if (!isDragging) return;
        panel.style.left = `${e.clientX - offset.x}px`;
        panel.style.top = `${e.clientY - offset.y}px`;
    }

    function onPointerUp(e) {
        isDragging = false;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);
        if(e.pointerId) header.releasePointerCapture(e.pointerId);
    }
}

function setCameraView(view) {
    currentView = view;
    controls.enabled = (view === 'orbit');
}

function renderManeuverList() {
    ui.maneuverList.innerHTML = '';
    savedManeuvers.forEach((maneuver, index) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = maneuver.name;

        const execBtn = document.createElement('button');
        execBtn.textContent = 'Executar';
        execBtn.classList.add('btn-success');
        execBtn.onclick = () => executeManeuver(index);

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Excluir';
        delBtn.classList.add('btn-danger');
        delBtn.onclick = () => deleteManeuver(index);

        li.appendChild(span);
        li.appendChild(execBtn);
        li.appendChild(delBtn);
        ui.maneuverList.appendChild(li);
    });
}

function executeManeuver(index) {
    const maneuver = savedManeuvers[index];
    if (maneuver) {
        ui.anglePort.value = maneuver.port.angle;
        ui.thrustPort.value = maneuver.port.thrust;
        ui.angleStarboard.value = maneuver.starboard.angle;
        ui.thrustStarboard.value = maneuver.starboard.thrust;

        ['anglePort', 'thrustPort', 'angleStarboard', 'thrustStarboard'].forEach(id => ui[id].dispatchEvent(new Event('input')));
    }
}

function deleteManeuver(index) {
    savedManeuvers.splice(index, 1);
    localStorage.setItem('savedManeuvers', JSON.stringify(savedManeuvers));
    renderManeuverList();
}

function setupUIEvents() {
    if (ui.shipEngine) {
        ui.shipEngine.addEventListener('input', (e) => {
            shipControls.engine = parseInt(e.target.value);
            ui.valShipEngine.textContent = shipControls.engine;
        });
        ui.shipRudder.addEventListener('input', (e) => {
            shipControls.rudder = parseInt(e.target.value);
            ui.valShipRudder.textContent = shipControls.rudder;
        });
        ui.btnCenterRudder.addEventListener('click', () => {
            shipControls.rudder = 0;
            ui.shipRudder.value = 0;
            ui.valShipRudder.textContent = '0';
        });
        ui.shipBowThruster.addEventListener('input', (e) => {
            shipControls.bowThruster = parseInt(e.target.value);
            ui.valShipBowThruster.textContent = shipControls.bowThruster;
        });
        ui.btnCenterThruster.addEventListener('click', () => {
            shipControls.bowThruster = 0;
            ui.shipBowThruster.value = 0;
            ui.valShipBowThruster.textContent = '0';
        });
        ui.shipDraft.addEventListener('input', (e) => {
            const draftVal = parseFloat(e.target.value);
            shipControls.draft = draftVal;
            ui.valShipDraft.textContent = draftVal.toFixed(1);

            // Mapear calado de 5m (10k ton) a 15m (60k ton)
            const pct = (draftVal - 5.0) / 10.0;
            shipPhysics.mass = 10000000 + (pct * 50000000);
            shipPhysics.momentOfInertia = 150000000 + (pct * 600000000);

            // Afundar vizualmente o navio (aprofundado mais 30% do calado a pedido do comandante)
            if (shipState.baseY !== undefined) {
                shipState.position.y = shipState.baseY + 0.2 - (pct * 4.5);
            }
        });
    }
    ui.cgX.addEventListener('input', updateCG);
    ui.cgZ.addEventListener('input', updateCG);
    ui.elevationY.addEventListener('input', (e) => {
        waterlineY = parseFloat(e.target.value);
        ui.valElevationY.textContent = waterlineY.toFixed(2);
    });

    document.getElementById('resetPosition').addEventListener('click', () => {
        tugState.position.set(0, 0, 0);
        tugState.velocity.set(0, 0, 0);
        tugState.yaw = 0;
        tugState.yawRate = 0;
        if (mooringState.bow.isMoored) toggleMooring('bow');
        if (mooringState.stern.isMoored) toggleMooring('stern');
    });

    ui.moorBow.addEventListener('click', () => toggleMooring('bow'));
    ui.moorStern.addEventListener('click', () => toggleMooring('stern'));
    
    ui.moorShipBow.addEventListener('click', () => toggleShipPierMooring('bow'));
    ui.moorShipStern.addEventListener('click', () => toggleShipPierMooring('stern'));

    document.getElementById('moorTugBowToShipBow')?.addEventListener('click', () => toggleShipMooring('bow', 'bow'));
    document.getElementById('moorTugBowToShipStern')?.addEventListener('click', () => toggleShipMooring('bow', 'stern'));
    document.getElementById('moorTugSternToShipBow')?.addEventListener('click', () => toggleShipMooring('stern', 'bow'));
    document.getElementById('moorTugSternToShipStern')?.addEventListener('click', () => toggleShipMooring('stern', 'stern'));

    ui.bowLineLength.addEventListener('input', (e) => {
        if (mooringState.bow.isMoored) {
            mooringState.bow.targetRestLength = parseFloat(e.target.value);
        }
    });
    ui.sternLineLength.addEventListener('input', (e) => {
        if (mooringState.stern.isMoored) {
            mooringState.stern.targetRestLength = parseFloat(e.target.value);
        }
    });

    ui.shipBowLineLength.addEventListener('input', (e) => {
        if (shipMooringState.bow.isMoored) {
            shipMooringState.bow.targetRestLength = parseFloat(e.target.value);
        }
    });
    ui.shipSternLineLength.addEventListener('input', (e) => {
        if (shipMooringState.stern.isMoored) {
            shipMooringState.stern.targetRestLength = parseFloat(e.target.value);
        }
    });

    document.getElementById('viewBow').addEventListener('click', () => setCameraView('bow'));
    document.getElementById('viewStern').addEventListener('click', () => setCameraView('stern'));
    document.getElementById('viewPort').addEventListener('click', () => setCameraView('port'));
    document.getElementById('viewStarboard').addEventListener('click', () => setCameraView('starboard'));
    document.getElementById('viewOrbit').addEventListener('click', () => setCameraView('orbit'));

    document.getElementById('focusTug')?.addEventListener('click', () => {
        cameraTargetEntity = 'tug';
        document.getElementById('focusTug').classList.replace('btn-sec', 'btn-success');
        document.getElementById('focusShip').classList.replace('btn-success', 'btn-sec');
    });

    document.getElementById('focusShip')?.addEventListener('click', () => {
        cameraTargetEntity = 'ship';
        document.getElementById('focusShip').classList.replace('btn-sec', 'btn-success');
        document.getElementById('focusTug').classList.replace('btn-success', 'btn-sec');
    });

    const tugColorPicker = document.getElementById('tugColorPicker');
    if (tugColorPicker) {
        tugColorPicker.addEventListener('input', (e) => {
            const hexColor = e.target.value;
            const newColor = new THREE.Color(hexColor);
            
            if (tug) {
                tug.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const matName = (child.material.name || '').toLowerCase();
                        const meshName = (child.name || '').toLowerCase();
                        
                        const isRubber = matName.includes('rubber') || matName.includes('black') || meshName.includes('tire') || meshName.includes('fender');
                        const isGlass = child.material.transparent || matName.includes('glass') || matName.includes('window') || meshName.includes('window');
                        const isMetal = matName.includes('metal') || matName.includes('steel') || matName.includes('dark');
                        const isDeck = matName.includes('wood') || matName.includes('deck');

                        // Pinta as matrizes principais que costumam representar o casco colorido
                        if (!isRubber && !isGlass && !isMetal && !isDeck) {
                            // Se for array de materiais fatiados, colore todos
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => {
                                    if(m.color) m.color.copy(newColor);
                                });
                            } else if (child.material.color) {
                                child.material.color.copy(newColor);
                            }
                        }
                    }
                });
            }
        });
    }

    document.querySelectorAll('.popup-panel').forEach(makeDraggable);

    ui.breakingLoad.addEventListener('input', (e) => {
        const tonnes = parseFloat(e.target.value);
        physics.lineBreakingLoad = tonnes * 9807;
        ui.valBreakingLoad.textContent = tonnes.toFixed(0);
    });

    ui.stiffness.addEventListener('input', (e) => {
        physics.lineStiffness = parseFloat(e.target.value) * 1000;
        ui.valStiffness.textContent = e.target.value;
    });

    ui.breakingLoad.value = physics.lineBreakingLoad / 9807;
    ui.valBreakingLoad.textContent = ui.breakingLoad.value;
    ui.stiffness.value = physics.lineStiffness / 1000;
    ui.valStiffness.textContent = ui.stiffness.value;

    ui.windStrength.addEventListener('input', (e) => { environmentControls.wind.strength = parseFloat(e.target.value); ui.valWindStrength.textContent = e.target.value; });
    ui.windDirection.addEventListener('input', (e) => { environmentControls.wind.direction = parseFloat(e.target.value); ui.valWindDirection.textContent = e.target.value; });
    ui.currentStrength.addEventListener('input', (e) => { environmentControls.current.strength = parseFloat(e.target.value); ui.valCurrentStrength.textContent = parseFloat(e.target.value).toFixed(1); });
    ui.currentDirection.addEventListener('input', (e) => { environmentControls.current.direction = parseFloat(e.target.value); ui.valCurrentDirection.textContent = e.target.value; });


    ui.bowPointZ.addEventListener('input', updateMooringPoints);
    ui.bowPointX.addEventListener('input', updateMooringPoints);
    ui.bowPointY.addEventListener('input', updateMooringPoints);
    ui.sternPointZ.addEventListener('input', updateMooringPoints);
    ui.sternPointX.addEventListener('input', updateMooringPoints);
    ui.sternPointY.addEventListener('input', updateMooringPoints);

    ui.saveManeuver.addEventListener('click', () => {
        const name = ui.maneuverName.value.trim();
        if (name) {
            savedManeuvers.push({
                name: name,
                port: { angle: asdControls.port.angle, thrust: asdControls.port.thrust },
                starboard: { angle: asdControls.starboard.angle, thrust: asdControls.starboard.thrust }
            });
            localStorage.setItem('savedManeuvers', JSON.stringify(savedManeuvers));
            ui.maneuverName.value = '';
            renderManeuverList();
        } else {
            alert('Por favor, dê um nome para a manobra.');
        }
    });

    const sidebarButtons = document.querySelectorAll('.sidebar-btn');
    sidebarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const panelId = button.getAttribute('data-panel-id');
            const panel = document.getElementById(panelId);

            const isActive = button.classList.contains('active');

            if (isActive) {
                panel.style.display = 'none';
                button.classList.remove('active');
            } else {
                panel.style.display = 'grid';
                button.classList.add('active');
                document.querySelectorAll('.popup-panel').forEach(p => p.style.zIndex = 10);
                panel.style.zIndex = 11;
            }
        });
    });

    setupBuoyControls();
    setupConstructionControls();
    renderManeuverList();

    // --- Integração com o Painel de Controle ASD Autônomo ---
    const handleAsdControlMessage = (event) => {
        if (event.data?.type === 'asdControlState') {
            const { port, starboard } = event.data.payload;
            const idleRpm = 650;
            const maxRpm = 1600;
            const propulsionRpmRange = maxRpm - idleRpm;

            // Converte o ângulo (0-360) e RPM para os valores que a física do simulador espera
            asdControls.port.angle = port.angle > 180 ? port.angle - 360 : port.angle; // Converte 0-360 para -180 a 180
            // Calcula o empuxo somente para RPMs acima da marcha lenta
            asdControls.port.thrust = Math.max(0, (port.rpm - idleRpm) / propulsionRpmRange) * 100;

            asdControls.starboard.angle = starboard.angle > 180 ? starboard.angle - 360 : starboard.angle;
            asdControls.starboard.thrust = Math.max(0, (starboard.rpm - idleRpm) / propulsionRpmRange) * 100;
        }
    };

    window.addEventListener('message', handleAsdControlMessage);

    // --- Restauração dos Ajustes para os Padrões Originais ---
    const resetAdjustmentsBtn = document.getElementById('resetAdjustmentsBtn');
    if (resetAdjustmentsBtn) {
        resetAdjustmentsBtn.addEventListener('click', () => {
            localStorage.removeItem('tugSimColor');
            localStorage.removeItem('tugSimAdjustments');
            const oldTxt = resetAdjustmentsBtn.textContent;
            resetAdjustmentsBtn.textContent = '🔄 Restaurando...';
            resetAdjustmentsBtn.classList.replace('btn-warning', 'btn-primary');
            setTimeout(() => { location.reload(); }, 600);
        });
    }

    // Carregar configurações locais na inicialização se existirem
    const savedConfigs = localStorage.getItem('tugSimAdjustments');
    if (savedConfigs) {
        try {
            const config = JSON.parse(savedConfigs);
            const adjustKeys = ['cgZ', 'cgX', 'elevationY', 'bowPointZ', 'bowPointX', 'bowPointY', 'sternPointZ', 'sternPointX', 'sternPointY'];
            adjustKeys.forEach(key => {
                if (config[key] !== undefined && ui[key]) {
                    ui[key].value = config[key];
                    ui[key].dispatchEvent(new Event('input')); // Recalcula física/texto imediatamente
                }
            });
        } catch (e) {
            console.error("Erro carregando configurações", e);
        }
    }
}

function toggleMooring(type) {
    const state = mooringState[type];
    const button = ui[type === 'bow' ? 'moorBow' : 'moorStern'];
    const winchControl = ui[type === 'bow' ? 'bowWinchControl' : 'sternWinchControl'];
    const winchSlider = ui[type === 'bow' ? 'bowLineLength' : 'sternLineLength'];
    const winchValue = ui[type === 'bow' ? 'valBowLineLength' : 'valSternLineLength'];
    const tensionBar = ui[type === 'bow' ? 'bowTensionBar' : 'sternTensionBar'];
    const tensionVal = ui[type === 'bow' ? 'valBowTension' : 'valSternTension'];

    if (state.isMoored) {
        state.isMoored = false;
        state.bollard = null;
        state.targetBollardEl = null;
        state.line.visible = false;
        winchControl.style.display = 'none';
        button.textContent = `Atracar ${type === 'bow' ? 'Proa' : 'Popa'}`;
        button.classList.remove('btn-success');
        button.classList.add('btn-sec');
        tensionVal.textContent = '0.0';
        tensionBar.style.width = '0%';

    } else {
        const mooringPointWorld = cgPivot.localToWorld(state.mooringPoint.clone());
        let closestBollard = null;
        let closestBollardEl = null;
        let minDistance = Infinity;

        portElements.filter(el => el.type === 'bollard').forEach(bollardEl => {
            const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
            const distance = mooringPointWorld.distanceTo(worldBollardPos);
            if (distance < minDistance) {
                minDistance = distance;
                closestBollard = worldBollardPos.clone();
                closestBollardEl = bollardEl;
            }
        });

        if (closestBollard && minDistance <= MOORING_DISTANCE_THRESHOLD) {
            state.isMoored = true;
            state.bollard = closestBollard;
            state.targetBollardEl = closestBollardEl;
            state.line.visible = true;
            state.restLength = minDistance;
            state.targetRestLength = minDistance;
            winchSlider.value = minDistance;
            winchValue.textContent = minDistance.toFixed(1);
            winchControl.style.display = 'block';
            button.textContent = `Largar ${type === 'bow' ? 'Proa' : 'Popa'}`;
            button.classList.remove('btn-sec');
            button.classList.add('btn-success');
        } else {
            alert('Nenhum cabeço próximo o suficiente para atracar.');
        }
    }
}

function toggleShipPierMooring(type) {
    const state = shipMooringState[type];
    const button = ui[type === 'bow' ? 'moorShipBow' : 'moorShipStern'];
    const winchControl = ui[type === 'bow' ? 'shipBowWinchControl' : 'shipSternWinchControl'];
    const winchSlider = ui[type === 'bow' ? 'shipBowLineLength' : 'shipSternLineLength'];
    const winchValue = ui[type === 'bow' ? 'valShipBowLineLength' : 'valShipSternLineLength'];
    const tensionBar = ui[type === 'bow' ? 'shipBowTensionBar' : 'shipSternTensionBar'];
    const tensionVal = ui[type === 'bow' ? 'valShipBowTension' : 'valShipSternTension'];

    if (state.isMoored) {
        state.isMoored = false;
        state.bollard = null;
        state.targetBollardEl = null;
        state.line.visible = false;
        winchControl.style.display = 'none';
        button.textContent = `Ao Cais (${type === 'bow' ? 'Proa' : 'Popa'})`;
        button.classList.remove('btn-success');
        button.classList.add('btn-sec');
        tensionVal.textContent = '0.0';
        tensionBar.style.width = '0%';
    } else {
        const mooringPointWorld = shipGroup.localToWorld(state.mooringPoint.clone());
        let closestBollard = null;
        let closestBollardEl = null;
        let minDistance = Infinity;

        portElements.filter(el => el.type === 'bollard' && !el.isShipBollard).forEach(bollardEl => {
            const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
            const distance = mooringPointWorld.distanceTo(worldBollardPos);
            if (distance < minDistance) {
                minDistance = distance;
                closestBollard = worldBollardPos.clone();
                closestBollardEl = bollardEl;
            }
        });

        const SHIP_MOORING_THRESHOLD = 50; // Distância maior que o rebocador para pescar a corda no cais

        if (closestBollard && minDistance <= SHIP_MOORING_THRESHOLD) {
            state.isMoored = true;
            state.bollard = closestBollard;
            state.targetBollardEl = closestBollardEl;
            state.line.visible = true;
            state.restLength = minDistance;
            state.targetRestLength = minDistance;
            winchSlider.value = minDistance;
            winchValue.textContent = minDistance.toFixed(1);
            winchControl.style.display = 'block';
            button.textContent = `Largar Cais (${type === 'bow' ? 'Proa' : 'Popa'})`;
            button.classList.remove('btn-sec');
            button.classList.add('btn-success');
        } else {
            alert('Nenhum cabeço do cais próximo o suficiente para atracar o navio (Máx: 50m). Aproxime mais da estrutura!');
        }
    }
}

function toggleShipMooring(tugEnd, shipEnd) {
    const state = mooringState[tugEnd];
    if (state.isMoored) return; // Se já estiver atracado, o botão padrão "Largar" cuida do release

    // Procura o cabeço específico do navio
    const targetBollard = portElements.find(el => el.isShipBollard && el.shipLocation === shipEnd);
    if (!targetBollard) return;

    const mooringPointWorld = cgPivot.localToWorld(state.mooringPoint.clone());
    const worldBollardPos = targetBollard.mesh.getWorldPosition(new THREE.Vector3());
    const distance = mooringPointWorld.distanceTo(worldBollardPos);

    // Força a atracação imediata
    state.bollard = worldBollardPos.clone();
    state.targetBollardEl = targetBollard;
    state.isMoored = true;
    state.restLength = distance;
    state.targetRestLength = distance;

    // Constrói ou exibe a malha visual do cabo
    if (!state.line) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([mooringPointWorld, worldBollardPos]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        state.line = new THREE.Line(lineGeo, lineMat);
        scene.add(state.line);
    } else {
        state.line.visible = true;
    }

    // Adapta o Layout do Guincho Clássico simulando o atracamento no navio
    const button = ui[tugEnd === 'bow' ? 'moorBow' : 'moorStern'];
    const winchControl = ui[tugEnd === 'bow' ? 'bowWinchControl' : 'sternWinchControl'];
    const winchSlider = ui[tugEnd === 'bow' ? 'bowLineLength' : 'sternLineLength'];
    const winchValue = ui[tugEnd === 'bow' ? 'valBowLineLength' : 'valSternLineLength'];

    winchControl.style.display = 'block';
    button.textContent = `Largar Navio (${tugEnd === 'bow' ? 'Proa' : 'Popa'})`;
    button.classList.remove('btn-sec');
    button.classList.add('btn-success');
    button.disabled = false; // Mantém botão ativo para podermos largar a qualquer momento

    winchSlider.min = (distance * 0.1).toFixed(1);
    winchSlider.max = (distance * 2.0).toFixed(1);
    winchSlider.value = distance.toFixed(1);
    winchValue.textContent = distance.toFixed(1);
}

function setupBuoyControls() {
    ui.addGreenBuoy.addEventListener('click', () => { if (!isConstructionMode) activeBuoyColor = 'green'; });
    ui.addRedBuoy.addEventListener('click', () => { if (!isConstructionMode) activeBuoyColor = 'red'; });
    ui.clearBuoys.addEventListener('click', clearBuoys);
}

function clearBuoys() {
    // Remove todas as bóias da cena e libera recursos de memória (geometria, material)
    buoys.forEach(b => {
        if (b.mesh) {
            b.mesh.traverse?.((child) => {
                if (child.isMesh) {
                    child.geometry?.dispose?.();
                    if (child.material) {
                        // Lida com materiais únicos ou múltiplos
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose?.());
                        } else {
                            child.material.dispose?.();
                        }
                    }
                }
            });
            scene.remove(b.mesh);
        }
    });
    buoys = []; // Esvazia o array de estado
}

function createBuoy(position, color) {
    const buoyGroup = new THREE.Group();
    const buoyColorHex = color === 'green' ? 0x00ff00 : 0xff0000;

    const bodyMat = new THREE.MeshStandardMaterial({ color: buoyColorHex, metalness: 0.4, roughness: 0.6 });
    const coneGeo = new THREE.ConeGeometry(0.7, 1.2, 16);
    const cone = new THREE.Mesh(coneGeo, bodyMat);
    cone.position.y = 0.6;

    const cylinderGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16);
    const cylinder = new THREE.Mesh(cylinderGeo, bodyMat);

    buoyGroup.add(cone);
    buoyGroup.add(cylinder);

    const anchorLineMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const points = [new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, -10, 0)];
    const anchorLineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const anchorLine = new THREE.Line(anchorLineGeo, anchorLineMat);
    buoyGroup.add(anchorLine);

    scene.add(buoyGroup);

    const buoy = {
        mesh: buoyGroup,
        anchor: position.clone(),
        position: position.clone(),
        velocity: new THREE.Vector3(),
        collider: new THREE.Sphere(position.clone(), 0.2),
        bobOffset: Math.random() * Math.PI * 2
    };
    buoys.push(buoy);
}

function updateBuoys(dt) {
    if (tugState.isPaused) return;
    const time = clock.getElapsedTime();
    buoys.forEach(buoy => {
        buoy.mesh.position.y = Math.sin(time * 2 + buoy.bobOffset) * 0.2;

        const displacement = new THREE.Vector3().subVectors(buoy.position, buoy.anchor);
        const springForce = displacement.clone().multiplyScalar(-buoyPhysics.stiffness);
        const dampingForce = buoy.velocity.clone().multiplyScalar(-buoyPhysics.damping);
        const totalForce = new THREE.Vector3().addVectors(springForce, dampingForce);
        const acceleration = totalForce.divideScalar(buoyPhysics.mass);

        buoy.velocity.add(acceleration.multiplyScalar(dt));
        buoy.position.add(buoy.velocity.clone().multiplyScalar(dt));

        buoy.velocity.multiplyScalar(0.98);

        buoy.mesh.position.x = buoy.position.x;
        buoy.mesh.position.z = buoy.position.z;
        buoy.collider.center.copy(buoy.mesh.position);
    });
}


function updatePhysics(dt) {
    if (tugState.isPaused) return;

    let totalForce = new THREE.Vector3(0, 0, 0);
    let totalTorque = 0;

    let totalShipForce = new THREE.Vector3(0, 0, 0);
    let totalShipTorque = 0;
    const cgOffset = new THREE.Vector3(parseFloat(ui.cgX.value), 0, parseFloat(ui.cgZ.value));

    const thrusters = [
        { angle: asdControls.port.angle, thrust: asdControls.port.thrust, posX: -physics.thrusterOffset.x },
        { angle: asdControls.starboard.angle, thrust: asdControls.starboard.thrust, posX: physics.thrusterOffset.x }
    ];

    thrusters.forEach(thruster => {
        const power = (thruster.thrust / 100) * physics.maxThrust;
        const angleRad = THREE.MathUtils.degToRad(thruster.angle);
        const localForce = new THREE.Vector3(Math.sin(angleRad), 0, Math.cos(angleRad)).multiplyScalar(power);

        const globalForce = localForce.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), tugState.yaw);
        totalForce.add(globalForce);

        const r = new THREE.Vector3(thruster.posX - cgOffset.x, 0, physics.thrusterOffset.z - cgOffset.z);
        totalTorque += r.z * localForce.x - r.x * localForce.z;
    });

    const windAngleRad = THREE.MathUtils.degToRad(environmentControls.wind.direction);
    const relativeWindAngle = windAngleRad - tugState.yaw;
    const windSpeed = environmentControls.wind.strength * 0.5144;
    const windMagnitude = windSpeed * windSpeed * physics.windCoefficient;
    const lateralWindForce = windMagnitude * Math.sin(relativeWindAngle);
    const longitudinalWindForce = windMagnitude * Math.cos(relativeWindAngle);
    const windForceVector = new THREE.Vector3(lateralWindForce, 0, longitudinalWindForce).applyAxisAngle(new THREE.Vector3(0, 1, 0), tugState.yaw);
    totalForce.add(windForceVector);
    totalTorque += lateralWindForce * physics.windLeverArm;

    const relativeWindAngleShip = windAngleRad - shipState.yaw;
    const windMagnitudeShip = windSpeed * windSpeed * shipPhysics.windCoefficient;
    const lateralWindForceShip = windMagnitudeShip * Math.sin(relativeWindAngleShip);
    const longitudinalWindForceShip = windMagnitudeShip * Math.cos(relativeWindAngleShip);
    const windForceVectorShip = new THREE.Vector3(lateralWindForceShip, 0, longitudinalWindForceShip).applyAxisAngle(new THREE.Vector3(0, 1, 0), shipState.yaw);
    totalShipForce.add(windForceVectorShip);
    totalShipTorque += lateralWindForceShip * shipPhysics.windLeverArm;

    const currentAngleRad = THREE.MathUtils.degToRad(environmentControls.current.direction);
    const relativeCurrentAngle = currentAngleRad - tugState.yaw;
    const currentSpeed = environmentControls.current.strength * 0.5144;
    const currentMagnitude = currentSpeed * physics.currentCoefficient;
    const lateralCurrentForce = currentMagnitude * Math.sin(relativeCurrentAngle);
    const longitudinalCurrentForce = currentMagnitude * Math.cos(relativeCurrentAngle);
    const currentForceVector = new THREE.Vector3(lateralCurrentForce, 0, longitudinalCurrentForce).applyAxisAngle(new THREE.Vector3(0, 1, 0), tugState.yaw);
    totalForce.add(currentForceVector);
    totalTorque += lateralCurrentForce * physics.currentLeverArm;

    const relativeCurrentAngleShip = currentAngleRad - shipState.yaw;
    const currentMagnitudeShip = currentSpeed * shipPhysics.currentCoefficient;
    const lateralCurrentForceShip = currentMagnitudeShip * Math.sin(relativeCurrentAngleShip);
    const longitudinalCurrentForceShip = currentMagnitudeShip * Math.cos(relativeCurrentAngleShip);
    const currentForceVectorShip = new THREE.Vector3(lateralCurrentForceShip, 0, longitudinalCurrentForceShip).applyAxisAngle(new THREE.Vector3(0, 1, 0), shipState.yaw);
    totalShipForce.add(currentForceVectorShip);
    totalShipTorque += lateralCurrentForceShip * shipPhysics.currentLeverArm;


    for (const type of ['bow', 'stern']) {
        const state = mooringState[type];
        const tensionBar = ui[type === 'bow' ? 'bowTensionBar' : 'sternTensionBar'];
        const tensionVal = ui[type === 'bow' ? 'valBowTension' : 'valSternTension'];
        const lineLengthVal = ui[type === 'bow' ? 'valBowLineLength' : 'valSternLineLength'];

        if (state.isMoored) {
            if (state.targetBollardEl) {
                state.bollard = state.targetBollardEl.mesh.getWorldPosition(new THREE.Vector3());
            }

            const lengthDifference = state.targetRestLength - state.restLength;
            if (Math.abs(lengthDifference) > 0.01) {
                const adjustment = Math.sign(lengthDifference) * WINCH_SPEED * dt;
                state.restLength += (Math.abs(adjustment) > Math.abs(lengthDifference)) ? lengthDifference : adjustment;
                lineLengthVal.textContent = state.restLength.toFixed(1);
            }

            const mooringPointWorld = cgPivot.localToWorld(state.mooringPoint.clone());
            const lineVector = new THREE.Vector3().subVectors(state.bollard, mooringPointWorld);
            const currentLength = lineVector.length();
            const stretch = currentLength - state.restLength;

            if (stretch > 0) {
                const forceDirection = lineVector.clone().normalize();
                const springForceMagnitude = stretch * physics.lineStiffness;

                const relativeVelocity = tugState.velocity.clone();
                const closingSpeed = relativeVelocity.dot(forceDirection);
                const dampingForceMagnitude = closingSpeed * physics.lineDamping;

                let totalLineForce = springForceMagnitude - dampingForceMagnitude;
                if (totalLineForce < 0) totalLineForce = 0;

                const tensionTons = totalLineForce / 9807;
                debugData.lineTension = totalLineForce;
                const tensionPercent = Math.min((totalLineForce / physics.lineBreakingLoad) * 100, 100);
                tensionVal.textContent = tensionTons.toFixed(1);
                tensionBar.style.width = `${tensionPercent}%`;
                if (tensionPercent > 85) tensionBar.style.backgroundColor = '#dc3545';
                else if (tensionPercent > 50) tensionBar.style.backgroundColor = '#ffc107';
                else tensionBar.style.backgroundColor = '#28a745';

                if (totalLineForce > physics.lineBreakingLoad) {
                    toggleMooring(type);
                    continue;
                }

                const lineForceVector = forceDirection.clone().multiplyScalar(totalLineForce);
                totalForce.add(lineForceVector);

                // Identify if bollard is on ship
                if (state.targetBollardEl && state.targetBollardEl.isShipBollard) {
                    const lineForceVectorShip = forceDirection.clone().negate().multiplyScalar(totalLineForce);
                    totalShipForce.add(lineForceVectorShip);

                    const rShip = new THREE.Vector3().subVectors(state.bollard, shipState.position);
                    totalShipTorque += rShip.z * lineForceVectorShip.x - rShip.x * lineForceVectorShip.z;
                }

                const r = new THREE.Vector3().subVectors(mooringPointWorld, tugState.position);
                totalTorque += r.z * lineForceVector.x - r.x * lineForceVector.z;

            } else {
                tensionVal.textContent = '0.0';
                tensionBar.style.width = '0%';
                tensionBar.style.backgroundColor = '#28a745';
            }
        }
    }

    const linearAcceleration = totalForce.clone().divideScalar(physics.mass);
    tugState.velocity.add(linearAcceleration.multiplyScalar(dt));

    const angularAcceleration = totalTorque / physics.momentOfInertia;
    tugState.yawRate += angularAcceleration * dt;

    tugState.velocity.multiplyScalar(1.0 - (1.0 - physics.linearDamping) * dt * 60);
    tugState.yawRate *= (1.0 - (1.0 - physics.angularDamping) * dt * 60);

    tugState.position.add(tugState.velocity.clone().multiplyScalar(dt));
    tugState.yaw += tugState.yawRate * dt;

    // --- Ship Integration ---

    // ==========================================
    // SISTEMA UNIFICADO DE VETORES DIRECIONAIS 
    // (Garante Simetria Perfeita entre Boreste-BE(+) e Bombordo-BB(-))
    // ==========================================
    const localForward = shipPhysics.isZAxisLonger ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const shipForwardDir = localForward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), shipState.yaw);
    // +PI/2 garante que o vetor "Direito" aponte para Estibordo (Starboard/BE) indepente da escala
    const shipRightDir = shipForwardDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

    // === FORÇA E TORQUE MILIMETRADO ===

    // 1. Motor Hélice Principal
    const engineForce = shipForwardDir.clone().multiplyScalar((shipControls.engine / 100.0) * 300000);
    totalShipForce.add(engineForce);

    // 2. Bow Thruster (Força na proa empurra a frente direto pro lado e gera Torque Direto)
    const bowThrustAmt = (shipControls.bowThruster / 100.0); // + (BE) ou - (BB)
    const bowThrusterForce = shipRightDir.clone().multiplyScalar(bowThrustAmt * 50000);
    totalShipForce.add(bowThrusterForce);
    // Força à BORESTE na Proa cria Torque pra BORESTE (Negativo no eixo Y)
    totalShipTorque -= bowThrustAmt * 50000 * 60;

    // 3. Sistema Dinâmico do Leme (Giro gera Deriva)
    const forwardSpeed = Math.abs(shipState.velocity.dot(shipForwardDir));
    const propWash = Math.max(0, (shipControls.engine / 100.0) * 1.5);
    const effectiveWaterFlow = forwardSpeed + propWash;

    // Leme de slider é -35 a 35. (+) = Boreste, (-) = Bombordo.
    const rudderAngleRad = THREE.MathUtils.degToRad(shipControls.rudder);

    // Torque do Leme: Leme à Direita (+) curva o navio pra Direita (-)
    const rudderTorque = -rudderAngleRad * effectiveWaterFlow * 400000;
    totalShipTorque += rudderTorque;

    // Força Lateral da Popa: Para virar à direita (rudderTorque negativo), a água empurra a popa para a Esquerda (-shipRightDir)
    // Como rudderTorque já é negativo, somá-lo gera o vetor correto para bombordo
    const rudderLateralForce = shipRightDir.clone().multiplyScalar(rudderTorque / 60.0);
    totalShipForce.add(rudderLateralForce);

    // --- Lógica de Tensão do Cabo do Navio ao Cais ---
    for (const type of ['bow', 'stern']) {
        const state = shipMooringState[type];
        const tensionBar = ui[type === 'bow' ? 'shipBowTensionBar' : 'shipSternTensionBar'];
        const tensionVal = ui[type === 'bow' ? 'valShipBowTension' : 'valShipSternTension'];
        const lineLengthVal = ui[type === 'bow' ? 'valShipBowLineLength' : 'valShipSternLineLength'];

        if (state.isMoored) {
            if (state.targetBollardEl) {
                state.bollard = state.targetBollardEl.mesh.getWorldPosition(new THREE.Vector3());
            }

            const lengthDifference = state.targetRestLength - state.restLength;
            if (Math.abs(lengthDifference) > 0.01) {
                const adjustment = Math.sign(lengthDifference) * WINCH_SPEED * dt;
                state.restLength += (Math.abs(adjustment) > Math.abs(lengthDifference)) ? lengthDifference : adjustment;
                lineLengthVal.textContent = state.restLength.toFixed(1);
            }

            const mooringPointWorld = shipGroup.localToWorld(state.mooringPoint.clone());
            const lineVector = new THREE.Vector3().subVectors(state.bollard, mooringPointWorld);
            const currentLength = lineVector.length();
            const stretch = currentLength - state.restLength;

            if (stretch > 0) {
                const forceDirection = lineVector.clone().normalize();
                
                // O navio é absurdamente pesado. Corda de cais deve ser mais resistente que a do rebocador.
                const shipLineStiffness = physics.lineStiffness * 50; 
                const shipLineDamping = physics.lineDamping * 50;
                const shipBreakingLoad = physics.lineBreakingLoad * 10;

                const springForceMagnitude = stretch * shipLineStiffness;
                const closingSpeed = shipState.velocity.dot(forceDirection);
                const dampingForceMagnitude = closingSpeed * shipLineDamping;

                let totalLineForce = springForceMagnitude - dampingForceMagnitude;
                if (totalLineForce < 0) totalLineForce = 0;

                const tensionTons = totalLineForce / 9807;
                const tensionPercent = Math.min((totalLineForce / shipBreakingLoad) * 100, 100);
                
                tensionVal.textContent = tensionTons.toFixed(1);
                tensionBar.style.width = `${tensionPercent}%`;
                if (tensionPercent > 85) tensionBar.style.backgroundColor = '#dc3545';
                else if (tensionPercent > 50) tensionBar.style.backgroundColor = '#ffc107';
                else tensionBar.style.backgroundColor = '#28a745';

                if (totalLineForce > shipBreakingLoad) {
                    toggleShipPierMooring(type);
                    continue;
                }

                const lineForceVectorShip = forceDirection.clone().multiplyScalar(totalLineForce);
                totalShipForce.add(lineForceVectorShip);

                const rShip = new THREE.Vector3().subVectors(mooringPointWorld, shipState.position);
                totalShipTorque += rShip.z * lineForceVectorShip.x - rShip.x * lineForceVectorShip.z;

            } else {
                tensionVal.textContent = '0.0';
                tensionBar.style.width = '0%';
                tensionBar.style.backgroundColor = '#28a745';
            }
        }
    }

    debugData.shipForce = totalShipForce.length();
    debugData.shipTorque = totalShipTorque;
    debugData.tugForce = totalForce.length();

    const shipLinAcc = totalShipForce.clone().divideScalar(shipPhysics.mass);
    shipState.velocity.add(shipLinAcc.multiplyScalar(dt));

    // === O MILAGRE DA DERIVA (Drag Lateral Anti-Puck) ====
    let velFwd = shipState.velocity.dot(shipForwardDir);
    let velLat = shipState.velocity.dot(shipRightDir);

    // O navio é cortante linearmente, mas uma "Placa de Aço" lateralmente.
    velFwd *= (1.0 - (1.0 - shipPhysics.linearDamping) * dt * 60);
    velLat *= (1.0 - (1.0 - 0.90) * dt * 60); // O mar estrangula 90% da escorregada lateral

    shipState.velocity.copy(shipForwardDir.clone().multiplyScalar(velFwd).add(shipRightDir.clone().multiplyScalar(velLat)));

    const shipAngAcc = totalShipTorque / shipPhysics.momentOfInertia;
    shipState.yawRate += shipAngAcc * dt;
    shipState.yawRate *= (1.0 - (1.0 - shipPhysics.angularDamping) * dt * 60);

    shipState.position.add(shipState.velocity.clone().multiplyScalar(dt));
    shipState.yaw += shipState.yawRate * dt;

    updateVisuals(totalForce);
}

function checkCollisions() {
    if (!tugCollider || tugState.isPaused) return;

    tugCollider.updateWorldMatrix(true, false);
    const worldColliderBox = new THREE.Box3().setFromObject(tugCollider);
    tugState.boundingBox.copy(worldColliderBox);


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

            if (overlapX > 0 && overlapZ > 0) {
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

    portElements.filter(el => el.type === 'pier').forEach(pierEl => {
        pierEl.mesh.updateWorldMatrix(true, false);
        if (!pierEl.mesh.geometry.boundingBox) pierEl.mesh.geometry.computeBoundingBox();
        const pierBox = pierEl.mesh.geometry.boundingBox.clone();
        pierBox.applyMatrix4(pierEl.mesh.matrixWorld);
        if (tugState.boundingBox.intersectsBox(pierBox)) {
            const overlap = new THREE.Vector3();
            const tugCenter = tugState.boundingBox.getCenter(new THREE.Vector3());
            const pierCenter = pierBox.getCenter(new THREE.Vector3());
            overlap.subVectors(tugCenter, pierCenter);

            const tugSize = tugState.boundingBox.getSize(new THREE.Vector3());
            const pierSize = pierBox.getSize(new THREE.Vector3());

            const overlapX = (tugSize.x / 2) + (pierSize.x / 2) - Math.abs(overlap.x);
            const overlapZ = (tugSize.z / 2) + (pierSize.z / 2) - Math.abs(overlap.z);

            if (overlapX > 0 && overlapZ > 0) {
                if (overlapX < overlapZ) {
                    tugState.position.x += overlapX * Math.sign(overlap.x);
                    tugState.velocity.x *= -0.5;
                } else {
                    tugState.position.z += overlapZ * Math.sign(overlap.z);
                    tugState.velocity.z *= -0.5;
                }
            }
        }

        // Colisao do Navio com Cais (Caisson)
        if (shipGroup && shipState.boundingBox.intersectsBox(pierBox)) {
            const overlapShip = new THREE.Vector3();
            const shipCenter = shipState.boundingBox.getCenter(new THREE.Vector3());
            const pierCenter = pierBox.getCenter(new THREE.Vector3());
            overlapShip.subVectors(shipCenter, pierCenter);

            const shipSize = shipState.boundingBox.getSize(new THREE.Vector3());
            const pierSizeLocal = pierBox.getSize(new THREE.Vector3());

            const overlapXShip = (shipSize.x / 2) + (pierSizeLocal.x / 2) - Math.abs(overlapShip.x);
            const overlapZShip = (shipSize.z / 2) + (pierSizeLocal.z / 2) - Math.abs(overlapShip.z);

            if (overlapXShip > 0 && overlapZShip > 0) {
                if (overlapXShip < overlapZShip) {
                    shipState.position.x += overlapXShip * Math.sign(overlapShip.x);
                    shipState.velocity.x *= -0.2; // Alta absorção de choque por causa do peso
                } else {
                    shipState.position.z += overlapZShip * Math.sign(overlapShip.z);
                    shipState.velocity.z *= -0.2;
                }
            }
        }
    });

    buoys.forEach(buoy => {
        if (tugState.boundingBox.intersectsSphere(buoy.collider)) {
            const tugCenter = tugState.boundingBox.getCenter(new THREE.Vector3());
            const buoyCenter = buoy.collider.center;

            const normal = new THREE.Vector3().subVectors(tugCenter, buoyCenter).normalize();

            const pushForceToTug = normal.clone().multiplyScalar(0.1);
            tugState.velocity.add(pushForceToTug);

            const pushForceToBuoy = normal.clone().multiplyScalar(-0.8);
            buoy.velocity.add(pushForceToBuoy);
        }
    });
}

function updateCamera(dt) {
    let focusGroup = cgPivot; // Default Tug
    let scaleH = 1.0;
    let scaleV = 1.0;

    if (cameraTargetEntity === 'ship' && shipGroup) {
        focusGroup = shipGroup;
        // Escala os offsets criados para o rebocador minúsculo para se adequarem
        // ao escopo gigantesco do casco do cargueiro (Puxando a câmera longe)
        scaleH = 12.0;
        scaleV = 6.0;
    }

    if (currentView === 'orbit') {
        const lerpFactor = Math.min(dt * 5.0, 1.0);
        controls.target.lerp(focusGroup.position, lerpFactor);
        controls.update();
        return;
    }

    const view = cameraViews[currentView];

    let posLocal = new THREE.Vector3(view.pos.x * scaleH, view.pos.y * scaleV, view.pos.z * scaleH);
    let targetLocal = new THREE.Vector3(view.target.x * scaleH, view.target.y * scaleV, view.target.z * scaleH);

    // Se o cargueiro foi modelado esticado no eixo X (ao invés do Z padrão do ThreeJS), 
    // a câmera vai parecer trocada (proa vira estibordo, etc). Então, rodamos os vetores 90 graus!
    if (cameraTargetEntity === 'ship' && !shipPhysics.isZAxisLonger) {
        const upVector = new THREE.Vector3(0, 1, 0);
        posLocal.applyAxisAngle(upVector, Math.PI / 2);
        targetLocal.applyAxisAngle(upVector, Math.PI / 2);
    }

    const desiredPos = posLocal.applyMatrix4(focusGroup.matrixWorld);
    const desiredTarget = targetLocal.applyMatrix4(focusGroup.matrixWorld);

    const lerpFactor = Math.min(dt * 5.0, 1.0);
    camera.position.lerp(desiredPos, lerpFactor);
    controls.target.lerp(desiredTarget, lerpFactor);
}

function updateScene() {
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

    // Debug Panel Update
    const debugPanel = document.getElementById('debug-log-panel');
    if (debugPanel) {
        debugPanel.innerHTML = `
            <b>LOGS FÍSICOS (EM TEMPO REAL):</b><br/>
            [REBOC] Força Empuxo: ${(debugData.tugForce || 0).toFixed(0)} N<br/>
            [CABO] Tensão Lida: ${((debugData.lineTension || 0) / 9807).toFixed(2)} TON<br/>
            [CABO] Ponto Ruptura: ${(physics.lineBreakingLoad / 9807).toFixed(0)} TON<br/>
            <hr style="border-color:#333; margin:5px 0;">
            [NAVIO] Massa Física: ${shipPhysics.mass.toLocaleString()} kg<br/>
            [NAVIO] Inércia Rot.: ${shipPhysics.momentOfInertia.toLocaleString()}<br/>
            [NAVIO] Força Recebida: ${(debugData.shipForce || 0).toFixed(0)} N<br/>
            [NAVIO] Torque Aplicado: ${(debugData.shipTorque || 0).toFixed(0)} Nm
        `;
    }
}

function updateMooringButtonsState() {
    if (!cgPivot || isConstructionMode) return;
    const mooringBollards = portElements.filter(el => el.type === 'bollard');

    if (!mooringState.bow.isMoored) {
        let isNearBollard = false;
        if (mooringBollards.length > 0) {
            const mooringPointWorld = cgPivot.localToWorld(mooringState.bow.mooringPoint.clone());
            for (const bollardEl of mooringBollards) {
                const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
                if (mooringPointWorld.distanceTo(worldBollardPos) <= MOORING_DISTANCE_THRESHOLD) {
                    isNearBollard = true;
                    break;
                }
            }
        }
        ui.moorBow.disabled = !isNearBollard;
    }

    if (!mooringState.stern.isMoored) {
        let isNearBollard = false;
        if (mooringBollards.length > 0) {
            const mooringPointWorld = cgPivot.localToWorld(mooringState.stern.mooringPoint.clone());
            for (const bollardEl of mooringBollards) {
                const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
                if (mooringPointWorld.distanceTo(worldBollardPos) <= MOORING_DISTANCE_THRESHOLD) {
                    isNearBollard = true;
                    break;
                }
            }
        }
        ui.moorStern.disabled = !isNearBollard;
    }

    // Navio Cargueiro ao Cais (Habilitar Botões)
    if (shipGroup) {
        const SHIP_MOORING_THRESHOLD = 50;
        const pierBollards = portElements.filter(el => el.type === 'bollard' && !el.isShipBollard);

        if (!shipMooringState.bow.isMoored) {
            let isNearBollard = false;
            if (pierBollards.length > 0) {
                const mooringPointWorld = shipGroup.localToWorld(shipMooringState.bow.mooringPoint.clone());
                for (const bollardEl of pierBollards) {
                    const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
                    if (mooringPointWorld.distanceTo(worldBollardPos) <= SHIP_MOORING_THRESHOLD) {
                        isNearBollard = true;
                        break;
                    }
                }
            }
            ui.moorShipBow.disabled = !isNearBollard;
        }

        if (!shipMooringState.stern.isMoored) {
            let isNearBollard = false;
            if (pierBollards.length > 0) {
                const mooringPointWorld = shipGroup.localToWorld(shipMooringState.stern.mooringPoint.clone());
                for (const bollardEl of pierBollards) {
                    const worldBollardPos = bollardEl.mesh.getWorldPosition(new THREE.Vector3());
                    if (mooringPointWorld.distanceTo(worldBollardPos) <= SHIP_MOORING_THRESHOLD) {
                        isNearBollard = true;
                        break;
                    }
                }
            }
            ui.moorShipStern.disabled = !isNearBollard;
        }
    }
}

function setupConstructionControls() {
    ui.toggleConstructionMode.addEventListener('click', () => {
        isConstructionMode = !isConstructionMode;
        if (isConstructionMode) {
            enterConstructionMode();
        } else {
            exitConstructionMode();
        }
    });

    ui.structureElevation.addEventListener('input', (e) => {
        const elevation = parseFloat(e.target.value);
        constructionSettings.elevation = elevation;
        ui.valStructureElevation.textContent = elevation.toFixed(1);
    });

    ui.structureRotation.addEventListener('input', (e) => {
        const rotation = parseFloat(e.target.value);
        constructionSettings.rotation = rotation;
        ui.valStructureRotation.textContent = rotation.toFixed(0);
        if (ghostObject) {
            ghostObject.rotation.y = THREE.MathUtils.degToRad(rotation);
        }
    });

    ui.addPier.addEventListener('click', () => startPlacement('pier'));
    ui.addBollard.addEventListener('click', () => startPlacement('bollard'));
    ui.clearPort.addEventListener('click', clearPort);
    const clearLevelsBtn = document.getElementById('clearLevelsBtn');
    if (clearLevelsBtn) {
        clearLevelsBtn.addEventListener('click', () => { clearPort(); clearBuoys(); });
    }
}

function enterConstructionMode() {
    tugState.isPaused = true;
    ui.toggleConstructionMode.textContent = 'Sair do Modo de Construção';
    ui.toggleConstructionMode.classList.remove('btn-warn');
    ui.toggleConstructionMode.classList.add('btn-danger');
    ui.constructionOptions.style.display = 'grid';
    constructionGrid.visible = true;
    controls.enableRotate = false;
}

function exitConstructionMode() {
    tugState.isPaused = false;
    ui.toggleConstructionMode.textContent = 'Entrar no Modo de Construção';
    ui.toggleConstructionMode.classList.add('btn-warn');
    ui.toggleConstructionMode.classList.remove('btn-danger');
    ui.constructionOptions.style.display = 'none';
    constructionGrid.visible = false;
    controls.enableRotate = true;
    cancelPlacement();
}

function startPlacement(type) {
    cancelPlacement();
    placementMode = type;

    let geometry, material;
    if (type === 'pier') {
        geometry = new RoundedBoxGeometry(8, 1.5, 40, 2, 0.2);
        material = new THREE.MeshStandardMaterial({ color: 0x605040, transparent: true, opacity: 0.6 });
    } else { // bollard
        geometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
        material = new THREE.MeshStandardMaterial({ color: 0x404040, transparent: true, opacity: 0.6 });
    }
    ghostObject = new THREE.Mesh(geometry, material);
    ghostObject.rotation.y = THREE.MathUtils.degToRad(constructionSettings.rotation);
    scene.add(ghostObject);
}

function cancelPlacement() {
    if (ghostObject) {
        scene.remove(ghostObject);
        ghostObject.geometry.dispose();
        ghostObject.material.dispose();
        ghostObject = null;
    }
    placementMode = null;
}

function createPortObjectMesh(type, elevation) {
    let geometry, material;
    if (type === 'pier') {
        geometry = new RoundedBoxGeometry(8, 1.5, 40, 2, 0.2);
        material = new THREE.MeshStandardMaterial({ color: 0x605040 });
    } else { // bollard
        geometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 16);
        material = new THREE.MeshStandardMaterial({ color: 0x404040 });
    }
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function placeObject(position) {
    if (!placementMode) return; // Sai se nenhum modo de construção estiver ativo
    const newMesh = createPortObjectMesh(placementMode, constructionSettings.elevation);
    newMesh.position.x = position.x;
    newMesh.position.y = position.y;
    newMesh.position.z = position.z;
    newMesh.rotation.y = THREE.MathUtils.degToRad(constructionSettings.rotation);
    scene.add(newMesh);

    portElements.push({
        id: THREE.MathUtils.generateUUID(),
        type: placementMode,
        mesh: newMesh,
    });

    cancelPlacement();
}

function clearPort() {
    portElements.forEach(el => {
        scene.remove(el.mesh);
        el.mesh.geometry.dispose();
        el.mesh.material.dispose();
    });
    portElements = [];
}


function onPointerMove(event) {
    if (!isConstructionMode || !placementMode) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(seaPlane, intersectPoint)) {
        ghostObject.position.x = Math.round(intersectPoint.x * 2) / 2;
        ghostObject.position.z = Math.round(intersectPoint.z * 2) / 2;

        ghostObject.rotation.y = THREE.MathUtils.degToRad(constructionSettings.rotation);

        if (placementMode === 'pier') {
            ghostObject.position.y = constructionSettings.elevation - 0.75;
        } else if (placementMode === 'bollard') {
            ghostObject.position.y = constructionSettings.elevation + 0.4;
        }
    }
}

function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();

    if (isConstructionMode) {
        if (placementMode) {
            placeObject(ghostObject.position);
        }
    } else if (activeBuoyColor) {
        if (raycaster.ray.intersectPlane(seaPlane, intersectPoint)) {
            createBuoy(intersectPoint, activeBuoyColor);
        }
        activeBuoyColor = null;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 1 / 30);

    if (!tugState.isPaused) {
        updateBuoys(dt);
        checkCollisions();
        updatePhysics(dt);
        updateScene();
        updateMooringButtonsState();
    }

    updateCamera(dt);
    renderer.render(scene, camera);
}

init();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
