# BOAS-PRATICAS.md

**Boas Práticas de Programação**  
**Projeto:** Site Estático com Three.js (HTML + CSS + JavaScript Vanilla)

**Autor:** Jossian Brito  
**Versão do guia:** 1.4  
**Última atualização:** 01/04/2026 22:39

Este documento define os padrões obrigatórios para todo o código deste projeto. Seguir estas regras garante legibilidade, manutenibilidade, facilidade de correção e trabalho em equipe eficiente.

---

## 1. Cabeçalho Obrigatório (Regra Principal)

**Todo arquivo** (`.html`, `.css`, `.js`) **deve** começar com o cabeçalho abaixo:

### HTML
```html
<!--
  Título: index.html - Cena Principal com Three.js
  Autor: Jossian Brito
  Data da última modificação: 01/04/2026 22:39
  Versão: 1.2
  Descrição: Página principal que carrega o canvas Three.js e interface do usuário
-->
```

### CSS
```css
/* 
  Título: style.css
  Autor: Jossian Brito
  Data da última modificação: 01/04/2026 22:39
  Versão: 1.1
*/
```

### JavaScript / Three.js
```js
/*
  Título: SceneManager.js
  Autor: Jossian Brito
  Data da última modificação: 01/04/2026 22:39
  Versão: 1.3
  Descrição: Gerencia cena, câmera, renderer, objetos 3D, animações e controles
*/
```

> **Regra:** Sempre atualize a **data e hora** da última modificação ao editar qualquer arquivo.

---

## 2. Princípios Gerais de Programação

- **KISS** – Mantenha simples  
- **DRY** – Não repita código  
- **YAGNI** – Não implemente o que não é necessário agora  
- **Single Responsibility** – Uma função/classe deve ter apenas uma responsabilidade  
- **Composition over Inheritance** – Prefira composição  
- Código deve ser **legível** e **fácil de manter** (80% do custo de software está na manutenção)

---

## 3. Estrutura Recomendada de Pastas

```bash
threejs-project/
├── index.html
├── README.md
├── BOAS-PRATICAS.md
├── .gitignore
├── netlify.toml
│
├── /assets/
│   ├── /models/          # .glb, .gltf
│   ├── /textures/
│   ├── /fonts/
│   └── /audio/
│
├── /css/
│   └── style.css
│
├── /js/
│   ├── main.js                     # Ponto de entrada - inicializa tudo
│   ├── SceneManager.js             # Classe principal da experiência 3D
│   ├── /objects/                   # Objetos personalizados da cena
│   │   ├── Planet.js
│   │   ├── InteractiveCube.js
│   │   └── Environment.js
│   ├── /utils/                     # Funções auxiliares
│   │   ├── loaders.js
│   │   ├── resize.js
│   │   ├── disposeUtils.js
│   │   └── animationLoop.js
│   ├── /controls/                  # Controles de câmera e interação
│   │   └── OrbitControlsSetup.js
│   ├── /animations/                # Animações com GSAP ou Theatre.js
│   │   ├── gsapAnimations.js
│   │   └── theatreAnimations.js
│   └── /shaders/                   # Shaders personalizados
│
└── /vendor/                        # (opcional) three.js e dependências locais
```

---

## 4. Endentação e Formatação

- **Padrão obrigatório:** 2 espaços de endentação  
- Nunca misture tabs e espaços  
- Mantenha endentação consistente em HTML, CSS e JavaScript  
- Código bem endentado facilita encontrar erros rapidamente

---

## 5. Agrupamento Lógico do Código (Muito Importante)

Separe o código em blocos claros com comentários visíveis para facilitar correções específicas.

### Exemplo em JavaScript (Three.js)

```js
/*
  Título: SceneManager.js
  Autor: Jossian Brito
  Data da última modificação: 01/04/2026 22:39
  Versão: 1.3
*/

// ====================== IMPORTS ======================


// ====================== VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ======================


// ====================== CLASSES PERSONALIZADAS ======================


// ====================== FUNÇÕES UTILITÁRIAS ======================


// ====================== SETUP THREE.JS ======================
// cena, câmera, renderer, lights, etc.


// ====================== ANIMATION LOOP ======================


// ====================== EVENT LISTENERS ======================


// ====================== INICIALIZAÇÃO ======================
function init() { ... }
```

### Exemplo em CSS
```css
/* ====================== RESET ====================== */
/* ====================== TIPOGRAFIA ====================== */
/* ====================== LAYOUT ====================== */
/* ====================== COMPONENTES ====================== */
/* ====================== MEDIA QUERIES ====================== */
```

---

## 6. Convenções de Nomenclatura

| Tipo                  | Padrão            | Exemplo                          |
|-----------------------|-------------------|----------------------------------|
| Arquivos              | kebab-case        | `scene-manager.js`               |
| Classes               | PascalCase        | `SceneManager`                   |
| Funções / Variáveis   | camelCase         | `createLights()`, `handleResize` |
| Constantes            | UPPER_SNAKE_CASE  | `DEFAULT_CAMERA_POSITION`        |
| Classes CSS / IDs     | kebab-case        | `canvas-container`               |

---

## 7. Boas Práticas Específicas para Three.js

- Crie classes separadas para objetos complexos (`Planet.js`, `Environment.js`)
- Centralize o `requestAnimationFrame` em um único loop
- Use `THREE.Clock` para controlar o tempo
- Sempre faça `dispose()` de geometrias e materiais quando remover objetos
- Separe responsabilidades: carregamento de modelos, animações (GSAP/Theatre.js), controles e utils
- Mantenha shaders em arquivos separados ou como template literals bem comentados
- Use lil-gui ou dat.GUI durante desenvolvimento para debug

---

## 8. Boas Práticas Gerais de Código

- Escreva código que se explique sozinho (bons nomes ajudam)
- Funções pequenas (ideal < 30 linhas)
- Comente o **porquê**, não o **o quê**
- Priorize legibilidade sobre "esperteza"
- Separe responsabilidades (HTML = estrutura, CSS = visual, JS = comportamento)
- Use HTML semântico
- Mantenha CSS separado do HTML
- Atualize este arquivo sempre que surgirem novas regras

---

## 9. Dicas de Manutenção

- Atualize a data/hora do cabeçalho toda vez que editar um arquivo
- Mantenha o código modular e bem agrupado
- Revise periodicamente se o projeto continua seguindo estas práticas
- Use commits atômicos e mensagens claras
- Documente decisões importantes no README.md

---

**Filosofia do Projeto:**

> "Código bom não é apenas o que funciona hoje.  
> É o que outro desenvolvedor (ou você no futuro) consegue entender e modificar facilmente amanhã."

Seguir estas boas práticas desde o início reduz drasticamente o tempo e o custo de manutenção.

---

*Guia mantido por Jossian Brito*  
*Qualquer sugestão de melhoria: abra uma Issue*
