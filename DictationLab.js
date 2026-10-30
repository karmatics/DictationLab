class DictationLab {
  constructor() {
    this.root = null;
    this.lattice = null;
    this.policy = null;
    this.surface = null;
    this.adapter = null;
    this._timers = [];
    this._statTimer = null;
  }

  async run(env) {
    if (this.root) this.destroy();
    if (!env || !env.container) throw new Error('[DictationLab] run() requires env.container');
    const h = LatticeSurface.h;

    this.lattice = new DictationLattice({ hotMs: 30000, warmMs: 180000 });
    this.policy = new DictationPolicy();
    this.adapter = new DictationEngineAdapter(this.lattice, { onStatus: t => { this.status.textContent = t; } });

    const btn = (label, fn, cls = '') => h('button', { className: 'ls-btn ' + cls, onclick: fn }, label);
    this.listenBtn = btn('Start Listening', () => this.toggleListen(), 'pri');
    this.status = h('div', { style: { flex: '1', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, '🔇 Idle');
    this.stats = h('div', { style: { padding: '6px 12px', borderTop: '1px solid #232d3f', background: '#0a0e1a', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' } });

    const bar = h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 12px', background: '#161e2b', borderBottom: '1px solid #232d3f', flexWrap: 'wrap' } },
      this.listenBtn,
      btn('Demo: U2', () => this.playDemo('u2')),
      btn('Demo: commands', () => this.playDemo('commands')),
      this.status,
      btn('Copy', () => navigator.clipboard.writeText(this.surface.getText())),
      btn('Clear', () => { this.cancelDemo(); this.lattice.reset(); })
    );
    const stage = h('div', { style: { flex: '1', minHeight: '0' } });

    this.root = h('div', { style: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#090d16', color: '#f1f5f9' } }, bar, stage, this.stats);
    env.container.appendChild(this.root);

    this.surface = new LatticeSurface(stage, this.lattice, this.policy);
    this._statTimer = setInterval(() => this.updateStats(), 700);
    this.updateStats();
    return this;
  }

  toggleListen() {
    if (this.adapter.isListening) { this.adapter.stop(); this.listenBtn.textContent = 'Start Listening'; }
    else if (this.adapter.start()) this.listenBtn.textContent = 'Stop Listening';
  }

  updateStats() {
    const s = this.lattice.stats();
    this.stats.textContent = `spans ${s.spans} (hot ${s.hot} / warm ${s.warm} / cold ${s.cold}) · choice points ${s.choices} · alternatives ${s.alts} · corrections ${s.corrections} · rules ${this.policy.rules.size}   |   Alt+click a span or click blank space to move the write head`;
  }

  cancelDemo() { this._timers.forEach(clearTimeout); this._timers = []; }

  playDemo(name) {
    this.cancelDemo();
    const p = 'demo' + Date.now();
    const scripts = {
      u2: [
        [0, `${p}:0`, "I'm going to the YouTube", {}],
        [800, `${p}:0`, "I'm going to the you too", {}],
        [1600, `${p}:0`, "I'm going to the U2 concert", {}],
        [2400, `${p}:0`, "I'm going to the U2 concert tonight", { final: true }],
        [2500, `${p}:0`, "I'm going to the YouTube concert tonight", { asAlt: true }]
      ],
      commands: [
        [0, `${p}:0`, "it's going to be great", {}],
        [800, `${p}:0`, "it's going to be great period new paragraph", {}],
        [1500, `${p}:0`, "it's going to be great period new paragraph", { final: true }],
        [2200, `${p}:1`, "say literal period when you want the word", {}],
        [3000, `${p}:1`, "say literal period when you want the word", { final: true }],
        [3600, `${p}:2`, "i saw you too at the concert", { final: true }]
      ]
    };
    (scripts[name] || []).forEach(([d, key, text, o]) => {
      this._timers.push(setTimeout(() => this.lattice.ingest(key, text, o), d));
    });
  }

  destroy() {
    this.cancelDemo();
    clearInterval(this._statTimer);
    if (this.adapter) this.adapter.destroy();
    if (this.surface) this.surface.destroy();
    if (this.root) this.root.remove();
    this.root = null;
  }
}

globalThis.DictationLab = DictationLab;
if (typeof module !== 'undefined' && module.exports) module.exports = DictationLab;