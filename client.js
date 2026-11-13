window.__ModuleLoader__.load({
  id: 'dsh-podcast-notes',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const STYLE_ID = 'dsh-podcast-notes-style';

    function ensureStyles() {
      if (typeof document === 'undefined') return;
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
.pn-root{--pn-accent:#d9482b;--pn-accent-soft:color-mix(in srgb,var(--pn-accent) 10%,transparent);height:100%;min-height:420px;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-base,inherit);container-type:inline-size}
.pn-root *{box-sizing:border-box}
.pn-root button,.pn-root input,.pn-root select,.pn-root textarea{font-family:inherit}
.pn-header{flex:none;display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);background:linear-gradient(180deg,color-mix(in srgb,var(--pn-accent) 6%,transparent),transparent)}
.pn-logo{width:36px;height:36px;border-radius:11px;flex:none;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#ff9a6b,#d9482b);box-shadow:0 4px 14px color-mix(in srgb,var(--pn-accent) 30%,transparent)}
.pn-heading{min-width:0;flex:1}
.pn-title{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:680;letter-spacing:-.01em;line-height:1.3}
.pn-sub{color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-head-actions{display:flex;align-items:center;gap:6px;flex:none}
.pn-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 11px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer;transition:background .15s,border-color .15s,color .15s;white-space:nowrap}
.pn-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l4)}
.pn-btn:disabled{opacity:.5;cursor:default}
.pn-btn-primary{background:linear-gradient(135deg,#e9663f,#cf4026);border-color:transparent;color:#fff;box-shadow:0 2px 8px color-mix(in srgb,var(--pn-accent) 26%,transparent)}
.pn-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#ee7550,#d84a2d);border-color:transparent}
.pn-btn-ghost{background:transparent;border-color:transparent;color:var(--dsw-alias-label-secondary);padding:0 8px}
.pn-btn-ghost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pn-btn-icon{width:30px;padding:0}
.pn-btn-sm{height:26px;font-size:11px;padding:0 9px;border-radius:7px}
.pn-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(286px,338px) minmax(0,1fr)}
.pn-side{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 38%,var(--dsw-alias-bg-layer-1))}
.pn-side-top{flex:none;padding:10px 10px 6px;display:flex;flex-direction:column;overflow:hidden;border-bottom:1px solid var(--dsw-alias-border-l2)}
.pn-chips{display:flex;flex-wrap:wrap;gap:5px;padding-bottom:2px;flex:none}
.pn-feed-resizer{flex:none;height:7px;margin:-1px 0 0;cursor:ns-resize;position:relative;touch-action:none}
.pn-feed-resizer::before{content:'';position:absolute;left:50%;top:2px;width:40px;height:3px;margin-left:-20px;border-radius:3px;background:color-mix(in srgb,var(--dsw-alias-label-tertiary) 42%,transparent);transition:background .15s,width .15s}
.pn-feed-resizer:hover::before,.pn-feed-resizer:active::before{width:56px;background:color-mix(in srgb,var(--pn-accent) 55%,var(--dsw-alias-border-l2))}
.pn-chip{flex:none;display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}
.pn-chip:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l4)}
.pn-chip-on{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground)}
.pn-chip-on:hover{color:var(--dsw-alias-label-primary-foreground)}
.pn-feeds{flex:1;min-height:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(136px,1fr));grid-auto-rows:48px;align-content:start;gap:7px;overflow-y:auto;padding:9px 0 2px;scrollbar-width:thin}
.pn-feeds > .pn-empty{grid-column:1/-1;align-self:start}
.pn-feed{position:relative;width:auto;min-width:0;display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);cursor:pointer;text-align:left;color:inherit;overflow:hidden}
.pn-feed:hover{border-color:var(--dsw-alias-border-l4)}
.pn-feed-on{border-color:color-mix(in srgb,var(--pn-accent) 62%,var(--dsw-alias-border-l2));background:var(--pn-accent-soft);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pn-accent) 20%,transparent)}
.pn-feed-avatar{position:relative;width:30px;height:30px;border-radius:8px;flex:none;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#ffd0bf,#f19b7e);color:#8b2f17;font-size:13px;font-weight:700}
.pn-feed-avatar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pn-feed-copy{min-width:0;flex:1}
.pn-feed-name{font-size:12px;font-weight:620;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-feed-meta{font-size:10px;color:var(--dsw-alias-label-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pn-new-dot{flex:none;min-width:16px;height:16px;padding:0 4px;border-radius:999px;background:var(--pn-accent);color:#fff;font-size:9px;font-weight:700;display:grid;place-items:center}
.pn-list-tools{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}
.pn-search{flex:1;min-width:0;display:flex;align-items:center;gap:6px;height:28px;padding:0 8px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}
.pn-search input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:11.5px}
.pn-search input::placeholder{color:var(--dsw-alias-label-tertiary)}
.pn-filter{height:28px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:11px;padding:0 4px;outline:none;cursor:pointer;max-width:92px}
.pn-episodes{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}
.pn-ep{position:relative;display:block;width:100%;text-align:left;border:0;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-border-l2) 62%,transparent);background:transparent;color:inherit;padding:10px 12px 10px 22px;cursor:pointer}
.pn-ep:hover{background:var(--dsw-alias-interactive-bg-hover)}
.pn-ep-on{background:var(--pn-accent-soft);box-shadow:inset 3px 0 var(--pn-accent)}
.pn-ep-unread .pn-ep-title{font-weight:650}
.pn-unread-dot{position:absolute;left:8px;top:19px;width:6px;height:6px;border-radius:50%;background:#c2a05a;opacity:.82;box-shadow:0 0 0 2px color-mix(in srgb,#c2a05a 9%,transparent)}
.pn-star-badge{position:absolute;right:7px;top:7px;color:#d99a1b;display:inline-flex;filter:drop-shadow(0 1px 2px #0000001f)}
.pn-ep-starred .pn-ep-title{padding-right:19px}
.pn-menu{position:fixed;z-index:1500;min-width:156px;padding:4px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);box-shadow:0 12px 34px #00000033;display:flex;flex-direction:column;gap:1px}
.pn-menu button{height:30px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;text-align:left;cursor:pointer;display:flex;align-items:center;gap:7px}
.pn-menu button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.pn-menu button.pn-menu-danger{color:var(--color-red-500,#c43d3d)}
.pn-probe{margin-top:2px;padding:9px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.pn-probe b{display:block;color:var(--dsw-alias-label-primary);font-size:12.5px;margin-bottom:2px}
.pn-cat-options{display:flex;gap:5px;flex-wrap:wrap;margin-top:6px}
.pn-cat-option{height:24px;padding:0 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}
.pn-cat-option-on{border-color:color-mix(in srgb,var(--pn-accent) 55%,transparent);color:var(--pn-accent);background:var(--pn-accent-soft)}
.pn-ep-meta{display:flex;align-items:center;gap:6px;margin-top:4px;color:var(--dsw-alias-label-secondary);font-size:10px;flex-wrap:wrap}
.pn-ep-badges{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
.pn-badge{display:inline-flex;align-items:center;gap:3px;height:17px;padding:0 5px;border-radius:4px;font-size:9px;line-height:1;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.pn-badge-doc{color:var(--color-blue-500,#247bbf);border-color:color-mix(in srgb,var(--color-blue-500,#247bbf) 35%,transparent);background:color-mix(in srgb,var(--color-blue-500,#247bbf) 8%,transparent)}
.pn-badge-note{color:var(--color-green-600,#2c8a55);border-color:color-mix(in srgb,var(--color-green-600,#2c8a55) 35%,transparent);background:color-mix(in srgb,var(--color-green-600,#2c8a55) 8%,transparent)}
.pn-badge-new{color:var(--pn-accent);border-color:color-mix(in srgb,var(--pn-accent) 40%,transparent);background:var(--pn-accent-soft)}
.pn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:28px 20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.6}
.pn-empty b{color:var(--dsw-alias-label-primary);font-size:13px}
.pn-detail{min-width:0;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1)}
.pn-detail-head{flex:none;padding:16px 20px 0;border-bottom:1px solid var(--dsw-alias-border-l2);background:linear-gradient(180deg,color-mix(in srgb,var(--pn-accent) 4%,transparent),transparent)}
.pn-detail-eyebrow{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:10.5px;margin-bottom:5px}
.pn-detail-title{font-size:19px;line-height:1.4;font-weight:660;letter-spacing:-.015em;margin:0;overflow-wrap:anywhere}
.pn-title-link{color:inherit;text-decoration:none;cursor:pointer}
.pn-title-link:hover{text-decoration:underline;text-underline-offset:3px;text-decoration-color:color-mix(in srgb,var(--pn-accent) 55%,transparent)}

.pn-detail-meta{display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:var(--dsw-alias-label-secondary);font-size:11px;margin-top:7px}
.pn-detail-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:11px 0 10px}
.pn-tabs{display:flex;align-items:center;gap:2px;padding:0;margin-top:2px}
.pn-tab{position:relative;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;padding:8px 10px 9px;cursor:pointer;border-radius:6px 6px 0 0}
.pn-tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.pn-tab-on{color:var(--dsw-alias-label-primary);font-weight:620}
.pn-tab-on:after{content:"";position:absolute;left:9px;right:9px;bottom:0;height:2px;border-radius:2px;background:var(--pn-accent)}
.pn-tab-count{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary);font-size:10px;margin-left:4px}
.pn-detail-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:16px 20px 40px}
.pn-toolbar{display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.pn-toolbar .pn-spacer{flex:1}
.pn-transcript{white-space:pre-wrap;overflow-wrap:anywhere;font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12px;line-height:1.95;color:var(--dsw-alias-label-primary);margin:0;max-width:860px}
.pn-md{font-size:13.5px;line-height:1.8;max-width:820px;overflow-wrap:anywhere}
.pn-md .pn-hl{background:color-mix(in srgb,#ffd97d 62%,transparent);color:inherit;padding:1px 2px;border-radius:3px;box-shadow:inset 0 -1px 0 color-mix(in srgb,#e0a92e 60%,transparent)}
.pn-md ::selection{background:color-mix(in srgb,#ffd97d 55%,transparent)}
.pn-hlbar{position:fixed;z-index:60;display:flex;gap:4px;padding:4px;border-radius:8px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border:1px solid var(--dsw-alias-border-l2);box-shadow:0 6px 20px rgba(0,0,0,.22)}
.pn-hlbar button{display:flex;align-items:center;gap:4px;font-size:12px;padding:4px 9px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap}
.pn-hlbar button:hover{background:color-mix(in srgb,#ffd97d 45%,transparent)}
.pn-editor{display:flex;flex-direction:column;gap:10px;max-width:900px}
.pn-editor textarea{width:100%;min-height:52vh;padding:12px 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:12.5px;line-height:1.85;resize:vertical;outline:none}
.pn-editor textarea:focus{border-color:color-mix(in srgb,var(--pn-accent) 55%,transparent)}
.pn-editor-hint{font-size:11.5px;color:var(--dsw-alias-label-tertiary);line-height:1.7}
.pn-hl-list{display:flex;flex-direction:column;gap:8px;max-width:820px}
.pn-hl-item{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border-radius:8px;background:color-mix(in srgb,#ffd97d 16%,transparent);border:1px solid color-mix(in srgb,#e0a92e 28%,transparent);font-size:13.5px;line-height:1.75}
.pn-hl-index{flex:none;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:color-mix(in srgb,#e0a92e 40%,transparent);color:#3a2c07;font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;margin-top:1px;font-variant-numeric:tabular-nums}
.pn-hl-text{flex:1;min-width:0;overflow-wrap:anywhere}
.pn-btn-on{background:color-mix(in srgb,var(--pn-accent) 16%,transparent);border-color:color-mix(in srgb,var(--pn-accent) 45%,transparent);color:var(--pn-accent)}
.pn-md h1{font-size:21px;line-height:1.35;margin:4px 0 14px;letter-spacing:-.02em}
.pn-md h2{font-size:16.5px;margin:24px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.pn-md h3{font-size:14px;margin:18px 0 5px}
.pn-md h4{font-size:13px;margin:14px 0 4px}
.pn-md p{margin:8px 0}
.pn-md ul,.pn-md ol{margin:6px 0 10px;padding-left:22px}
.pn-md li{margin:3px 0}
.pn-md blockquote{margin:10px 0;padding:2px 12px;border-left:3px solid color-mix(in srgb,var(--pn-accent) 55%,transparent);color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--pn-accent) 4%,transparent);border-radius:0 6px 6px 0}
.pn-md code{font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:.9em;padding:1px 4px;border-radius:4px;background:var(--dsw-alias-bg-layer-2)}
.pn-md pre{overflow:auto;padding:10px 12px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.pn-md pre code{padding:0;background:transparent}
.pn-md a{color:var(--pn-accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--pn-accent) 40%,transparent)}
.pn-md a:hover{border-bottom-color:var(--pn-accent)}
.pn-desc{font-size:13.5px;line-height:1.9;color:var(--dsw-alias-label-primary);white-space:pre-wrap;max-width:860px;margin:0;opacity:.92}
.pn-cta{border:1px dashed color-mix(in srgb,var(--pn-accent) 38%,var(--dsw-alias-border-l2));background:linear-gradient(135deg,var(--pn-accent-soft),transparent 72%);border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:flex-start;gap:9px;max-width:560px}
.pn-cta-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--pn-accent) 14%,transparent);color:var(--pn-accent)}
.pn-cta b{font-size:14px}
.pn-cta p{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.65}
.pn-job{border:1px solid color-mix(in srgb,var(--color-blue-500,#247bbf) 32%,var(--dsw-alias-border-l2));background:color-mix(in srgb,var(--color-blue-500,#247bbf) 6%,var(--dsw-alias-bg-layer-1));border-radius:10px;padding:10px 12px;margin-bottom:12px;max-width:820px}
.pn-job-head{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600}
.pn-job-head .pn-grow{flex:1}
.pn-job pre{max-height:170px;overflow:auto;margin:8px 0 0;padding:8px;border-radius:6px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 70%,transparent);font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:10.5px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}
.pn-err{border:1px solid color-mix(in srgb,var(--color-red-500,#c43d3d) 35%,transparent);background:color-mix(in srgb,var(--color-red-500,#c43d3d) 7%,transparent);color:var(--dsw-alias-label-primary);border-radius:9px;padding:9px 11px;font-size:11.5px;margin-bottom:12px;line-height:1.6}
.pn-spinner{width:13px;height:13px;border-radius:50%;border:2px solid color-mix(in srgb,var(--color-blue-500,#247bbf) 28%,transparent);border-top-color:var(--color-blue-500,#247bbf);animation:pn-spin .8s linear infinite;flex:none;display:inline-block}
@keyframes pn-spin{to{transform:rotate(360deg)}}
.pn-loading{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;padding:14px}
.pn-overlay{position:fixed;inset:0;z-index:1200;background:#00000055;display:flex;align-items:center;justify-content:center;padding:18px}
.pn-modal{width:min(580px,100%);max-height:88vh;overflow-y:auto;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 24px 70px #0000003d}
.pn-modal-head{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l2);position:sticky;top:0;background:var(--dsw-alias-bg-layer-1);z-index:1}
.pn-modal-head b{font-size:14px;flex:1}
.pn-modal-body{padding:14px 16px;display:flex;flex-direction:column;gap:12px}
.pn-env{display:flex;flex-direction:column;gap:8px;padding:11px 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.pn-env-head{display:flex;align-items:center;gap:7px;font-size:12px}
.pn-env-dot{width:7px;height:7px;border-radius:50%;flex:none}
.pn-env-ok{background:var(--color-green-600,#2c8a55)}
.pn-env-warn{background:#c2a05a}
.pn-env-busy{background:var(--pn-accent);animation:pn-pulse 1.2s ease-in-out infinite}
.pn-env-state{margin-left:auto;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.pn-env-desc{font-size:11px;line-height:1.65;color:var(--dsw-alias-label-secondary)}
.pn-env-path{font-size:10px;color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere}
.pn-env-actions{display:flex;gap:7px;margin-top:2px}
.pn-env-run{display:flex;flex-direction:column;gap:6px;margin-top:2px}
.pn-env-run-head{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.pn-env-error{color:var(--color-red-500,#c43d3d)}
.pn-env-log{max-height:150px;overflow:auto;margin:0;padding:8px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);font-family:var(--ds-font-family-code,ui-monospace,SFMono-Regular,Menlo,monospace);font-size:10px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}
@keyframes pn-pulse{0%,100%{opacity:.45}50%{opacity:1}}
.pn-field{display:flex;flex-direction:column;gap:5px}
.pn-field>label{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:600}
.pn-field>small{font-size:10.5px;color:var(--dsw-alias-label-tertiary);line-height:1.5}
.pn-input{height:32px;padding:0 9px;border-radius:7px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-size:12px;outline:none;width:100%}
.pn-input:focus{border-color:color-mix(in srgb,var(--pn-accent) 55%,var(--dsw-alias-border-l2))}
.pn-input.mono{font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:11px}
.pn-row{display:flex;gap:8px;align-items:center}
.pn-row>*{min-width:0}
.pn-row .pn-grow{flex:1}
.pn-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pn-modal-foot{display:flex;justify-content:flex-end;gap:7px;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l2);position:sticky;bottom:0;background:var(--dsw-alias-bg-layer-1)}
.pn-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:1300;display:flex;align-items:center;gap:8px;max-width:min(560px,calc(100vw - 36px));padding:9px 14px;border-radius:9px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);box-shadow:0 10px 30px #00000033;animation:pn-toast-in .18s ease-out}
.pn-toast-ok{border-color:color-mix(in srgb,var(--color-green-600,#2c8a55) 45%,transparent)}
.pn-toast-error{border-color:color-mix(in srgb,var(--color-red-500,#c43d3d) 50%,transparent)}
@keyframes pn-toast-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
.pn-sidebar-icon{display:inline-flex;align-items:center;justify-content:center}
.pn-compact{min-height:0}
.pn-compact .pn-header{padding:9px 11px;gap:8px}
.pn-compact .pn-logo{width:30px;height:30px;border-radius:9px}
.pn-compact .pn-title{font-size:14px}
.pn-compact .pn-sub{display:none}
.pn-compact .pn-head-actions{gap:4px}
.pn-compact .pn-head-actions .pn-btn{height:28px;padding:0 8px;font-size:11px}
.pn-compact .pn-body{display:block;min-height:0}
.pn-compact .pn-side{height:100%;border-right:0}
.pn-compact .pn-side-top{height:auto!important;max-height:52%;overflow:auto}
.pn-compact .pn-feeds{grid-template-columns:repeat(auto-fill,minmax(116px,1fr));grid-auto-rows:44px}
.pn-compact .pn-feed{padding:5px 7px;gap:6px}
.pn-compact .pn-feed-avatar{width:26px;height:26px;border-radius:7px}
.pn-compact .pn-detail{height:100%}
.pn-compact-list .pn-detail{display:none}
.pn-right-launcher{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pn-right-launcher:hover{background:var(--dsw-alias-bg-secondary);color:var(--dsw-alias-label-primary)}
.pn-right-launcher:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.pn-compact-detail .pn-side{display:none}
.pn-compact .pn-detail-head{padding:10px 12px 0}
.pn-compact .pn-detail-title{font-size:16px;line-height:1.35}
.pn-compact .pn-detail-body{padding:12px 12px 28px}
.pn-compact .pn-md{font-size:13px;line-height:1.75}
.pn-compact .pn-compact-back{display:flex;align-items:center;gap:6px;margin-bottom:7px}
.pn-compact .pn-tabs{gap:0;overflow-x:auto;scrollbar-width:none}
.pn-compact .pn-tab{padding:7px 8px 8px;font-size:11.5px;white-space:nowrap}
@media (max-width:760px){.pn-body{grid-template-columns:minmax(230px,44%) minmax(0,1fr)}.pn-header{padding:10px 12px}.pn-detail-head{padding:12px 14px 0}.pn-detail-body{padding:12px 14px 32px}}
`;
      document.head.appendChild(style);
    }

    const ICONS = {
      mic: [
        'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z',
        'M5 11a7 7 0 0 0 14 0',
        'M12 18v3',
        'M8 21h8',
      ],
      refresh: ['M21 12a9 9 0 1 1-2.64-6.36', 'M21 3v6h-6'],
      settings: [
        'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
        'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.96 4.6 1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9.1a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.9z',
      ],
      plus: ['M12 5v14', 'M5 12h14'],
      search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.35-4.35'],
      play: ['M8 5.5v13l11-6.5z'],
      file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h6'],
      sparkles: ['M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'],
      trash: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13', 'M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3'],
      folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
      external: ['M14 4h6v6', 'M20 4l-9 9', 'M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5'],
      copy: ['M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1'],
      close: ['M18 6L6 18', 'M6 6l12 12'],
      rss: ['M4 11a9 9 0 0 1 9 9', 'M4 4a16 16 0 0 1 16 16', 'M5 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
      check: ['M20 6L9 17l-5-5'],
      alert: ['M12 9v4', 'M12 17h.01', 'M10.3 3.9L2.4 17.5A2 2 0 0 0 4.2 21h15.6a2 2 0 0 0 1.8-3.5L13.7 3.9a2 2 0 0 0-3.4 0z'],
      clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
      arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
      book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
      star: ['M12 3.6l2.62 5.64 6.13.84-4.48 4.25 1.13 6.07L12 17.5l-5.4 2.9 1.13-6.07-4.48-4.25 6.13-.84z'],
      panel: ['M4 4h16v16H4z', 'M15 4v16'],
      tag: ['M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4V4.5A1.5 1.5 0 0 1 4.5 3h7.7a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8z', 'M7.5 7.5h.01'],
      edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z'],
      highlighter: ['M9 11l-4 4v3h3l4-4', 'M12 8l4 4', 'M15 5l4 4', 'M4 22h6', 'M14 3l7 7-3 1-4-4z'],
      close: ['M18 6L6 18', 'M6 6l12 12'],
    };

    function Icon({ name, size = 16, className, style }) {
      const paths = ICONS[name] || ICONS.file;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className,
          style,
          'aria-hidden': 'true',
        },
        paths.map((d, index) => h('path', { key: index, d })),
      );
    }

    function SidebarIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 18;
      return h('span', { className: 'pn-sidebar-icon' }, h(Icon, { name: 'mic', size }));
    }

    function routeUrl(path) {
      const base = new URL(
        typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://dsh.internal/',
      );
      if (!base.pathname.endsWith('/')) {
        base.pathname = base.pathname.replace(/[^/]*$/, '');
      }
      base.search = '';
      base.hash = '';
      return new URL(String(path).replace(/^\/+/, ''), base).toString();
    }

    async function api(method, payload = {}) {
      const response = await fetch(routeUrl(`podcast-notes/api/${method}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`服务返回异常（HTTP ${response.status}）`);
      }
      if (!data || data.ok !== true) {
        const message = data?.error?.message || `请求失败（HTTP ${response.status}）`;
        const error = new Error(message);
        error.code = data?.error?.code || 'error';
        throw error;
      }
      return data.value;
    }

    function fmtDuration(seconds) {
      const value = Number(seconds) || 0;
      if (!value) return '';
      const hours = Math.floor(value / 3600);
      const minutes = Math.round((value % 3600) / 60);
      if (hours) return `${hours} 小时 ${minutes} 分`;
      return `${Math.max(1, minutes)} 分钟`;
    }

    function fmtDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const sameYear = date.getFullYear() === now.getFullYear();
      try {
        return date.toLocaleDateString('zh-CN', {
          year: sameYear ? undefined : 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    }

    function fmtAgo(timestamp) {
      if (!timestamp) return '';
      const diff = Date.now() - timestamp;
      if (diff < 60_000) return '刚刚';
      if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
      if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
      return `${Math.floor(diff / 86_400_000)} 天前`;
    }

    function tail(text, limit) {
      const value = String(text || '');
      return value.length > limit ? `…${value.slice(-limit)}` : value;
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function inlineMarkdown(value) {
      let text = escapeHtml(value);
      text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // == may wrap **bold**, so allow one nested level inside the markers.
      text = text.replace(/==([^=\n]+)==/g, (match, inner) => `<mark class="pn-hl">${inner}</mark>`);
      text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
      text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>');
      return text;
    }

    // Renders Markdown to HTML while recording, for each rendered text node, the
    // offset range it maps back to in the original source. Used to turn a browser
    // selection into a source-range highlight.
    function renderMarkdown(markdown) {
      const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
      let html = '';
      let paragraph = [];
      let listTag = '';
      let inCode = false;
      let code = [];

      const flushParagraph = () => {
        if (!paragraph.length) return;
        html += `<p>${paragraph.map(inlineMarkdown).join(' ')}</p>`;
        paragraph = [];
      };
      const closeList = () => {
        if (!listTag) return;
        html += `</${listTag}>`;
        listTag = '';
      };

      for (const line of lines) {
        if (/^```/.test(line.trim())) {
          if (inCode) {
            html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
            code = [];
            inCode = false;
          } else {
            flushParagraph();
            closeList();
            inCode = true;
          }
          continue;
        }
        if (inCode) {
          code.push(line);
          continue;
        }
        if (!line.trim()) {
          flushParagraph();
          closeList();
          continue;
        }
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
          flushParagraph();
          closeList();
          html += '<hr />';
          continue;
        }
        const heading = /^(#{1,4})\s+(.*)$/.exec(line);
        if (heading) {
          flushParagraph();
          closeList();
          const level = heading[1].length;
          html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
          continue;
        }
        const quote = /^>\s?(.*)$/.exec(line);
        if (quote) {
          flushParagraph();
          closeList();
          html += `<blockquote>${inlineMarkdown(quote[1])}</blockquote>`;
          continue;
        }
        const item = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(line);
        if (item) {
          flushParagraph();
          const wanted = /^\s*\d+\./.test(line) ? 'ol' : 'ul';
          if (listTag !== wanted) {
            closeList();
            listTag = wanted;
            html += `<${listTag}>`;
          }
          html += `<li>${inlineMarkdown(item[1])}</li>`;
          continue;
        }
        if (listTag) closeList();
        paragraph.push(line);
      }
      if (inCode) html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
      flushParagraph();
      closeList();
      return html;
    }

    function openExternalUrl(url) {
      if (!url) return;
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const host = window.location.host;
        try {
          const opened2 = window.open(url, '_blank');
          if (!opened2) {
            window.prompt('浏览器拦截了新窗口，请复制链接打开', url);
          }
        } catch {
          window.prompt('浏览器拦截了新窗口，请复制链接打开', url);
        }
      }
    }

    // Produces a syntax-free copy of the Markdown plus an index map that maps
    // every character of that plain text back to its offset in the original.
    // Markdown syntax characters (markers, link URLs, list bullets) are dropped;
    // the words they decorate are kept.
    function plainTextWithMap(source) {
      const text = String(source || '');
      let plain = '';
      const map = [];
      let i = 0;
      const push = (from, to) => {
        for (let k = from; k < to; k += 1) {
          plain += text[k];
          map.push(k);
        }
      };
      while (i < text.length) {
        const rest = text.slice(i);
        // Fenced code block: keep the code text but drop the fence lines.
        if (/^```/.test(rest)) {
          const end = text.indexOf('```', i + 3);
          const stop = end > i ? end : text.length;
          const body = text.slice(i, stop);
          const newline = body.indexOf('\n');
          if (newline >= 0) push(i + newline + 1, stop);
          i = stop + 3;
          continue;
        }
        // Inline code: keep the code, drop the backticks.
        if (text[i] === '`') {
          const end = text.indexOf('`', i + 1);
          if (end > i) {
            push(i + 1, end);
            i = end + 1;
            continue;
          }
        }
        // Bold marker: drop the ** but keep the text it wraps.
        if (text[i] === '*' && text[i + 1] === '*') {
          const end = text.indexOf('**', i + 2);
          if (end > i) {
            push(i + 2, end);
            i = end + 2;
            continue;
          }
          i += 2;
          continue;
        }
        // Highlight marker: drop the == but keep the text it wraps.
        if (text[i] === '=' && text[i + 1] === '=') {
          const end = text.indexOf('==', i + 2);
          if (end > i) {
            push(i + 2, end);
            i = end + 2;
            continue;
          }
          i += 2;
          continue;
        }
        // Link: keep the label, drop the URL part.
        if (text[i] === '[') {
          const close = text.indexOf(']', i + 1);
          if (close > i && text[close + 1] === '(') {
            const paren = text.indexOf(')', close + 2);
            if (paren > close) {
              push(i + 1, close);
              i = paren + 1;
              continue;
            }
          }
        }
        // Horizontal rule: the renderer turns it into <hr>, so drop the line.
        if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(rest)) {
          const newline = text.indexOf('\n', i);
          i = newline >= 0 ? newline + 1 : text.length;
          continue;
        }
        // Heading marker: drop "### " entirely.
        const heading = /^(\s*)(#{1,6})(\s+)/.exec(rest);
        if (heading) {
          i += heading[1].length + heading[2].length + heading[3].length;
          continue;
        }
        // Blockquote marker: drop "> ".
        const quote = /^(\s*)>(\s?)/.exec(rest);
        if (quote) {
          i += quote[1].length + 1 + quote[2].length;
          continue;
        }
        // List bullet: drop "- " / "1. ".
        const bullet = /^(\s*)(?:[-*+]|\d+\.)(\s+)/.exec(rest);
        if (bullet) {
          i += bullet[1].length + bullet[2].length;
          continue;
        }
        plain += text[i];
        map.push(i);
        i += 1;
      }
      return { plain, map };
    }

    // Finds `needle` inside the rendered text of the Markdown and wraps the
    // matching source range in ==...==. Returns the new source or null.
    //
    // The rendered text is not identical to the source (Markdown markers are
    // stripped, lines are joined), so the needle is located in a syntax-free
    // projection of the source, and the projection carries an index map back
    // into the original bytes. Matching is done on the exact substring so the
    // result stays aligned with what the user actually selected.
    function applyHighlightToSource(source, needle) {
      const text = String(source || '');
      const target = String(needle || '').trim();
      if (!target) return null;
      const { plain, map } = plainTextWithMap(text);
      // Work on a whitespace-free projection so every index lines up with one
      // non-space character of the plain text.
      const flatPlain = plain.replace(/\s+/g, '');
      const flatTarget = target.replace(/\s+/g, '');
      if (!flatTarget) return null;
      const index = flatPlain.indexOf(flatTarget);
      if (index < 0) return null;

      // Walk the projection to find where the flat index lands.
      let flatSeen = 0;
      let plainIndex = -1;
      for (let k = 0; k < plain.length; k += 1) {
        if (/\s/.test(plain[k])) continue;
        if (flatSeen === index) {
          plainIndex = k;
          break;
        }
        flatSeen += 1;
      }
      if (plainIndex < 0) return null;

      // The needle spans this many non-space characters.
      const wanted = flatTarget.length;
      let counted = 0;
      let plainEnd = plainIndex;
      while (plainEnd < plain.length && counted < wanted) {
        if (!/\s/.test(plain[plainEnd])) counted += 1;
        plainEnd += 1;
      }
      if (plainEnd <= plainIndex) return null;

      const sourceStart = map[plainIndex];
      const sourceEnd = map[plainEnd - 1] + 1;
      if (sourceStart === undefined || sourceEnd === undefined) return null;

      // Verify the round trip: the source range must read back as the needle.
      const slice = text.slice(sourceStart, sourceEnd);
      const slicePlain = slice.replace(/\s+/g, '');
      if (slicePlain !== flatTarget) return null;

      const before = text.slice(0, sourceStart);
      const after = text.slice(sourceEnd);
      if (before.endsWith('==') || after.startsWith('==')) return null;
      const selected = text.slice(sourceStart, sourceEnd);
      // If the selection sits inside **bold**, put the highlight markers outside
      // it so both render correctly: **text** -> ==**text**==
      if (before.endsWith('**') && after.startsWith('**')) {
        return `${before.slice(0, -2)}==**${selected}**==${after.slice(2)}`;
      }
      return `${before}==${selected}==${after}`;
    }

    function copyText(text) {
      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise((resolve, reject) => {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand('copy');
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          area.remove();
        }
      });
    }

    function episodeHasTranscript(episode) {
      return Boolean(episode?.transcriptPath);
    }

    function episodeHasNotes(episode) {
      return Boolean(episode?.notesPath);
    }

    function FeedPill({ feed, active, onSelect, onContextMenu }) {
      return h(
        'button',
        {
          type: 'button',
          className: `pn-feed${active ? ' pn-feed-on' : ''}`,
          onClick: onSelect,
          onContextMenu,
          title: `${feed.title}${feed.category ? ` · ${feed.category}` : ''}`,
        },
        h(
          'div',
          { className: 'pn-feed-avatar' },
          h('span', null, String(feed.title || '?').slice(0, 1)),
          feed.image
            ? h('img', {
                src: feed.image,
                alt: '',
                loading: 'lazy',
                referrerPolicy: 'no-referrer',
                onError: (event) => {
                  event.currentTarget.style.display = 'none';
                },
              })
            : null,
        ),
        h(
          'div',
          { className: 'pn-feed-copy' },
          h('div', { className: 'pn-feed-name' }, feed.title || '未命名播客'),
          h(
            'div',
            { className: 'pn-feed-meta' },
            `${feed.stats?.episodeCount || 0} 集${feed.stats?.transcriptCount ? ` · ${feed.stats.transcriptCount} 稿` : ''}`,
          ),
        ),
        feed.stats?.unreadCount
          ? h(
              'span',
              { className: 'pn-new-dot', title: `${feed.stats.unreadCount} 集未读` },
              feed.stats.unreadCount > 99 ? '99+' : String(feed.stats.unreadCount),
            )
          : null,
      );
    }

    function EpisodeRow({ episode, active, onSelect, onContextMenu }) {
      const unread = !episode.viewedAt;
      return h(
        'button',
        {
          type: 'button',
          className: `pn-ep${active ? ' pn-ep-on' : ''}${unread ? ' pn-ep-unread' : ''}${episode.starred ? ' pn-ep-starred' : ''}`,
          onClick: onSelect,
          onContextMenu,
          title: episode.starred ? '已标星' : undefined,
        },
        unread ? h('span', { className: 'pn-unread-dot', 'aria-label': '未读' }) : null,
        episode.starred ? h('span', { className: 'pn-star-badge', 'aria-label': '已标星' }, h(Icon, { name: 'star', size: 13 })) : null,
        h('div', { className: 'pn-ep-title' }, episode.title || '未命名单集'),
        h(
          'div',
          { className: 'pn-ep-meta' },
          episode.pubDate ? h('span', null, fmtDate(episode.pubDate)) : null,
          episode.duration ? h('span', null, fmtDuration(episode.duration)) : null,
          episode.episodeNumber ? h('span', null, `第 ${episode.episodeNumber} 期`) : null,
        ),
        episodeHasTranscript(episode) || episodeHasNotes(episode)
          ? h(
              'div',
              { className: 'pn-ep-badges' },
              episodeHasTranscript(episode) ? h('span', { className: 'pn-badge pn-badge-doc' }, h(Icon, { name: 'file', size: 9 }), '逐字稿') : null,
              episodeHasNotes(episode) ? h('span', { className: 'pn-badge pn-badge-note' }, h(Icon, { name: 'book', size: 9 }), '笔记') : null,
            )
          : null,
      );
    }

    function Empty({ icon, title, text, children }) {
      return h(
        'div',
        { className: 'pn-empty' },
        h(Icon, { name: icon, size: 26 }),
        h('b', null, title),
        text ? h('div', null, text) : null,
        children,
      );
    }

    function JobCard({ job, onCancel }) {
      if (!job) return null;
      const label = job.type === 'transcript' ? '正在转写逐字稿' : '正在生成专家访谈笔记';
      const elapsed = Math.max(0, Math.floor((Date.now() - job.startedAt) / 1000));
      return h(
        'div',
        { className: 'pn-job' },
        h(
          'div',
          { className: 'pn-job-head' },
          h('span', { className: 'pn-spinner' }),
          h('span', { className: 'pn-grow' }, label),
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontWeight: 400 } }, `${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒`),
          h('button', { type: 'button', className: 'pn-btn pn-btn-sm pn-btn-ghost', onClick: onCancel }, '取消'),
        ),
        job.log ? h('pre', null, tail(job.log, 1500)) : null,
      );
    }

    function NotesEditor({ initialText, onCancel, onSave, saving }) {
      const [text, setText] = useState(initialText);
      const ref = useRef(null);
      useEffect(() => {
        setText(initialText);
      }, [initialText]);
      useEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.focus();
        const length = node.value.length;
        try {
          node.setSelectionRange(length, length);
        } catch {
          // ignore
        }
      }, []);
      const insert = (snippet) => {
        const node = ref.current;
        if (!node) return;
        const start = node.selectionStart ?? node.value.length;
        const end = node.selectionEnd ?? start;
        const next = `${node.value.slice(0, start)}${snippet}${node.value.slice(end)}`;
        setText(next);
        requestAnimationFrame(() => {
          node.focus();
          const caret = start + snippet.length;
          node.setSelectionRange(caret, caret);
        });
      };
      const wrapSelection = () => {
        const node = ref.current;
        if (!node) return;
        const start = node.selectionStart ?? 0;
        const end = node.selectionEnd ?? 0;
        if (start === end) {
          insert('==');
          return;
        }
        const selected = node.value.slice(start, end);
        const next = `${node.value.slice(0, start)}==${selected}==${node.value.slice(end)}`;
        setText(next);
        requestAnimationFrame(() => {
          node.focus();
          node.setSelectionRange(start + 2, end + 2);
        });
      };
      return h(
        'div',
        { className: 'pn-editor' },
        h(
          'div',
          { className: 'pn-toolbar' },
          h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11 } }, '编辑 Markdown 原文'),
          h('span', { className: 'pn-spacer' }),
          h(
            'button',
            { type: 'button', className: 'pn-btn pn-btn-sm', onClick: wrapSelection },
            h(Icon, { name: 'highlighter', size: 12 }),
            '高亮选中',
          ),
          h(
            'button',
            { type: 'button', className: 'pn-btn pn-btn-sm', onClick: () => insert('\n## 小节标题\n\n') },
            '插入小节',
          ),
        ),
        h('textarea', {
          ref,
          value: text,
          spellCheck: false,
          onChange: (event) => setText(event.target.value),
        }),
        h(
          'div',
          { className: 'pn-editor-hint' },
          '高亮用 ==文字== 标记，保存后会写回同一个 .md 文件，任何 Markdown 软件都能识别。',
        ),
        h(
          'div',
          { className: 'pn-toolbar', style: { marginTop: 4 } },
          h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11 } }, `${text.length} 字`),
          h('span', { className: 'pn-spacer' }),
          h('button', { type: 'button', className: 'pn-btn pn-btn-sm pn-btn-ghost', onClick: onCancel, disabled: saving }, '取消'),
          h(
            'button',
            { type: 'button', className: 'pn-btn pn-btn-sm', onClick: () => onSave(text), disabled: saving || !text.trim() },
            saving ? '保存中…' : '保存',
          ),
        ),
      );
    }

    function SettingsDialog({ settings, onClose, onSaved, showToast }) {
      const [form, setForm] = useState(() => ({ ...settings }));
      const [models, setModels] = useState(null);
      const [saving, setSaving] = useState(false);
      const [warnings, setWarnings] = useState([]);
      const [env, setEnv] = useState(null);
      const wasInstalling = useRef(false);

      useEffect(() => {
        let alive = true;
        let timer;
        const load = async () => {
          try {
            const value = await api('envStatus');
            if (!alive) return;
            setEnv(value);
            const installing = Boolean(value.installing);
            if (wasInstalling.current && !installing) {
              if (value.ready) {
                showToast('转写环境已就绪，可以开始转写了', 'ok');
                try {
                  const latest = await api('settingsGet');
                  if (alive) setForm(latest.settings);
                } catch {
                  // settings refresh is best effort
                }
              } else if (value.lastJob?.status === 'error') {
                showToast(`环境安装失败：${value.lastJob.error || '未知错误'}`, 'error');
              }
            }
            wasInstalling.current = installing;
          } catch (error) {
            if (alive) setEnv({ error: error.message });
          } finally {
            if (alive) timer = setTimeout(load, 2500);
          }
        };
        load();
        return () => {
          alive = false;
          clearTimeout(timer);
        };
      }, []);

      const startEnv = async () => {
        try {
          const job = await api('setupEnv');
          setEnv((previous) => ({ ...(previous || {}), installing: job, lastJob: job }));
          wasInstalling.current = true;
          showToast('开始准备转写环境，首次约 2GB，请保持网络', 'info');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const cancelEnv = async () => {
        if (!env?.installing) return;
        try {
          await api('cancel', { jobId: env.installing.id });
          showToast('已取消安装', 'info');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const envLog = (job) =>
        String(job?.log || '')
          .trim()
          .split('\n')
          .slice(-14)
          .join('\n');

      useEffect(() => {
        let alive = true;
        api('models')
          .then((value) => {
            if (alive) setModels(value);
          })
          .catch(() => {
            if (alive) setModels({ providers: [] });
          });
        return () => {
          alive = false;
        };
      }, []);

      const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
      const providers = models?.providers || [];
      const selectedProvider = providers.find((provider) => provider.id === form.provider);
      const providerModels = selectedProvider?.models || [];

      const save = async () => {
        if (form.provider && !form.model) {
          showToast('请选择一个模型，或把模型服务设为「跟随 DSH 默认」', 'error');
          return;
        }
        setSaving(true);
        setWarnings([]);
        try {
          const value = await api('settingsSave', {
            ...form,
            refreshMinutes: Number(form.refreshMinutes) || 30,
            notesMaxTokens: Number(form.notesMaxTokens) || 8192,
          });
          onSaved(value);
          if (value.warnings?.length) {
            setWarnings(value.warnings);
            showToast('已保存，但有些路径不存在', 'error');
          } else {
            showToast('设置已保存', 'ok');
            onClose();
          }
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          setSaving(false);
        }
      };

      const reveal = async (kind) => {
        try {
          await api('reveal', { kind });
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      return h(
        'div',
        {
          className: 'pn-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'pn-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '播客笔记设置' },
          h(
            'div',
            { className: 'pn-modal-head' },
            h(Icon, { name: 'settings', size: 16 }),
            h('b', null, '播客笔记设置'),
            h('button', { type: 'button', className: 'pn-btn pn-btn-ghost pn-btn-icon', onClick: onClose, title: '关闭' }, h(Icon, { name: 'close', size: 16 })),
          ),
          h(
            'div',
            { className: 'pn-modal-body' },
            h(
              'div',
              { className: 'pn-env' },
              h(
                'div',
                { className: 'pn-env-head' },
                h('span', {
                  className: `pn-env-dot ${env?.ready ? 'pn-env-ok' : env?.installing ? 'pn-env-busy' : 'pn-env-warn'}`,
                }),
                h('b', null, '转写环境'),
                h(
                  'span',
                  { className: 'pn-env-state' },
                  !env ? '检查中…' : env.ready ? '已就绪' : env.installing ? '正在安装…' : '未安装',
                ),
              ),
              h(
                'div',
                { className: 'pn-env-desc' },
                env?.ready
                  ? `${env.source === 'configured' ? '使用已有的 Python 环境' : '使用插件准备的 Python 环境'}，可以直接获取逐字稿。`
                  : '获取逐字稿需要在本机装一次语音识别环境（FunASR，本地离线，不消耗模型额度）。首次约 2GB、10–20 分钟；点下面的按钮，插件会自动下载并配置，不需要打开终端。',
              ),
              env?.ready && env.pythonPath
                ? h('div', { className: 'pn-env-path mono', title: env.pythonPath }, env.pythonPath)
                : null,
              !env?.ready && !env?.installing && env?.canAutoInstall
                ? h(
                    'div',
                    { className: 'pn-env-actions' },
                    h(
                      'button',
                      { type: 'button', className: 'pn-btn pn-btn-primary', onClick: startEnv },
                      '一键准备转写环境',
                    ),
                  )
                : null,
              !env?.ready && !env?.installing && env?.canAutoInstall === false
                ? h('div', { className: 'pn-err' }, '当前系统暂不支持自动安装，请手动准备 Python 3.9+ 环境。')
                : null,
              env?.installing
                ? h(
                    'div',
                    { className: 'pn-env-run' },
                    h('div', { className: 'pn-env-run-head' }, '正在安装，请保持网络连接，别关掉这个面板'),
                    h('pre', { className: 'pn-env-log' }, envLog(env.installing) || '准备中…'),
                    h(
                      'button',
                      { type: 'button', className: 'pn-btn pn-btn-ghost', onClick: cancelEnv },
                      '取消安装',
                    ),
                  )
                : null,
              !env?.ready && !env?.installing && env?.lastJob?.status === 'error'
                ? h(
                    'div',
                    { className: 'pn-env-run' },
                    h('div', { className: 'pn-env-run-head pn-env-error' }, `上次安装失败：${env.lastJob.error || '未知错误'}`),
                    h('pre', { className: 'pn-env-log' }, envLog(env.lastJob) || '没有日志'),
                  )
                : null,
              env?.error ? h('div', { className: 'pn-err' }, env.error) : null,
            ),
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, '数据目录'),
              h(
                'div',
                { className: 'pn-row' },
                h('input', {
                  className: 'pn-input mono pn-grow',
                  value: form.dataDir || '',
                  onChange: (event) => update('dataDir', event.target.value),
                  spellCheck: false,
                }),
                h('button', { type: 'button', className: 'pn-btn pn-btn-icon', onClick: () => reveal('data'), title: '在 Finder 中打开' }, h(Icon, { name: 'folder', size: 15 })),
              ),
              h('small', null, '订阅、节目、逐字稿和笔记都存在这里。默认在工作区的 podcast-data。'),
            ),
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, 'Python 解释器'),
              h('input', {
                className: 'pn-input mono',
                value: form.pythonPath || '',
                onChange: (event) => update('pythonPath', event.target.value),
                spellCheck: false,
              }),
              h('small', null, '需要装好 funasr、modelscope、torch 的虚拟环境。默认用播客转写 skill 自带的 .venv。'),
            ),
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, '转写脚本'),
              h('input', {
                className: 'pn-input mono',
                value: form.scriptPath || '',
                onChange: (event) => update('scriptPath', event.target.value),
                spellCheck: false,
              }),
            ),
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, '专家访谈笔记 skill'),
              h('input', {
                className: 'pn-input mono',
                value: form.notesSkillPath || '',
                onChange: (event) => update('notesSkillPath', event.target.value),
                spellCheck: false,
              }),
              h('small', null, '生成笔记时会把这份 SKILL.md 的方法论作为系统提示词。'),
            ),
            h(
              'div',
              { className: 'pn-grid2' },
              h(
                'div',
                { className: 'pn-field' },
                h('label', null, '模型服务'),
                h(
                  'select',
                  {
                    className: 'pn-input',
                    value: form.provider || '',
                    onChange: (event) => {
                      const provider = event.target.value;
                      setForm((previous) => ({ ...previous, provider, model: '' }));
                    },
                  },
                  h('option', { value: '' }, '跟随 DSH 默认'),
                  providers.map((provider) => h('option', { key: provider.id, value: provider.id }, provider.name || provider.id)),
                ),
              ),
              h(
                'div',
                { className: 'pn-field' },
                h('label', null, '模型'),
                form.provider
                  ? h(
                      'select',
                      {
                        className: 'pn-input',
                        value: form.model || '',
                        onChange: (event) => update('model', event.target.value),
                      },
                      h('option', { value: '' }, '选择模型'),
                      providerModels.map((model) => h('option', { key: model.id, value: model.id }, model.name || model.id)),
                    )
                  : h('input', { className: 'pn-input', value: '使用当前默认模型', disabled: true }),
              ),
            ),
            h('small', { style: { marginTop: '-6px', color: 'var(--dsw-alias-label-tertiary)', fontSize: '10.5px' } }, 'AI 笔记和模型路由都跟随这里；留空则用 DSH 当前选中的模型。'),
            h(
              'div',
              { className: 'pn-grid2' },
              h(
                'div',
                { className: 'pn-field' },
                h('label', null, '自动刷新间隔（分钟）'),
                h('input', {
                  className: 'pn-input',
                  type: 'number',
                  min: 5,
                  max: 1440,
                  value: form.refreshMinutes ?? 30,
                  onChange: (event) => update('refreshMinutes', event.target.value),
                }),
              ),
              h(
                'div',
                { className: 'pn-field' },
                h('label', null, '笔记最大 token'),
                h('input', {
                  className: 'pn-input',
                  type: 'number',
                  min: 1024,
                  max: 16384,
                  step: 512,
                  value: form.notesMaxTokens ?? 8192,
                  onChange: (event) => update('notesMaxTokens', event.target.value),
                }),
              ),
            ),
            warnings.length
              ? h('div', { className: 'pn-err' }, warnings.map((warning) => h('div', { key: warning }, warning)))
              : null,
          ),
          h(
            'div',
            { className: 'pn-modal-foot' },
            h('button', { type: 'button', className: 'pn-btn', onClick: onClose }, '取消'),
            h('button', { type: 'button', className: 'pn-btn pn-btn-primary', disabled: saving, onClick: save }, saving ? '保存中…' : '保存设置'),
          ),
        ),
      );
    }

    function ContextMenu({ menu, onClose }) {
      useEffect(() => {
        if (!menu) return undefined;
        const close = () => onClose();
        const onKey = (event) => {
          if (event.key === 'Escape') onClose();
        };
        window.addEventListener('mousedown', close);
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', close);
        return () => {
          window.removeEventListener('mousedown', close);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('resize', close);
        };
      }, [menu]);
      if (!menu) return null;
      return h(
        'div',
        {
          className: 'pn-menu',
          style: { left: menu.x, top: menu.y },
          onMouseDown: (event) => event.stopPropagation(),
          onContextMenu: (event) => event.preventDefault(),
        },
        (menu.items || []).map((item, index) =>
          h(
            'button',
            {
              type: 'button',
              key: `${item.label}-${index}`,
              className: item.danger ? 'pn-menu-danger' : '',
              onClick: () => {
                onClose();
                item.onClick();
              },
            },
            item.icon ? h(Icon, { name: item.icon, size: 13 }) : null,
            item.label,
          ),
        ),
      );
    }

    function CategoryDialog({ feed, categories, onClose, onSaved, showToast }) {
      const names = [...new Set((categories || []).map((item) => String(item?.name || '').trim()).filter(Boolean))];
      const initial = feed?.category || names[0] || '未分类';
      const [value, setValue] = useState(names.includes(initial) ? initial : '__custom__');
      const [custom, setCustom] = useState(names.includes(initial) ? '' : initial);
      const [saving, setSaving] = useState(false);
      const isCustom = value === '__custom__';
      const save = async () => {
        const category = (isCustom ? custom : value).trim();
        if (!category) {
          showToast('分类名称不能为空', 'error');
          return;
        }
        setSaving(true);
        try {
          await api('updateFeedCategory', { feedId: feed.id, category });
          onSaved(category);
          showToast('分类已更新', 'ok');
          onClose();
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          setSaving(false);
        }
      };
      return h(
        'div',
        {
          className: 'pn-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'pn-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '修改播客分类' },
          h(
            'div',
            { className: 'pn-modal-head' },
            h(Icon, { name: 'tag', size: 16 }),
            h('b', null, '修改播客分类'),
            h('button', { type: 'button', className: 'pn-btn pn-btn-ghost pn-btn-icon', onClick: onClose, title: '关闭' }, h(Icon, { name: 'close', size: 16 })),
          ),
          h(
            'div',
            { className: 'pn-modal-body' },
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, `${feed?.title || '这个播客'} 的分类`),
              h(
                'select',
                {
                  className: 'pn-input',
                  autoFocus: true,
                  value,
                  onChange: (event) => setValue(event.target.value),
                },
                names.map((name) => h('option', { key: name, value: name }, name)),
                h('option', { value: '__custom__' }, '＋ 新建分类…'),
              ),
              isCustom
                ? h('input', {
                    className: 'pn-input',
                    style: { marginTop: 7 },
                    value: custom,
                    placeholder: '输入新分类名称',
                    onChange: (event) => setCustom(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') save();
                    },
                    spellCheck: false,
                  })
                : null,
              h('small', null, '从已有分类里选择，或新建一个；一个播客只会出现在一个分类里。'),
            ),
          ),
          h(
            'div',
            { className: 'pn-modal-foot' },
            h('button', { type: 'button', className: 'pn-btn', onClick: onClose }, '取消'),
            h('button', { type: 'button', className: 'pn-btn pn-btn-primary', disabled: saving, onClick: save }, saving ? '保存中…' : '保存分类'),
          ),
        ),
      );
    }

    function AddFeedDialog({ onClose, onAdded, showToast, categories }) {
      const [url, setUrl] = useState('');
      const [probe, setProbe] = useState(null);
      const [category, setCategory] = useState('');
      const [custom, setCustom] = useState('');
      const [inspecting, setInspecting] = useState(false);
      const [adding, setAdding] = useState(false);
      const existing = useMemo(
        () =>
          [...new Set((categories || []).map((item) => String(item?.name || '').trim()).filter(Boolean))],
        [categories],
      );
      const detected = probe?.categories || [];
      const options = useMemo(
        () => [...new Set([...detected, ...existing, '未分类'].filter(Boolean))],
        [detected.join('|'), existing.join('|')],
      );
      const inspect = async () => {
        const value = url.trim();
        if (!value) return;
        setInspecting(true);
        try {
          const result = await api('previewFeed', { url: value });
          setProbe(result);
          setCategory(result.categories?.[0] || '未分类');
          setCustom('');
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          setInspecting(false);
        }
      };
      const submit = async () => {
        if (!probe) {
          await inspect();
          return;
        }
        setAdding(true);
        try {
          const chosen = custom.trim() || category.trim() || detected[0] || '未分类';
          const value = await api('addFeed', { url: probe.url || url.trim(), category: chosen });
          onAdded(value.feed);
          showToast('已添加播客', 'ok');
          onClose();
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          setAdding(false);
        }
      };
      return h(
        'div',
        {
          className: 'pn-overlay',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
        },
        h(
          'div',
          { className: 'pn-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': '添加播客' },
          h(
            'div',
            { className: 'pn-modal-head' },
            h(Icon, { name: 'rss', size: 16 }),
            h('b', null, '添加播客 RSS'),
            h('button', { type: 'button', className: 'pn-btn pn-btn-ghost pn-btn-icon', onClick: onClose, title: '关闭' }, h(Icon, { name: 'close', size: 16 })),
          ),
          h(
            'div',
            { className: 'pn-modal-body' },
            h(
              'div',
              { className: 'pn-field' },
              h('label', null, 'RSS 地址'),
              h('input', {
                className: 'pn-input mono',
                autoFocus: true,
                placeholder: 'https://feed.xyzfm.space/…',
                value: url,
                onChange: (event) => {
                  setUrl(event.target.value);
                  setProbe(null);
                  setCategory('');
                  setCustom('');
                },
                onKeyDown: (event) => {
                  if (event.key === 'Enter') {
                    if (probe) submit();
                    else inspect();
                  }
                },
                spellCheck: false,
              }),
              h('small', null, '先读取 RSS，确认节目和分类后再添加。支持小宇宙、XYZ 等标准 RSS 2.0。'),
            ),
            probe
              ? h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'pn-probe' },
                    h('b', null, probe.title || '未命名播客'),
                    probe.author ? `作者：${probe.author}` : null,
                    probe.author ? h('br') : null,
                    `共 ${probe.episodeCount || 0} 集`,
                  ),
                  h(
                    'div',
                    { className: 'pn-field' },
                    h('label', null, '这个播客的分类'),
                    h(
                      'div',
                      { className: 'pn-cat-options' },
                      options.map((name) =>
                        h(
                          'button',
                          {
                            type: 'button',
                            key: name,
                            className: `pn-cat-option${!custom.trim() && category === name ? ' pn-cat-option-on' : ''}`,
                            onClick: () => {
                              setCategory(name);
                              setCustom('');
                            },
                          },
                          name,
                        ),
                      ),
                    ),
                    h('input', {
                      className: 'pn-input',
                      value: custom,
                      list: 'pn-category-names',
                      placeholder: '或者输入自定义分类',
                      onChange: (event) => setCustom(event.target.value),
                    }),
                    h(
                      'datalist',
                      { id: 'pn-category-names' },
                      options.map((name) => h('option', { key: name, value: name })),
                    ),
                    h('small', null, '一个播客只归入一个分类，之后也能改。'),
                  ),
                )
              : null,
          ),
          h(
            'div',
            { className: 'pn-modal-foot' },
            h('button', { type: 'button', className: 'pn-btn', onClick: onClose }, '取消'),
            probe
              ? h(
                  'button',
                  { type: 'button', className: 'pn-btn', disabled: inspecting, onClick: inspect },
                  inspecting ? '读取中…' : '重新读取',
                )
              : null,
            h(
              'button',
              {
                type: 'button',
                className: 'pn-btn pn-btn-primary',
                disabled: adding || inspecting || !url.trim(),
                onClick: submit,
              },
              probe ? (adding ? '添加中…' : '添加播客') : inspecting ? '读取中…' : '读取分类',
            ),
          ),
        ),
      );
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }

      static getDerivedStateFromError(error) {
        return { error };
      }

      render() {
        if (this.state.error) {
          return h(
            'div',
            { className: 'pn-root' },
            h(
              'div',
              { style: { padding: 28 } },
              h(Empty, {
                icon: 'alert',
                title: '播客笔记遇到了一个问题',
                text: this.state.error.message || String(this.state.error),
              }),
              h(
                'button',
                { type: 'button', className: 'pn-btn', onClick: () => this.setState({ error: null }) },
                '重试',
              ),
            ),
          );
        }
        return this.props.children;
      }
    }

    function RightSidebarLauncher({ onOpen }) {
      if (!onOpen) return null;
      return h(
        'button',
        {
          type: 'button',
          className: 'pn-right-launcher',
          title: '在右侧栏打开播客笔记',
          'aria-label': '在右侧栏打开播客笔记',
          onClick: onOpen,
        },
        h(Icon, { name: 'panel', size: 17 }),
      );
    }

    function Panel({ compact = false } = {}) {
      const [state, setState] = useState(null);
      const [bootError, setBootError] = useState('');
      const [category, setCategory] = useState('全部');
      const [feedId, setFeedId] = useState('');
      const [feed, setFeed] = useState(null);
      const [episodes, setEpisodes] = useState([]);
      const [episodesFeedId, setEpisodesFeedId] = useState('');
      const [episodesLoading, setEpisodesLoading] = useState(false);
      const [episodesError, setEpisodesError] = useState('');
      const [selectedGuid, setSelectedGuid] = useState('');
      const [compactDetail, setCompactDetail] = useState(false);
      const [detail, setDetail] = useState(null);
      const [detailLoading, setDetailLoading] = useState(false);
      const [tab, setTab] = useState('intro');
      const [query, setQuery] = useState('');
      const [filter, setFilter] = useState('all');
      const [jobs, setJobs] = useState([]);
      const [busy, setBusy] = useState('');
      const [refreshing, setRefreshing] = useState(false);
      const [toast, setToast] = useState(null);
      const [settingsOpen, setSettingsOpen] = useState(false);
      const [addOpen, setAddOpen] = useState(false);
      const [detailVersion, setDetailVersion] = useState(0);
      const [episodeVersion, setEpisodeVersion] = useState(0);
      const [menu, setMenu] = useState(null);
      const [categoryEdit, setCategoryEdit] = useState(null);
      const [editingNotes, setEditingNotes] = useState(false);
      const [savingNotes, setSavingNotes] = useState(false);
      const [notesDraft, setNotesDraft] = useState('');
      const [hlSelection, setHlSelection] = useState(null);
      const [onlyHighlights, setOnlyHighlights] = useState(false);
      const [feedPaneHeight, setFeedPaneHeight] = useState(() => {
        try {
          const saved = Number(localStorage.getItem('podcast-notes.feedPaneHeight'));
          return Number.isFinite(saved) && saved >= 132 ? Math.min(saved, 640) : 196;
        } catch {
          return 196;
        }
      });
      const detailRef = useRef(null);
      const jobsRef = useRef([]);
      const highlightCount = useMemo(() => {
        const text = detail?.notes || '';
        if (!text) return 0;
        return (text.match(/==[^=\n]+==/g) || []).length;
      }, [detail?.notes]);

      const showToast = (text, kind = 'info') => {
        setToast({ text, kind, id: Date.now() });
      };

      const openMenu = (event, items) => {
        event.preventDefault();
        event.stopPropagation();
        const width = 168;
        const height = Math.max(36, (items?.length || 1) * 30 + 10);
        setMenu({
          x: Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8)),
          y: Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8)),
          items,
        });
      };

      useEffect(() => {
        jobsRef.current = jobs;
      }, [jobs]);

      const startFeedResize = (event) => {
        if (event.button !== undefined && event.button !== 0) return;
        event.preventDefault();
        const startY = event.clientY;
        const startHeight = feedPaneHeight;
        const side = event.currentTarget.parentElement;
        const maxHeight = Math.max(190, (side?.clientHeight || 720) - 180);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
        const move = (moveEvent) => {
          setFeedPaneHeight(Math.max(132, Math.min(maxHeight, startHeight + moveEvent.clientY - startY)));
        };
        const done = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', done);
          window.removeEventListener('pointercancel', done);
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', done);
        window.addEventListener('pointercancel', done);
      };

      useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timer);
      }, [toast]);

      useEffect(() => {
        try {
          localStorage.setItem('podcast-notes.feedPaneHeight', String(Math.round(feedPaneHeight)));
        } catch {
          // ignore storage failures
        }
      }, [feedPaneHeight]);

      useEffect(() => {
        let alive = true;
        (async () => {
          try {
            const value = await api('state');
            if (!alive) return;
            setState(value);
            const first = value.feeds?.[0]?.id || '';
            setFeedId(first);
            try {
              const currentJobs = await api('jobs');
              if (alive) setJobs(Array.isArray(currentJobs) ? currentJobs : []);
            } catch {
              // job history is optional
            }
            const stale = (value.feeds || []).some((item) => {
              if (!item.lastFetchedAt) return true;
              const minutes = Number(value.settings?.refreshMinutes) || 30;
              return Date.now() - item.lastFetchedAt > minutes * 60_000;
            });
            if (stale && value.feeds?.length) {
              setRefreshing(true);
              try {
                await api('refresh', {});
                const fresh = await api('state');
                if (alive) {
                  setState(fresh);
                  setEpisodeVersion((value) => value + 1);
                  setDetailVersion((value) => value + 1);
                }
              } catch (error) {
                if (alive) showToast(`自动刷新失败：${error.message}`, 'error');
              } finally {
                if (alive) setRefreshing(false);
              }
            }
          } catch (error) {
            if (alive) setBootError(error.message);
          }
        })();
        return () => {
          alive = false;
        };
      }, []);

      useEffect(() => {
        if (!feedId) {
          setFeed(null);
          setEpisodes([]);
          setEpisodesFeedId('');
          setSelectedGuid('');
          return;
        }
        let alive = true;
        setEpisodesLoading(true);
        setEpisodesError('');
        api('episodes', { feedId })
          .then((value) => {
            if (!alive) return;
            setFeed(value.feed);
            setEpisodes(value.episodes || []);
            setEpisodesFeedId(feedId);
            setSelectedGuid((previous) => {
              if ((value.episodes || []).some((episode) => episode.guid === previous)) return previous;
              return value.episodes?.[0]?.guid || '';
            });
          })
          .catch((error) => {
            if (!alive) return;
            setEpisodesError(error.message);
            setEpisodes([]);
            setEpisodesFeedId(feedId);
          })
          .finally(() => {
            if (alive) setEpisodesLoading(false);
          });
        return () => {
          alive = false;
        };
      }, [feedId, episodeVersion]);

      useEffect(() => {
        if (!feedId || !selectedGuid || episodesFeedId !== feedId) {
          setDetail(null);
          return;
        }
        let alive = true;
        if (detailRef.current?.episode?.guid !== selectedGuid) setDetail(null);
        setDetailLoading(true);
        api('episode', { feedId, guid: selectedGuid })
          .then((value) => {
            if (!alive) return;
            setDetail(value);
            detailRef.current = value;
            setTab(value.notes ? 'notes' : value.transcript ? 'transcript' : 'intro');
          })
          .catch((error) => {
            if (!alive) return;
            setDetail(null);
            showToast(`加载这一集失败：${error.message}`, 'error');
          })
          .finally(() => {
            if (alive) setDetailLoading(false);
          });
        return () => {
          alive = false;
        };
      }, [feedId, selectedGuid, detailVersion, episodesFeedId]);

      useEffect(() => {
        if (!feedId || !selectedGuid) return;
        if (compact && !compactDetail) return;
        const timer = setTimeout(() => {
          api('markViewed', { feedId, guid: selectedGuid })
            .then((result) => {
              if (!result?.changed) return;
              const stamp = Date.now();
              setEpisodes((list) => list.map((item) => (item.guid === selectedGuid ? { ...item, viewedAt: stamp } : item)));
              setDetail((previous) =>
                previous?.episode?.guid === selectedGuid
                  ? { ...previous, episode: { ...previous.episode, viewedAt: stamp } }
                  : previous,
              );
              setState((previous) => {
                if (!previous) return previous;
                return {
                  ...previous,
                  feeds: previous.feeds.map((item) =>
                    item.id === feedId
                      ? { ...item, stats: { ...item.stats, unreadCount: Math.max(0, Number(item.stats?.unreadCount || 0) - 1) } }
                      : item,
                  ),
                  stats: {
                    ...previous.stats,
                    unreadCount: Math.max(0, Number(previous.stats?.unreadCount || 0) - 1),
                  },
                };
              });
            })
            .catch(() => {});
        }, 1500);
        return () => clearTimeout(timer);
      }, [feedId, selectedGuid, compact, compactDetail]);

      const running = jobs.some((job) => job.status === 'running');
      useEffect(() => {
        if (!running) return;
        const timer = setInterval(async () => {
          try {
            const list = await api('jobs');
            const before = jobsRef.current;
            const finished = list.filter((job) => {
              if (job.type === 'setup') return false;
              const old = before.find((item) => item.id === job.id);
              return old && old.status === 'running' && job.status !== 'running';
            });
            setJobs(list);
            if (finished.length) {
              for (const job of finished) {
                if (job.status === 'done') {
                  showToast(job.type === 'transcript' ? '逐字稿已生成' : '专家访谈笔记已生成', 'ok');
                } else if (job.status === 'error') {
                  showToast(job.error || '任务失败', 'error');
                }
              }
              setDetailVersion((value) => value + 1);
              setEpisodeVersion((value) => value + 1);
            }
          } catch {
            // keep the previous snapshot; the next tick retries
          }
        }, 1500);
        return () => clearInterval(timer);
      }, [running]);

      const feeds = state?.feeds || [];
      const categories = state?.categories || [];
      const visibleFeeds = category === '全部' ? feeds : feeds.filter((item) => item.category === category);

      useEffect(() => {
        if (!visibleFeeds.length) return;
        if (!visibleFeeds.some((item) => item.id === feedId)) {
          setFeedId(visibleFeeds[0].id);
        }
      }, [category, feeds.length, feedId]);

      const filteredEpisodes = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return episodes.filter((episode) => {
          if (filter === 'unread' && episode.viewedAt) return false;
          if (filter === 'starred' && !episode.starred) return false;
          if (filter === 'transcript' && !episodeHasTranscript(episode)) return false;
          if (filter === 'notes' && !episodeHasNotes(episode)) return false;
          if (filter === 'none' && (episodeHasTranscript(episode) || episodeHasNotes(episode))) return false;
          if (needle) {
            const haystack = `${episode.title || ''} ${episode.description || ''}`.toLowerCase();
            if (!haystack.includes(needle)) return false;
          }
          return true;
        });
      }, [episodes, query, filter]);

      const selectedEpisode = episodes.find((episode) => episode.guid === selectedGuid) || detail?.episode || null;
      const episodeJobs = jobs.filter((job) => job.feedId === feedId && job.guid === selectedGuid);
      const activeJob = episodeJobs.find((job) => job.status === 'running');
      const lastErrorJob = !activeJob ? episodeJobs.find((job) => job.status === 'error') : null;
      const hasTranscript = Boolean(detail?.transcript);
      const hasNotes = Boolean(detail?.notes);

      const reload = async () => {
        try {
          const value = await api('state');
          setState(value);
          if (!value.feeds?.some((item) => item.id === feedId)) {
            setFeedId(value.feeds?.[0]?.id || '');
          }
          setEpisodeVersion((current) => current + 1);
          setDetailVersion((current) => current + 1);
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const refreshAll = async (one) => {
        if (refreshing) return;
        setRefreshing(true);
        try {
          const result = await api('refresh', one ? { feedId: one } : {});
          const value = await api('state');
          setState(value);
          setEpisodeVersion((current) => current + 1);
          const errors = (result.results || []).filter((item) => item.error);
          if (errors.length) showToast(`${errors.length} 个播客更新失败：${errors[0].error}`, 'error');
          else showToast(one ? '这个播客已更新' : '所有播客已更新', 'ok');
        } catch (error) {
          showToast(error.message, 'error');
        } finally {
          setRefreshing(false);
        }
      };

      useEffect(() => {
        const minutes = Math.max(5, Number(state?.settings?.refreshMinutes) || 30);
        const timer = setInterval(() => {
          if (refreshing || jobsRef.current.some((job) => job.status === 'running')) return;
          refreshAll();
        }, minutes * 60_000);
        return () => clearInterval(timer);
      }, [state?.settings?.refreshMinutes, refreshing]);

      const markAllRead = async (targetFeedId) => {
        try {
          await api('markViewed', { feedId: targetFeedId });
          await reload();
          showToast('已全部标为已读', 'ok');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const toggleStar = async (episode) => {
        if (!feedId || !episode?.guid) return;
        const next = !episode.starred;
        try {
          const result = await api('starEpisode', { feedId, guid: episode.guid, starred: next });
          const starred = Boolean(result.starred);
          setEpisodes((list) => list.map((item) => (item.guid === episode.guid ? { ...item, starred } : item)));
          setDetail((previous) =>
            previous?.episode?.guid === episode.guid ? { ...previous, episode: { ...previous.episode, starred } } : previous,
          );
          setState((previous) => {
            if (!previous) return previous;
            return {
              ...previous,
              feeds: previous.feeds.map((item) =>
                item.id === feedId
                  ? {
                      ...item,
                      stats: {
                        ...item.stats,
                        starredCount: Math.max(0, Number(item.stats?.starredCount || 0) + (starred ? 1 : -1)),
                      },
                    }
                  : item,
              ),
              stats: {
                ...previous.stats,
                starredCount: Math.max(0, Number(previous.stats?.starredCount || 0) + (starred ? 1 : -1)),
              },
            };
          });
          showToast(starred ? '已标星' : '已取消星标', 'ok');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const setEpisodeRead = async (episode, viewed) => {
        if (!feedId || !episode?.guid) return;
        try {
          const result = await api('markViewed', { feedId, guid: episode.guid, viewed });
          if (!result?.changed) return;
          const stamp = viewed ? Date.now() : 0;
          const delta = viewed ? -1 : 1;
          setEpisodes((list) => list.map((item) => (item.guid === episode.guid ? { ...item, viewedAt: stamp } : item)));
          setDetail((previous) =>
            previous?.episode?.guid === episode.guid ? { ...previous, episode: { ...previous.episode, viewedAt: stamp } } : previous,
          );
          setState((previous) => {
            if (!previous) return previous;
            return {
              ...previous,
              feeds: previous.feeds.map((item) =>
                item.id === feedId
                  ? { ...item, stats: { ...item.stats, unreadCount: Math.max(0, Number(item.stats?.unreadCount || 0) + delta) } }
                  : item,
              ),
              stats: {
                ...previous.stats,
                unreadCount: Math.max(0, Number(previous.stats?.unreadCount || 0) + delta),
              },
            };
          });
          showToast(viewed ? '已标为已读' : '已标为未读', 'ok');
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const openFeedMenu = (event, item) =>
        openMenu(event, [
          { label: '修改分类…', icon: 'tag', onClick: () => setCategoryEdit(item) },
          { label: '全部标为已读', icon: 'check', onClick: () => markAllRead(item.id) },
          { label: '刷新这个播客', icon: 'refresh', onClick: () => refreshAll(item.id) },
        ]);

      const openEpisodeMenu = (event, episode) =>
        openMenu(event, [
          {
            label: episode.starred ? '取消星标' : '标星',
            icon: 'star',
            onClick: () => toggleStar(episode),
          },
          {
            label: episode.viewedAt ? '标为未读' : '标为已读',
            icon: 'check',
            onClick: () => setEpisodeRead(episode, !episode.viewedAt),
          },
        ]);

      const start = async (type) => {
        if (!feedId || !selectedGuid) return;
        setBusy(type);
        try {
          const job = await api(type, { feedId, guid: selectedGuid });
          setJobs((previous) => [job, ...previous.filter((item) => item.id !== job.id)]);
          showToast(
            type === 'transcribe'
              ? '开始转写，首次运行要加载语音模型，请耐心等一会儿'
              : '开始生成专家访谈笔记，通常需要几十秒',
            'info',
          );
        } catch (error) {
          if (error?.code === 'env-not-ready') {
            setSettingsOpen(true);
            showToast('先准备转写环境：设置里点「一键准备转写环境」', 'error');
          } else {
            showToast(error.message, 'error');
          }
        } finally {
          setBusy('');
        }
      };

      const cancelJob = async (job) => {
        try {
          const value = await api('cancel', { jobId: job.id });
          setJobs((previous) => previous.map((item) => (item.id === value.id ? value : item)));
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const removeArtifact = async (type) => {
        const label = type === 'transcript' ? '逐字稿' : '访谈笔记';
        if (!window.confirm(`确定删除这一集的${label}吗？文件会从磁盘删掉。`)) return;
        try {
          await api('deleteArtifact', { feedId, guid: selectedGuid, type });
          showToast(`已删除${label}`, 'ok');
          setDetailVersion((current) => current + 1);
          setEpisodeVersion((current) => current + 1);
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const reveal = async (path) => {
        try {
          await api('reveal', { path });
        } catch (error) {
          showToast(error.message, 'error');
        }
      };

      const openExternal = (url) => {
        if (!url) return;
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) showToast('浏览器拦截了新窗口，请手动打开链接', 'error');
      };

      const copy = async (text, label) => {
        try {
          await copyText(text);
          showToast(`${label}已复制`, 'ok');
        } catch {
          showToast('复制失败，请手动选择文本', 'error');
        }
      };

      const startEditNotes = () => {
        if (!detail?.notes) {
          showToast('这一集还没有笔记', 'error');
          return;
        }
        setNotesDraft(detail.notes);
        setEditingNotes(true);
        setHlSelection(null);
      };

      const cancelEditNotes = () => {
        setEditingNotes(false);
        setNotesDraft('');
      };

      const saveNotes = async (text) => {
        setSavingNotes(true);
        try {
          const result = await api('saveNotes', {
            feedId: selectedEpisode?.feedId || feedId,
            guid: selectedEpisode?.guid || selectedGuid,
            text,
          });
          setEditingNotes(false);
          setNotesDraft('');
          setDetailVersion((value) => value + 1);
          setEpisodeVersion((value) => value + 1);
          showToast(`笔记已保存（${result?.chars ?? text.length} 字）`, 'ok');
        } catch (error) {
          showToast(error?.message || '保存失败', 'error');
        } finally {
          setSavingNotes(false);
        }
      };

      // Turns a browser selection inside the rendered notes into a ==highlight==
      // in the Markdown source, then saves it.
      const highlightSelection = async () => {
        const selection = window.getSelection?.();
        const picked = String(selection?.toString() || '').trim();
        setHlSelection(null);
        if (!picked) {
          showToast('先在笔记里选中一段文字', 'error');
          return;
        }
        const source = detail?.notes || '';
        const target = picked.replace(/\s+/g, ' ').trim();
        // The rendered text drops Markdown syntax, so match against a syntax-free
        // copy of the source first and then re-inject the markers at the right
        // offsets in the original.
        const updated = applyHighlightToSource(source, target);
        if (updated === null) {
          showToast('这段文字在原文里找不到，试试选中更完整的一句', 'error');
          return;
        }
        setSavingNotes(true);
        try {
          const result = await api('saveNotes', {
            feedId: selectedEpisode?.feedId || feedId,
            guid: selectedEpisode?.guid || selectedGuid,
            text: updated,
          });
          setDetailVersion((value) => value + 1);
          setEpisodeVersion((value) => value + 1);
          showToast('已高亮并保存', 'ok');
        } catch (error) {
          showToast(error?.message || '高亮失败', 'error');
        } finally {
          setSavingNotes(false);
        }
      };

      // Watches the rendered notes for a text selection and floats a 高亮 button.
      useEffect(() => {
        if (editingNotes || !detail?.notes) {
          setHlSelection(null);
          return undefined;
        }
        const onSelect = () => {
          const selection = window.getSelection?.();
          const picked = String(selection?.toString() || '').trim();
          if (!picked || picked.length < 2) {
            setHlSelection(null);
            return;
          }
          const anchor = selection?.anchorNode;
          const host = anchor?.parentElement?.closest?.('.pn-md');
          if (!host) {
            setHlSelection(null);
            return;
          }
          const range = selection?.getRangeAt?.(0);
          if (!range || range.collapsed) {
            setHlSelection(null);
            return;
          }
          const rect = range.getBoundingClientRect();
          if (!rect || (rect.width === 0 && rect.height === 0)) {
            setHlSelection(null);
            return;
          }
          setHlSelection({
            text: picked,
            top: Math.max(8, rect.top - 40),
            left: Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 150)),
          });
        };
        document.addEventListener('selectionchange', onSelect);
        return () => document.removeEventListener('selectionchange', onSelect);
      }, [editingNotes, detail?.notes]);

      if (bootError) {
        return h(
          'div',
          { className: 'pn-root' },
          h(
            'div',
            { style: { padding: 28 } },
            h(Empty, { icon: 'alert', title: '无法连接播客笔记服务', text: bootError }),
            h('div', { style: { marginTop: 4 } }, h('button', { type: 'button', className: 'pn-btn', onClick: () => location.reload() }, '重新加载页面')),
          ),
        );
      }

      if (!state) {
        return h(
          'div',
          { className: 'pn-root' },
          h('div', { className: 'pn-loading' }, h('span', { className: 'pn-spinner' }), '正在加载播客库…'),
        );
      }

      const stats = state.stats || {};
      const selectedMissing = detailLoading && !detail;
      const currentTab = !hasTranscript && !hasNotes ? 'intro' : tab;

      return h(
        'div',
        { className: `pn-root${compact ? ' pn-compact' : ''}${compact && compactDetail ? ' pn-compact-detail' : ''}${compact && !compactDetail ? ' pn-compact-list' : ''}` },
        h(
          'header',
          { className: 'pn-header' },
          h('div', { className: 'pn-logo' }, h(Icon, { name: 'mic', size: 19 })),
          h(
            'div',
            { className: 'pn-heading' },
            h(
              'div',
              { className: 'pn-title' },
              '播客笔记',
              stats.unreadCount
                ? h(
                    'span',
                    { className: 'pn-new-dot', title: `${stats.unreadCount} 集未读` },
                    stats.unreadCount > 99 ? '99+' : String(stats.unreadCount),
                  )
                : null,
            ),
            h(
              'div',
              { className: 'pn-sub' },
              `${feeds.length} 个播客 · ${stats.totalEpisodes || 0} 集 · ${stats.transcriptCount || 0} 份逐字稿 · ${stats.notesCount || 0} 篇笔记`,
            ),
          ),
          h(
            'div',
            { className: 'pn-head-actions' },
            refreshing ? h('span', { className: 'pn-spinner' }) : null,
            h(
              'button',
              { type: 'button', className: 'pn-btn', onClick: () => refreshAll(), disabled: refreshing, title: '刷新全部播客' },
              h(Icon, { name: 'refresh', size: 14 }),
              '刷新',
            ),
            h(
              'button',
              { type: 'button', className: 'pn-btn pn-btn-ghost pn-btn-icon', onClick: () => setAddOpen(true), title: '添加播客 RSS' },
              h(Icon, { name: 'plus', size: 16 }),
            ),
            h(
              'button',
              { type: 'button', className: 'pn-btn pn-btn-ghost pn-btn-icon', onClick: () => setSettingsOpen(true), title: '设置' },
              h(Icon, { name: 'settings', size: 16 }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'pn-body' },
          h(
            'aside',
            { className: 'pn-side' },
            h(
              'div',
              { className: 'pn-side-top', style: { height: feedPaneHeight } },
              h(
                'div',
                { className: 'pn-chips' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: `pn-chip${category === '全部' ? ' pn-chip-on' : ''}`,
                    onClick: () => setCategory('全部'),
                  },
                  `全部 ${feeds.length}`,
                ),
                categories.map((item) =>
                  h(
                    'button',
                    {
                      type: 'button',
                      key: item.name,
                      className: `pn-chip${category === item.name ? ' pn-chip-on' : ''}`,
                      onClick: () => setCategory(item.name),
                    },
                    `${item.name} ${item.count}`,
                  ),
                ),
              ),
              h(
                'div',
                { className: 'pn-feeds' },
                visibleFeeds.map((item) =>
                  h(FeedPill, {
                    key: item.id,
                    feed: item,
                    active: item.id === feedId,
                    onSelect: () => {
                      setFeedId(item.id);
                      if (compact) setCompactDetail(false);
                    },
                    onContextMenu: (event) => openFeedMenu(event, item),
                  }),
                ),
                visibleFeeds.length === 0
                  ? h('div', { className: 'pn-empty', style: { padding: '9px 6px' } }, '这个分类下还没有播客')
                  : null,
              ),
            ),
            h('div', {
              className: 'pn-feed-resizer',
              role: 'separator',
              'aria-orientation': 'horizontal',
              title: '拖动调整播客栏高度；双击恢复默认',
              onPointerDown: startFeedResize,
              onDoubleClick: () => setFeedPaneHeight(196),
            }),
            h(
              'div',
              { className: 'pn-list-tools' },
              h(
                'div',
                { className: 'pn-search' },
                h(Icon, { name: 'search', size: 13 }),
                h('input', {
                  value: query,
                  onChange: (event) => setQuery(event.target.value),
                  placeholder: '搜索单集…',
                  spellCheck: false,
                }),
              ),
              h(
                'select',
                { className: 'pn-filter', value: filter, onChange: (event) => setFilter(event.target.value), title: '筛选单集' },
                h('option', { value: 'all' }, '全部'),
                h('option', { value: 'unread' }, '未读'),
                h('option', { value: 'starred' }, '星标'),
                h('option', { value: 'none' }, '未处理'),
                h('option', { value: 'transcript' }, '有逐字稿'),
                h('option', { value: 'notes' }, '有笔记'),
              ),
            ),
            h(
              'div',
              { className: 'pn-episodes' },
              episodesLoading
                ? h('div', { className: 'pn-loading' }, h('span', { className: 'pn-spinner' }), '正在读取节目…')
                : episodesError
                  ? h(Empty, { icon: 'alert', title: '读取节目失败', text: episodesError })
                  : filteredEpisodes.length
                    ? filteredEpisodes.map((episode) =>
                        h(EpisodeRow, {
                          key: episode.guid,
                          episode,
                          active: episode.guid === selectedGuid,
                          onSelect: () => {
                            setSelectedGuid(episode.guid);
                            if (compact) setCompactDetail(true);
                          },
                          onContextMenu: (event) => openEpisodeMenu(event, episode),
                        }),
                      )
                    : h(Empty, {
                        icon: feed ? 'rss' : 'mic',
                        title: query || filter !== 'all' ? '没有匹配的单集' : '这个播客还没有节目',
                        text:
                          query || filter !== 'all'
                            ? '换个关键词或筛选条件试试。'
                            : '刷新一下，或者检查 RSS 是否可以访问。',
                        children:
                          !query && filter === 'all' && feed
                            ? h(
                                'button',
                                { type: 'button', className: 'pn-btn pn-btn-sm', onClick: () => refreshAll(feed.id), disabled: refreshing },
                                '刷新这个播客',
                              )
                            : null,
                      }),
            ),
          ),
          h(
            'section',
            { className: 'pn-detail' },
            selectedEpisode
              ? h(
                  React.Fragment,
                  null,
                  h(
                    'div',
                    { className: 'pn-detail-head' },
                    compact
                      ? h(
                          'div',
                          { className: 'pn-compact-back' },
                          h(
                            'button',
                            { type: 'button', className: 'pn-btn pn-btn-sm pn-btn-ghost', onClick: () => setCompactDetail(false) },
                            '← 单集列表',
                          ),
                        )
                      : null,
                    h(
                      'div',
                      { className: 'pn-detail-eyebrow' },
                      feed?.title || '',
                      selectedEpisode.pubDate ? h('span', null, '·') : null,
                      selectedEpisode.pubDate ? h('span', null, fmtDate(selectedEpisode.pubDate)) : null,
                      selectedEpisode.duration ? h('span', null, '·') : null,
                      selectedEpisode.duration ? h('span', null, fmtDuration(selectedEpisode.duration)) : null,
                    ),
                    h(
                      'h1',
                      { className: 'pn-detail-title' },
                      selectedEpisode.link
                        ? h(
                            'a',
                            {
                              className: 'pn-title-link',
                              href: selectedEpisode.link,
                              title: '在小宇宙打开这一期',
                              onClick: (event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                openExternalUrl(selectedEpisode.link);
                              },
                            },
                            selectedEpisode.title,
                          )
                        : selectedEpisode.title,
                    ),
                    h(
                      'div',
                      { className: 'pn-detail-meta' },
                      selectedEpisode.episodeNumber ? h('span', null, `第 ${selectedEpisode.episodeNumber} 期`) : null,
                      selectedEpisode.link
                        ? h(
                            'a',
                            {
                              href: selectedEpisode.link,
                              onClick: (event) => {
                                event.preventDefault();
                                openExternal(selectedEpisode.link);
                              },
                              style: { color: 'var(--pn-accent)', textDecoration: 'none' },
                            },
                            '在小宇宙打开',
                          )
                        : null,
                      selectedEpisode.transcriptChars
                        ? h('span', null, `逐字稿 ${Math.round(selectedEpisode.transcriptChars / 1000)}k 字`)
                        : null,
                    ),
                    h(
                      'div',
                      { className: 'pn-detail-actions' },
                      !hasTranscript
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'pn-btn pn-btn-primary',
                              disabled: Boolean(activeJob) || busy === 'transcribe',
                              onClick: () => start('transcribe'),
                            },
                            h(Icon, { name: 'file', size: 14 }),
                            activeJob?.type === 'transcript' ? '转写中…' : '获取逐字稿',
                          )
                        : h(
                            React.Fragment,
                            null,
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'pn-btn pn-btn-primary',
                                disabled: Boolean(activeJob) || busy === 'notes',
                                onClick: () => start('notes'),
                              },
                              h(Icon, { name: 'sparkles', size: 14 }),
                              activeJob?.type === 'notes' ? '生成中…' : hasNotes ? '重新生成笔记' : '生成专家访谈笔记',
                            ),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'pn-btn',
                                disabled: Boolean(activeJob),
                                onClick: () => start('transcribe'),
                                title: '重新转写这一集',
                              },
                              h(Icon, { name: 'refresh', size: 13 }),
                              '重新转写',
                            ),
                          ),
                      hasTranscript
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'pn-btn pn-btn-ghost pn-btn-icon',
                              title: '打开逐字稿文件',
                              onClick: () => reveal(selectedEpisode.transcriptPath),
                            },
                            h(Icon, { name: 'folder', size: 15 }),
                          )
                        : null,
                      hasNotes
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'pn-btn pn-btn-ghost pn-btn-icon',
                              title: '打开笔记文件',
                              onClick: () => reveal(selectedEpisode.notesPath),
                            },
                            h(Icon, { name: 'book', size: 15 }),
                          )
                        : null,
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'pn-btn pn-btn-ghost pn-btn-icon',
                          title: selectedEpisode.starred ? '取消星标' : '标星',
                          style: selectedEpisode.starred ? { color: '#d99a1b' } : undefined,
                          onClick: () => toggleStar(selectedEpisode),
                        },
                        h(Icon, { name: 'star', size: 17 }),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'pn-btn pn-btn-ghost pn-btn-icon',
                          title: '删除逐字稿',
                          disabled: !hasTranscript,
                          onClick: () => removeArtifact('transcript'),
                        },
                        h(Icon, { name: 'trash', size: 14 }),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'pn-tabs' },
                      hasTranscript
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: `pn-tab${currentTab === 'transcript' ? ' pn-tab-on' : ''}`,
                              onClick: () => setTab('transcript'),
                            },
                            '逐字稿',
                            h('span', { className: 'pn-tab-count' }, selectedEpisode.transcriptChars ? `${Math.round(selectedEpisode.transcriptChars / 1000)}k` : ''),
                          )
                        : null,
                      hasNotes
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: `pn-tab${currentTab === 'notes' ? ' pn-tab-on' : ''}`,
                              onClick: () => setTab('notes'),
                            },
                            '专家访谈笔记',
                            h(
                              'span',
                              { className: 'pn-tab-count' },
                              highlightCount > 0 ? `${highlightCount} 高亮` : '',
                            ),
                          )
                        : null,
                      h(
                        'button',
                        {
                          type: 'button',
                          className: `pn-tab${currentTab === 'intro' ? ' pn-tab-on' : ''}`,
                          onClick: () => setTab('intro'),
                        },
                        '节目简介',
                      ),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'pn-detail-body' },
                    activeJob ? h(JobCard, { job: activeJob, onCancel: () => cancelJob(activeJob) }) : null,
                    lastErrorJob ? h('div', { className: 'pn-err' }, `上一次任务失败：${lastErrorJob.error || '未知错误'}`) : null,
                    selectedMissing
                      ? h('div', { className: 'pn-loading' }, h('span', { className: 'pn-spinner' }), '正在读取这一集…')
                      : currentTab === 'transcript'
                        ? h(
                            React.Fragment,
                            null,
                            h(
                              'div',
                              { className: 'pn-toolbar' },
                              h('span', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11 } }, '带时间戳的逐字稿'),
                              h('span', { className: 'pn-spacer' }),
                              h(
                                'button',
                                { type: 'button', className: 'pn-btn pn-btn-sm', onClick: () => copy(detail.transcript, '逐字稿') },
                                h(Icon, { name: 'copy', size: 12 }),
                                '复制全文',
                              ),
                            ),
                            h('pre', { className: 'pn-transcript' }, detail.transcript),
                          )
                        : currentTab === 'notes'
                          ? editingNotes
                            ? h(
                                React.Fragment,
                                null,
                                h(NotesEditor, {
                                  initialText: notesDraft,
                                  saving: savingNotes,
                                  onCancel: cancelEditNotes,
                                  onSave: saveNotes,
                                }),
                              )
                            : h(
                                React.Fragment,
                                null,
                                h(
                                  'div',
                                  { className: 'pn-toolbar' },
                                  h(
                                    'span',
                                    { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11 } },
                                    highlightCount > 0 ? `专家访谈笔记 · ${highlightCount} 处高亮` : '按问题组织的专家访谈笔记',
                                  ),
                                  h('span', { className: 'pn-spacer' }),
                                  h(
                                    'button',
                                    {
                                      type: 'button',
                                      className: `pn-btn pn-btn-sm${onlyHighlights ? ' pn-btn-on' : ''}`,
                                      onClick: () => setOnlyHighlights((value) => !value),
                                    },
                                    '只看高亮',
                                  ),
                                  h(
                                    'button',
                                    { type: 'button', className: 'pn-btn pn-btn-sm', onClick: startEditNotes },
                                    h(Icon, { name: 'edit', size: 12 }),
                                    '编辑',
                                  ),
                                  h(
                                    'button',
                                    { type: 'button', className: 'pn-btn pn-btn-sm', onClick: () => copy(detail.notes, '笔记') },
                                    h(Icon, { name: 'copy', size: 12 }),
                                    '复制全文',
                                  ),
                                ),
                                onlyHighlights
                                  ? h(
                                      'div',
                                      { className: 'pn-md' },
                                      h(
                                        'div',
                                        { className: 'pn-hl-list' },
                                        (detail.notes.match(/==([^=\n]+)==/g) || []).map((item, index) =>
                                          h(
                                            'div',
                                            { key: `${index}-${item.slice(0, 12)}`, className: 'pn-hl-item' },
                                            h('span', { className: 'pn-hl-index' }, String(index + 1)),
                                            h(
                                              'span',
                                              { className: 'pn-hl-text' },
                                              item.replace(/^==/, '').replace(/==$/, ''),
                                            ),
                                          ),
                                        ),
                                      ),
                                    )
                                  : h('div', { className: 'pn-md', dangerouslySetInnerHTML: { __html: renderMarkdown(detail.notes) } }),
                                hlSelection
                                  ? h(
                                      'div',
                                      { className: 'pn-hlbar', style: { top: hlSelection.top, left: hlSelection.left } },
                                      h(
                                        'button',
                                        { type: 'button', onClick: highlightSelection },
                                        h(Icon, { name: 'highlighter', size: 12 }),
                                        '高亮这段',
                                      ),
                                    )
                                  : null,
                              )
                          : h(
                              React.Fragment,
                              null,
                              selectedEpisode.description
                                ? h(
                                    React.Fragment,
                                    null,
                                    h(
                                      'div',
                                      { className: 'pn-toolbar' },
                                      h(
                                        'span',
                                        { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 11 } },
                                        `节目简介 · ${selectedEpisode.description.length} 字`,
                                      ),
                                      h('span', { className: 'pn-spacer' }),
                                      h(
                                        'button',
                                        {
                                          type: 'button',
                                          className: 'pn-btn pn-btn-sm',
                                          onClick: () => copy(selectedEpisode.description, '简介'),
                                        },
                                        h(Icon, { name: 'copy', size: 12 }),
                                        '复制全文',
                                      ),
                                    ),
                                    h('p', { className: 'pn-desc' }, selectedEpisode.description),
                                  )
                                : h(Empty, { icon: 'file', title: '这一集没有简介', text: '可以直接获取逐字稿。' }),
                              !hasTranscript
                                ? h(
                                    'div',
                                    { className: 'pn-cta', style: { marginTop: 16 } },
                                    h('div', { className: 'pn-cta-icon' }, h(Icon, { name: 'mic', size: 18 })),
                                    h('b', null, '先拿到逐字稿'),
                                    h(
                                      'p',
                                      null,
                                      '调用 vita-podcast-download-skill 下载音频并转写，结果按节目名归档为带时间戳的 Markdown。音频默认不保留。',
                                    ),
                                    h(
                                      'button',
                                      {
                                        type: 'button',
                                        className: 'pn-btn pn-btn-primary',
                                        disabled: Boolean(activeJob),
                                        onClick: () => start('transcribe'),
                                      },
                                      h(Icon, { name: 'file', size: 14 }),
                                      activeJob?.type === 'transcript' ? '转写中…' : '获取逐字稿',
                                    ),
                                  )
                                : !hasNotes
                                  ? h(
                                      'div',
                                      { className: 'pn-cta', style: { marginTop: 16 } },
                                      h('div', { className: 'pn-cta-icon' }, h(Icon, { name: 'sparkles', size: 18 })),
                                      h('b', null, '转成专家访谈笔记'),
                                      h(
                                        'p',
                                        null,
                                        '按 expert-interview-notes 的方法，把逐字稿整理成按问题分节、保留数字与反例、区分事实和判断的内部笔记。',
                                      ),
                                      h(
                                        'button',
                                        {
                                          type: 'button',
                                          className: 'pn-btn pn-btn-primary',
                                          disabled: Boolean(activeJob),
                                          onClick: () => start('notes'),
                                        },
                                        h(Icon, { name: 'sparkles', size: 14 }),
                                        activeJob?.type === 'notes' ? '生成中…' : '生成专家访谈笔记',
                                      ),
                                    )
                                  : null,
                            ),
                  ),
                )
              : h(
                  'div',
                  { className: 'pn-detail-body', style: { display: 'grid', placeItems: 'center' } },
                  h(Empty, {
                    icon: 'mic',
                    title: feed ? '选择一期节目' : '还没有播客',
                    text: feed ? '从左边挑一集，获取逐字稿或专家访谈笔记。' : '添加一个 RSS，或者刷新默认订阅。',
                  }),
                ),
          ),
        ),
        settingsOpen
          ? h(SettingsDialog, {
              settings: state.settings,
              onClose: () => setSettingsOpen(false),
              onSaved: (value) => {
                setState((previous) => (previous ? { ...previous, settings: value.settings, dataDir: value.dataDir } : previous));
              },
              showToast,
            })
          : null,
        addOpen
          ? h(AddFeedDialog, {
              onClose: () => setAddOpen(false),
              onAdded: (feed) => {
                setCategory('全部');
                reload();
                if (feed?.id) {
                  setFeedId(feed.id);
                  setSelectedGuid('');
                }
              },
              showToast,
              categories,
            })
          : null,
        categoryEdit
          ? h(CategoryDialog, {
              feed: categoryEdit,
              categories,
              onClose: () => setCategoryEdit(null),
              onSaved: (nextCategory) => {
                setCategory(nextCategory);
                reload();
                setEpisodeVersion((value) => value + 1);
              },
              showToast,
            })
          : null,
        h(ContextMenu, { menu, onClose: () => setMenu(null) }),
        toast
          ? h(
              'div',
              { className: `pn-toast pn-toast-${toast.kind}`, role: 'status' },
              h(Icon, { name: toast.kind === 'error' ? 'alert' : toast.kind === 'ok' ? 'check' : 'clock', size: 14 }),
              h('span', null, toast.text),
            )
          : null,
      );
    }

    return {
      name: 'dsh-podcast-notes',
      inject: ['slots', 'sidebarRightTabs', 'sidebarRight'],
      apply(ctx) {
        ctx.effect(() => {
          ensureStyles();
          return () => {
            const style = typeof document !== 'undefined' ? document.getElementById(STYLE_ID) : null;
            if (style) style.remove();
          };
        }, 'dsh-podcast-notes: styles');
        const rightTabs = typeof ctx.get === 'function' ? ctx.get('sidebarRightTabs') : undefined;
        const rightbar = typeof ctx.get === 'function' ? ctx.get('sidebarRight') : undefined;
        const openInRightSidebar = rightbar
          ? () => {
              try {
                rightbar.openTab('podcast-notes');
              } catch (error) {
                console.warn('[podcast-notes] 无法在右侧栏打开', error);
              }
            }
          : null;
        if (rightTabs) {
          ctx.effect(
            () =>
              rightTabs.register({
                id: 'dsh-podcast-notes',
                kind: 'podcast-notes',
                title: () => '播客笔记',
                priority: 'extension',
                keepMounted: true,
                guide: [
                  {
                    id: 'podcast-notes',
                    order: 30,
                    title: () => '播客笔记',
                    description: () => 'RSS 播客、逐字稿与专家访谈笔记',
                  },
                ],
              }),
            'dsh-podcast-notes: right tab type',
          );
          ctx.slots.inject('sidebar.right.pane.tab', () =>
            ctx.slots.register(
              { name: 'sidebar.right.pane.tab', key: 'dsh-podcast-notes' },
              () => h(Panel, { compact: true }),
            ),
          );
        }
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'podcast-notes' },
            () => h(Panel),
          ),
        );
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'podcast-notes',
              order: 15,
              label: () => '播客笔记',
            },
            SidebarIcon,
          ),
        );
        if (rightbar) {
          ctx.slots.inject('conversation.session.header.utilities', () =>
            ctx.slots.register(
              {
                name: 'conversation.session.header.utilities',
                id: 'podcast-notes',
                order: 4,
                label: () => '播客笔记',
              },
              () => h(RightSidebarLauncher, { onOpen: openInRightSidebar }),
            ),
          );
        }
      },
    };
  },
});
