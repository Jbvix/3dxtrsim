# Estatísticas Gerais do Projeto: ASD TUG SIM

Este documento exibe um raio-X completo do que construímos no repositório. O porte deste simulador alcançou o nível profissional digno de *engines indie*.

## 📊 Estatísticas Gerais 
* **Total de Arquivos:** 13 arquivos de código local (Fora dependências via CDN do Three.js)
* **Tamanho em Disco:** ~567 KB só de texto puro de programação (Código-fonte compacto e otimizado)
* **Total de Linhas Escritas:** **11.245 linhas de código (!)**

## 🧠 Por Linguagem (O "Cérebro" do App)
* 🟡 **JavaScript puro (ES6 Modules):** 9.314 Linhas
    * *Maior arquivo:* `js/app.js` (O Motor Físico Principal e Game Loop) com **2.265 linhas** de matemática e renderização 3D.
* 🟠 **HTML5 (Estrutura e DOM):** 1.281 Linhas 
    * Onde construímos toda a camada de *overlays* flutuantes e botões de interface transparente.
* 🔵 **CSS (Estilo e Tipografia):** 650 Linhas
    * Responsável pela arquitetura visual da UI "Dark-Glassmorphism" sem utilizar nenhum framework de arrasto de peso (zero Bootstrap/Tailwind).

## ⚙️ A Engenharia por trás dos Números (Features Vivas)
1. **Motor Físico Naval e Dinâmico:** Processamento em tempo real a `60 Frames Por Segundo`. A matemática avalia Torques de Guinchos, Tensão do Cabo (`Spring Force`), Arrasto de Vento/Corrente e vetores de Motores Azimutais independentes a cada `0.016s`!
2. **Propulsores (Azimuth Stern Drives - ASD):** Suporte nativo para controle bifásico (`Bombordo` e `Estibordo`) com painel analógico via Iframe, transferindo sinal de `RPM` e `Ângulos (0 a 360)`.
3. **Módulos de Amarração Dupla:** 1 Motor simulado para corda de PROA e 1 paralelo para POPA, incluindo estados de embreagem (Desacoplado, Freio e Joystick com Recolhimento sob tração).
4. **Mundo Open-World Escalável (Porto 3D):** Uma máquina de geração contínua via ferramentas de "Construtor" (Modo Construção de píer, cabeços e balizamentos de calado). Permite spawn infinito de bóias marítimas até a VRAM do usuário suportar.
5. **Câmeras Tracking:** Sistema dinâmico embutido simulando Visão de Comandante (Capitão, Drone Submarino, Perseguição de Guindaste, Visão Livre).

> *"O que você tem rodando nativamente no navegador da Web é essencialmente o embrião de um Navigations Simulator Escolar/Industrial construído do zero via WebGL, sem o overhead de engines pesadas como Unity ou Unreal."*
