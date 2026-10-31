export function adminPage(nonce) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dawei Sun · 访客记录</title>
<style nonce="${nonce}">
*{box-sizing:border-box}body{margin:0;color:#20313e;background:#f4f6f8;font:14px/1.6 system-ui,-apple-system,sans-serif}main{max-width:1500px;margin:40px auto;padding:0 24px}h1{font-size:26px;margin:0 0 8px}p{color:#5a6772}form,.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:20px 0}label{font-weight:600}input,button{font:inherit;padding:10px 14px;border:1px solid #bdc9d2;border-radius:6px}input{width:320px;max-width:100%}button{cursor:pointer;background:#203e55;color:white;border-color:#203e55}button:disabled{opacity:.5;cursor:default}button.secondary{color:#203e55;background:#fff}.table-wrap{overflow-x:auto;background:#fff;border:1px solid #dae1e7;border-radius:8px}table{width:100%;border-collapse:collapse;min-width:1280px}th,td{padding:12px;text-align:left;vertical-align:top;border-bottom:1px solid #e5ebef;white-space:pre-line;overflow-wrap:anywhere}th{background:#eaf0f4;font-size:12px}td{max-width:240px}code{font-family:ui-monospace,monospace}.notice{padding:16px;background:white;border-radius:8px}#status{min-height:24px}#status[data-error="true"]{color:#a01e25}[hidden]{display:none!important}@media(max-width:600px){main{margin-top:24px;padding:0 16px}h1{font-size:22px}form{align-items:stretch;flex-direction:column}input{width:100%}}
</style></head><body><main>
<h1>Dawei Sun · 私人访客记录</h1>
<p>记录保留 90 天 · 北京时间（UTC+8） · 最新记录每分钟刷新，采集和同步可能有延迟。</p>
<p>停留和深度按本批次记录汇总，单次访问与点击详情请展开历史记录。IP 定位为近似值，匿名标签不能确认个人身份。</p>
<form id="login"><label for="token">管理员访问密钥</label><input id="token" type="password" required maxlength="256" autocomplete="off" spellcheck="false"><button type="submit">查看记录</button></form>
<div id="controls" class="controls" hidden><button id="refresh">刷新最新记录</button><button id="older" class="secondary" disabled>更早记录</button><button id="logout" class="secondary">退出</button></div>
<p id="status" role="status" aria-live="polite">请输入密钥。密钥只保存在当前页面内存中。</p>
<div id="result"></div>
</main><script nonce="${nonce}">${CLIENT}</script></body></html>`;
}
const CLIENT = String.raw`
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let token = '', nextCursor = null, controller = null, generation = 0, loading = false, viewingHistory = false, updatedAt = '';
  const time = value => value ? new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year:'numeric', month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }).format(new Date(value)) : '—';
  const duration = seconds => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    return total < 60 ? total + '秒' : Math.floor(total / 60) + '分' + total % 60 + '秒';
  };
  function status(text, error = false) { $('status').textContent = text; $('status').dataset.error = String(error); }
  function logout(message = '已退出。请输入密钥。') {
    generation++;
    controller?.abort(); controller = null;
    token = ''; nextCursor = null; loading = false; viewingHistory = false; updatedAt = ''; $('token').value = '';
    $('result').replaceChildren(); $('controls').hidden = true; $('login').hidden = false;
    $('login').querySelector('button').disabled = false;
    status(message); $('token').focus();
  }
  function render(data) {
    const expanded = new Set(Array.from(document.querySelectorAll('details[open][data-visitor]'), n => n.dataset.visitor));
    const scrollLeft = document.querySelector('.table-wrap')?.scrollLeft || 0;
    $('result').replaceChildren();
    if (!data.visitors.length) {
      const empty = document.createElement('div'); empty.className = 'notice'; empty.textContent = '本批次没有访问记录。'; $('result').append(empty); return;
    }
    const wrapper = document.createElement('div'); wrapper.className = 'table-wrap';
    const table = document.createElement('table'); const thead = table.createTHead(); const heading = thead.insertRow();
    for (const title of ['IP / 匿名标签','近似位置 / 网络','页面访问次数','首次 / 最近记录','设备','停留 / 深度','历史页面访问记录','来源域名']) {
      const th = document.createElement('th'); th.scope = 'col'; th.textContent = title; heading.append(th);
    }
    const body = table.createTBody();
    for (const v of data.visitors) {
      const row = body.insertRow();
      const hasCurrentMetrics = v.visits.length > 0;
      const seconds = hasCurrentMetrics ? v.totalVisibleSeconds : v.legacyActiveSeconds;
      const depth = hasCurrentMetrics ? Math.max(...v.visits.map(visit => visit.maxScrollPercent)) : v.legacyDisplayDepthPercent;
      const totals = '停留 ' + duration(seconds) + '\n深度：' + depth + '%';
      const values = [v.ip + '\n' + v.visitorId,
        [v.city,v.region,v.country].filter(Boolean).join(', ') + '\n' + [v.asOrganization,v.asn ? 'AS'+v.asn : ''].filter(Boolean).join(' / '),
        String(v.visitCount), time(v.firstSeen)+'\n'+time(v.lastSeen),
        [v.deviceType,v.browser,v.os,v.browserTimezone,v.colorScheme].filter(Boolean).join(' / '), totals];
      for (const value of values) row.insertCell().textContent = value;
      const visitsCell = row.insertCell();
      const details = document.createElement('details');
      details.dataset.visitor = v.ip+'|'+v.visitorId;
      details.open = expanded.has(details.dataset.visitor);
      const summary = document.createElement('summary'); summary.textContent = '查看记录'; details.append(summary);
      for (const visit of v.visits) {
        const entry = document.createElement('p');
        entry.textContent = visit.path+'\n首次记录 '+time(visit.firstSeen)+'\n最近记录 '+time(visit.lastSeen)+'\n停留 '+duration(visit.visibleMs/1000)+'\n深度：'+visit.maxScrollPercent+'%';
        details.append(entry);
      }
      if (v.legacyEventCount) {
        const legacy = document.createElement('p');
        legacy.textContent = '早期记录汇总\n'+v.paths.join('、')+'\n停留 '+duration(v.legacyActiveSeconds)+'\n深度：'+v.legacyDisplayDepthPercent+'%\n早期记录采用旧统计口径，仅供参考，无法拆分为单次访问。';
        details.append(legacy);
        if (!hasCurrentMetrics) row.cells[5].title = '早期记录采用旧统计口径，仅供参考；说明见历史页面访问记录。';
      }
      const clicks = Object.entries(v.linkClicks).map(([type,count]) => type + '：' + count + '次').join('，');
      if (clicks) {
        const entry = document.createElement('p'); entry.textContent = '本批次点击记录\n'+clicks; details.append(entry);
      }
      visitsCell.append(details);
      row.insertCell().textContent = v.referrers.join('\n') || '直接访问 / 未提供';
    }
    wrapper.append(table); $('result').append(wrapper); wrapper.scrollLeft = scrollLeft;
  }
  async function load(cursor, automatic = false) {
    if (automatic && loading) return;
    loading = true;
    const current = ++generation;
    controller?.abort(); controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller?.abort(), 30000);
    $('refresh').disabled = $('older').disabled = true;
    $('login').querySelector('button').disabled = true;
    if (!automatic) { $('result').replaceChildren(); status('正在读取记录…'); }
    try {
      const response = await fetch('/api/visits' + (cursor ? '?cursor='+encodeURIComponent(cursor) : ''), { headers: { Authorization: 'Bearer '+token }, signal, cache:'no-store', credentials:'omit' });
      if (current !== generation) return;
      if (response.status === 401) { logout('密钥无效，请重新输入。'); return; }
      if (!response.ok) throw new Error('HTTP '+response.status);
      const data = await response.json();
      if (current !== generation) return;
      nextCursor = data.nextCursor; viewingHistory = Boolean(cursor); updatedAt = time(new Date().toISOString());
      render(data); $('controls').hidden = false; $('login').hidden = true;
      status('更新于 '+updatedAt+'。本批次 '+data.totalEventsLoaded+' 条事件，'+data.visitors.length+' 个 IP / 浏览器组合。'+(data.firstEvent ? '覆盖 '+time(data.firstEvent)+' 至 '+time(data.lastEvent)+'。' : '')+'次数和时长仅汇总当前批次，不代表全部 90 天。'+(viewingHistory ? '历史批次已暂停自动刷新。' : '每分钟自动刷新。')+(nextCursor ? '可继续查看更早记录。' : '已到记录末尾。'));
    } catch (error) {
      if (current === generation) status(automatic ? '自动刷新失败；仍显示 '+updatedAt+' 的记录，请重试。' : '加载失败或超时，请重试。', true);
    } finally {
      clearTimeout(timeout);
      if (current === generation) { loading = false; $('refresh').disabled = false; $('older').disabled = !nextCursor; $('login').querySelector('button').disabled = false; }
    }
  }
  $('login').addEventListener('submit', event => { event.preventDefault(); token = $('token').value.trim(); $('token').value = ''; if (token) void load(); });
  $('refresh').addEventListener('click', () => { nextCursor = null; void load(); });
  $('older').addEventListener('click', () => { if (nextCursor) void load(nextCursor); });
  $('logout').addEventListener('click', () => logout());
  setInterval(() => { if (token && !viewingHistory && !loading && document.visibilityState === 'visible') void load(undefined, true); }, 60000);
  window.addEventListener('pagehide', () => logout());
})();`;
