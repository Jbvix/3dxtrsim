# ⚓ CoastalBrasil ASD TUG SIMULATOR (v3.5)

[![Netlify Status](https://api.netlify.com/api/v1/badges/378d4ef0-77ec-4eda-9b9c-1687921ca5b4/deploy-status)](https://app.netlify.com/projects/3dxtrsim/deploys)
> **Laboratório Hidrodinâmico Digital de Rebocadores Azimuth Stern Drive.**

Este projeto baseia-se em simulador numérico de operações navais severas construído sobre matemática crua e renderização tridimensional no navegador. Ele transcende a lógica clássica de jogos e propõe regras rígidas de atracação portuária via forças vetoriais para fins de treinamento e análise.

🌟 **[Acesse o Simulador Ao Vivo Aqui!](https://3dxtrsim.netlify.app)**

---

## 🛠️ Tecnologias de Base

A arquitetura do CoastalBrasil ASD Simulator elimina dependências de "Caixas Pretas" fechadas de mercado (Unity/Unreal). O motor processa gráficos e cálculos complexos de molas inteiramente sob os ombros da Web Pura:

*   **HTML5 / Vanilla Javascript (ES6+)**
*   **Three.js** (WebGL nativo para processamento PBR massivo nas Placas de Vídeo).
*   **TailwindCSS** (Estilo paramétrico fluído dos painéis da Landing Page).
*   **Netlify Edge Hosting** (Ambiente Seguro com Proteções Globais e Anti-Hotlinking no Nível 2).

### 💡 Funcionalidades Principais (Release 3.5)

*   **Construtor Portuário Sandbox Expandido:** Adição de ferramentas de criação de cenários modulares estendidas no próprio navegador, incluindo Cais Gigantescos (150m+), Guindastes Logísticos STS (Ship-to-Shore), Armazéns (Hangares), Containers Procedurais e Postes de Luz com emissão inteligente GPU-Friendly. Apresentando também navegação orbital 100% livre durante a obra.
*   **Licenciamento Acadêmico Copyleft (CC BY-NC-SA 4.0):** Atualizado do clássico MIT para a rigidez do Creative Commons para coibir o enclausuramento (fechamento por corporações) e evitar exploração comercial sem autorização, garantindo que as comunidades abertas tenham acesso irrestrito eterno e contínuo.
*   **Twin-Simulation Independente:** Domínio total sobre os manetes de um poderoso rebocador ASD e comutação instantânea para o passadiço independente de um **Navio Cargueiro de +60.000 Toneladas**.
*   **Atracação e Choque Analítico (Hooke's Law):** Cabos vetoriais reagem com rigor acadêmico limitando Força de Ruptura (*Breaking Load em Tensões T/kN*), Rigidez e Amortecimento. E colisões detectadas via caixas AABB entre píeres fixos, navios pesados e construções que simulam transferências inelásticas de energia com perdas naturais.
*   **Integração Atmosférica Paramétrica:** Ventos em cruzamento vetorial puro de até 50 Nós e Correntes Hidrodinâmicas tridimensionais atuando na força de atrito e *yaw* (guinada rotacional) do navio sob peso pesado.
*   **Matrizes Visuais:** Órbita tridimensional de câmeras inteligentes que se auto-reconfiguram usando matrizes trigonométricas dependendo das escalas entre rebocador ($15m$) ou supercargueiros ($~200m$). E repintura total através de heurísticas de malhas PBR.

---

## 🏗️ Como Executar Localmente (Desenvolvimento)

Para rodar este software isolado das travas do CORS via módulos ES nativos:

1.  Clone este repositório `git clone https://github.com/Jbvix/3dxtrsim.git`
2.  Levante um micro-servidor. Recomendamos uso do Python:
    ```bash
    python -m http.server 8080
    ```
    Ou via Node.js:
    ```bash
    npx serve .
    ```
3.  Abra seu navegador Chrome ou Edge em: `http://localhost:8080/index.html`

---

## 📚 Documentação Adicional

Este código obedece fielmente aos padrões rígidos do nosso projeto. É de leitura **OBRIGATÓRIA** para futuros contribuidores:
*   [📕 Diretrizes de Arquitetura e Engenharia de Manutenção (Boas-Práticas)](BOAS-PRATICAS.md)
*   [📘 Glossário de Programação e Componentes Funcionais (Teoria e APIs do Motor)](GLOSSARIO_TECNICO.md)

---

## 📞 Contato Acadêmico e Comercial
Qualquer anomalia no comportamento do rebocador e sugestão de melhorias:

*   **O Projeto Inicial:** _ASDTUGSIM Lab Engine © 2026_ criado por **Jossian Brito**.
*   **WhatsApp Comercial:** [+55 (85) 99773-7230](https://wa.me/5585997737230)
*   **Correio Eletrônico:** [jossiancosta@gmail.com](mailto:jossiancosta@gmail.com)

> _"A ciência dos oceanos transformada em precisão digital. A ponte entre teorias náuticas e passadiços virtuais."_
