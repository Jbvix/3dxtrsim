# 📖 Glossário Técnico de Programação - ASD TUG SIMULATOR v3.4

Este documento lista e explica os principais conceitos de programação, engenharia de software e física matemática aplicados no código-fonte do CoastalBrasil ASD TUG SIM.

---

## 🏗️ 1. Tecnologias Fundamentais

*   **Three.js:** Uma biblioteca JavaScript *cross-browser* leve e poderosa usada para criar e exibir gráficos 3D animados nativamente no navegador, sem precisar de plugins.
*   **WebGL:** A API de baixo nível do navegador (acessada pelo Three.js) que permite usar a aceleração da Placa de Vídeo (GPU) diretamente nas páginas de internet.
*   **Vanilla JS (ES6+):** Uso de JavaScript moderno sem complexos frameworks (como Angular ou Vue) para a engenharia central da física, garantindo máxima performance a 60 FPS (Frames por Segundo).
*   **Tailwind CSS:** Um framework de estilo CSS no formato *utility-first* utilizado para desenhar os painéis *glassmorphism* flutuantes sobre a janela do 3D rapidamente.
*   **HTML5 Custom Elements (Web Components):** Utilizado na construção da tag `<asd-panel-launcher>`. Trata-se da criação de tags HTML personalizadas e encapsuladas que funcionam de forma modular em qualquer página.

---

## 🧮 2. Matemática e Geometria Espacial 3D

*   **Vector3 (Vetor Tridimensional):** A classe central em simulações. Armazena as componentes X, Y e Z no espaço. Usado extensamente no simulador para definir Forças (Vento, Propulsão), Posição de Barcos e Escala.
*   **Eulerização e Matrizes (Matrix4):** Rotinas avançadas para cálculo de rotação. Uma `Matrix4` rastreia transformações geométricas essenciais da malha 3D e é utilizada internamente para rastrear exatamente onde a câmera deve ir aos arredores do navio.
*   **Lerp (Linear Interpolation):** Algoritmo que encontra um valor intermediário entre o Ponto A e B baseado num percentual de tempo (`dt`). É a alma da ferramenta que faz o foco da câmera, ao focar do Rebocador para o Navio Cargueiro, "voar" maciamente ao invés de teleportar bruto.
*   **AABB (Axis-Aligned Bounding Box):** Um sistema matemático de colisão 3D simples e incrivelmente rápido (`boundingBox.intersectsBox`). O algoritmo cria "caixas invisíveis" sobre os cabeços do cais e do navio para detectar exatamente quando os cascos se tocam, acionando funções de choque inercial (kickback).
*   **QuadraticBezierCurve3:** Equação vetorial paramétrica usada no simulador para desenhar fluidamente "a barriga" dos cabos de amarração de aço quando este cabo perde a tensão sem a necessidade de desenhar milhares de vértices 3D estáticos.

---

## 🌊 3. Física de Simulacro Aplicada (Moto-Física)

*   **Integração de Euler no Tempo (`dt - Delta Time`):** A função de loop de renderização `requestAnimationFrame` em computadores mais rápidos rola mais vezes por segundo. O `dt` é um estabilizador temporal: ele garante que uma força em um rebocador a 20 FPS rode exatamente no mesmo peso/tempo que num monitor de 144 FPS.
*   **Lei de Hooke Avançada (Molas e Amortecedores / *Spring-Damper*):** Essa é a equação que resolve inteligentemente os cálculos vitais de tração do cabo. A fórmula clássica de Molas $F = k \cdot x$ pega o comprimento físico do barco e o alvo e compara com o comprimento natural da corda restrita, calculando uma força resistiva monstruosa. O *Damper* (amortecedor) absorve o choque bruto limitando "pulos" bruscos no sistema.
*   **Torque e Yaw Rate:** Enquanto vetores normais impulsionam linearmente, o Torque força o motor do navio a girar entorno de seu Centro de Eixo Z (`yaw`). O Yaw Rate capta o diferencial rotacional.
*   **Carga de Ruptura (*Breaking Load*):** Lógica simples computacional para destriçar o engajamento caso o pico do algoritmo do Módulo de Hooke estoure a tensão em Toneladas ajustadas pela UI pelo operador.

---

## 💻 4. Algoritmos de Arquitetura Web & Persistência

*   **Local Storage (Armazenamento Nativo):** O código usa a API de chave-valor `localStorage` embarcada nos navegadores para "gravar" os dados da cor de tinta atualizada do seu barco, tensão das amarras ou estados do mar permanentemente. Dessa forma os estados persistem após o usuário recarregar (pressionar `F5`) a página (o botão de salvação da aba de Ajustes & Status).
*   **DOM (Document Object Model) Dinâmico:** Atualização manual sem refresh (e sem frameworks como React) dos ponteiros HTML (Tensão em kNs, Comprimentos em metros).
*   **Heurísticas de Seleção por Materiais Tridimensionais:** O código implementa checagens nominais nos nós recursivos num modelo instanciado pela GLTFLoader. Ele percorre a árvore GLTF com a checagem que impede, por exemplo, que janelas (`Window`), metais e borrachas da defensa do rebocador (`rubber`) sejam erroneamente pintadas pela matiz do pincel colorido, aplicando nova cor do input apenas onde os identificadores sejam casco genérico puro.
*   **CORS (Cross-Origin Resource Sharing) & Security Headers:** Regras de servidor programadas num `netlify.toml` acoplado instrução no Netlify Edge. Embutidos em requisições de Front-End, impede conexões de hotlinking descaradas e roubo invisível das conexões e de Frames e Scripts dos códigos. Adicionalmente o JS previne cliques indevidos nos elementos de engenharia reversa no F12 do navegador do cliente operante. 
