/*
  Título: AsdPanelLauncher.js
  Autor: Jossian Brito
  Data da última modificação: 02/04/2026 09:28
  Versão: 1.0
  Descrição: Custom Element para o painel flutuante ASD e hooks de interface
*/

/* ===== Custom Element: ASD Panel Launcher (autônomo) ===== */
class AsdPanelLauncher extends HTMLElement {
  _initialState = { top: '70px', right: '12px', left: 'auto', width: '336px', height: '480px' };
  _isFullScreen = false;
  _lastState = { ...this._initialState };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const src    = this.getAttribute('data-src')   || './asdcontrol.html';
    const title  = this.getAttribute('data-title') || 'Painel ASD';

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .root { position: fixed; inset: 0; z-index: 9999; pointer-events: none; }
      .win { position: fixed;
             display: none; pointer-events: auto; background: #fff; color: #111; border-radius: 14px;
             box-shadow: 0 24px 60px rgba(0,0,0,.25); border: 1px solid #e7e7e7;
             min-width: 336px; min-height: 480px; overflow: hidden;
             will-change: top, left;
      }
      .win.transition { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
      .hdr { height: 44px; display: flex; align-items: center; gap: 8px; padding: 0 12px; cursor: move; touch-action: none;
             background: linear-gradient(180deg, #f8f9fb 0%, #f0f2f5 100%); border-bottom: 1px solid #e6e8eb; }
      .ttl { flex: 1; font: 600 13px/1 system-ui, -apple-system, Segoe UI, Roboto; letter-spacing: .2px; text-align: center; }
      .hdr-buttons { display: flex; gap: 8px; position: absolute; left: 12px; }
      .hdr-btn { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; }
      .hdr-btn.close { background-color: #ff5f57; }
      .hdr-btn.full { background-color: #28c840; }
      .cnt { width: 100%; height: calc(100% - 44px); background: #fff; }
      iframe { width: 100%; height: 100%; border: 0; display: block; }
      .resize-handle { position: absolute; bottom: 0; right: 0; width: 16px; height: 16px;
                       cursor: se-resize; z-index: 10;
                       background: repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.2) 3px, rgba(0,0,0,0.2) 4px);
      }
      @media (max-width: 520px) {
        .win { top: 64px !important; right: 6px !important; left: 6px !important; width: auto !important; height: calc(100vh - 80px) !important; }
      }
    `;

    const root = document.createElement('div');
    root.className = 'root';

    const win = document.createElement('div');
    win.className = 'win';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'false');
    win.setAttribute('aria-label', title);
    Object.assign(win.style, this._initialState);

    const hdr = document.createElement('div');
    hdr.className = 'hdr';
    hdr.innerHTML = `
      <div class="hdr-buttons">
        <div class="hdr-btn close" title="Fechar" aria-label="Fechar"></div>
        <div class="hdr-btn full" title="Tela Cheia" aria-label="Tela Cheia"></div>
      </div>
      <span class="ttl">${title}</span>`;

    const cnt = document.createElement('div'); cnt.className = 'cnt';
    const iframe = document.createElement('iframe');
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer';
    // A propriedade 'src' será definida na primeira vez que o painel for aberto.

    const handle = document.createElement('div');
    handle.className = 'resize-handle';

    win.appendChild(hdr);
    win.appendChild(cnt);
    win.appendChild(handle);
    
    // Adiciona o iframe ao seu contêiner.
    cnt.appendChild(iframe);

    root.appendChild(win);
    this.shadowRoot.append(style, root);

    // Armazena referências
    this._win = win; this._hdr = hdr; this._handle = handle;
    this._iframe = iframe;
    this._src = src;

    hdr.querySelector('.close').addEventListener('click', () => this.close());
    hdr.querySelector('.full').addEventListener('click', () => this.toggleFullScreen());

    const drag = { active:false, ox:0, oy:0, raf:0 };
    const onPointerMove = (e) => {
      if (!drag.active) return; e.preventDefault();
      const nx = e.clientX - drag.ox, ny = e.clientY - drag.oy;
      if (!drag.raf) drag.raf = requestAnimationFrame(() => {
        this._win.style.left = `${nx}px`;
        this._win.style.top  = `${ny}px`;
        this._win.style.right = 'auto';
        this._win.style.bottom = 'auto';
        drag.raf = 0;
      });
    };
    hdr.addEventListener('pointerdown', (e) => {
      if (!(e.buttons & 1) || e.target.classList.contains('hdr-btn')) return;
      drag.active = true;
      const r = this._win.getBoundingClientRect();
      drag.ox = e.clientX - r.left; drag.oy = e.clientY - r.top;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', () => {
        drag.active = false; window.removeEventListener('pointermove', onPointerMove);
      }, { once:true });
    });

    const resize = { active:false, w:0, h:0, mx:0, my:0, raf:0 };
    const onPointerMoveResize = (e) => {
      if (!resize.active) return; e.preventDefault();
      const nw = resize.w + (e.clientX - resize.mx);
      const nh = resize.h + (e.clientY - resize.my);
      if (!resize.raf) resize.raf = requestAnimationFrame(() => {
        this._win.style.width = `${nw}px`;
        this._win.style.height = `${nh}px`;
        resize.raf = 0;
      });
    };
    handle.addEventListener('pointerdown', (e) => {
      if (!(e.buttons & 1)) return; resize.active = true;
      const r = this._win.getBoundingClientRect();
      resize.w = r.width; resize.h = r.height; resize.mx = e.clientX; resize.my = e.clientY;
      window.addEventListener('pointermove', onPointerMoveResize);
      window.addEventListener('pointerup', () => {
        resize.active = false; window.removeEventListener('pointermove', onPointerMoveResize);
      }, { once:true });
    });
  }

  connectedCallback() {
    const alias = this.getAttribute('data-alias') || 'asdPanel';
    window[alias] = {
      open:   () => this.open(),
      close:  () => this.close(),
      toggle: () => this.toggle(),
      isOpen: () => this._win.style.display === 'block'
    };
  }

  open()   {
    if (this._win.style.display !== 'block') {
      // Carrega o conteúdo do iframe apenas na primeira abertura
      if (!this._iframe.src) {
        this._iframe.src = this._src;
      }
      this._win.style.display = 'block';
      this.dispatchEvent(new CustomEvent('panel-opened', {bubbles:true, composed:true}));
    }
  }
  close()  { if (this._win.style.display !== 'none')  { this._win.style.display = 'none';  this.dispatchEvent(new CustomEvent('panel-closed', {bubbles:true, composed:true})); } }
  toggle() { this._win.style.display === 'block' ? this.close() : this.open(); }

  toggleFullScreen() {
    this._win.classList.add('transition');
    if (this._isFullScreen) {
      Object.assign(this._win.style, this._lastState);
    } else {
      const rect = this._win.getBoundingClientRect();
      this._lastState = { top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`, right: 'auto', bottom: 'auto' };
      Object.assign(this._win.style, {
        top: '10px', left: '10px',
        width: 'calc(100vw - 20px)', height: 'calc(100vh - 20px)',
        right: '10px', bottom: '10px'
      });
    }
    this._isFullScreen = !this._isFullScreen;
    setTimeout(() => this._win.classList.remove('transition'), 300);
  }
}
customElements.define('asd-panel-launcher', AsdPanelLauncher);
/* ===== Hook do botão da SIDEBAR =====
   Seletor: .sidebar-btn[data-panel-id="panel-asd-2d"] */
const btnASD = document.querySelector('.sidebar-btn[data-panel-id="panel-asd-2d"]');
const internalPanel = document.getElementById('panel-asd-2d');

// 1) Estado inicial coerente (usaremos o painel AUTÔNOMO)
if (btnASD) btnASD.classList.remove('active');
if (internalPanel) internalPanel.style.display = 'none';

// 2) Intercepta o clique ANTES do handler padrão (capture:true)
//    e abre/fecha o painel autônomo via window.asdPanel
if (btnASD) {
  btnASD.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopImmediatePropagation();  // bloqueia o toggle do painel interno
    // alterna o autônomo
    window.asdPanel?.toggle?.();
    // reflete o estado visual no botão
    const opened = window.asdPanel?.isOpen?.();
    btnASD.classList.toggle('active', !!opened);
    // garante que o painel interno permaneça fechado
    if (internalPanel) internalPanel.style.display = 'none';
  }, { capture: true });
}
