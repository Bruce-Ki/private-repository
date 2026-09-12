/* ============================================================
 * 合租生活管家 - 单页应用（Hash 路由 + Mock 数据渲染）
 * 页面：#/home 首页 | #/expenses 费用 | #/chores 值日
 *       #/items 物品 | #/pact 公约
 * ============================================================ */
'use strict';

const App = (() => {
  /* ---------------- 全局状态（内存态，刷新即重置） ---------------- */
  const state = {
    route: 'home',
    currentUserId: MOCK.currentUserId,
    expenses: MOCK.expenses.map(e => ({ ...e })),
    chores: MOCK.chores.map(c => ({ ...c })),
    items: MOCK.items.map(i => ({ ...i })),
    itemLogs: MOCK.itemLogs.slice(),
    proposal: { ...MOCK.proposal, votes: { ...MOCK.proposal.votes }, myVote: null },
    activities: MOCK.activities.slice(),
    idSeq: 100,
  };

  const $ = sel => document.querySelector(sel);
  const me = () => memberById(state.currentUserId);
  const memberById = id => MOCK.members.find(m => m.id === id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtC = cents => '¥' + (Math.abs(cents) / 100).toFixed(2);
  const fmtA = a => '¥' + Number(a).toFixed(2);
  const avatar = (m, size = '') => `<span class="avatar ${size}" style="background:${m.color}26">${m.avatar}</span>`;
  const memberChip = id => { const m = memberById(id); return `<span class="member-chip">${avatar(m)}${m.name}</span>`; };

  const TITLES = {
    home: '首页', expenses: '费用 AA 分摊', chores: '清洁值日排班',
    items: '公共物品登记与提醒', pact: '室友公约管理',
  };

  /* ---------------- 账目计算（以“分”为单位避免浮点误差） ---------------- */
  function computeBalances() {
    const bal = {};
    MOCK.members.forEach(m => (bal[m.id] = 0));
    state.expenses.forEach(e => {
      const totalC = Math.round(e.amount * 100);
      const n = e.splitAmong.length;
      const base = Math.floor(totalC / n);
      const rem = totalC - base * n; // 余数分摊给前 rem 人
      e.splitAmong.forEach((id, i) => { bal[id] -= base + (i < rem ? 1 : 0); });
      bal[e.payerId] += totalC;
    });
    return bal;
  }

  function settlePlan() {
    const bal = computeBalances();
    const debtors = [], creditors = [];
    MOCK.members.forEach(m => {
      const v = bal[m.id];
      if (v <= -1) debtors.push({ id: m.id, v: -v });
      else if (v >= 1) creditors.push({ id: m.id, v });
    });
    debtors.sort((a, b) => b.v - a.v);
    creditors.sort((a, b) => b.v - a.v);
    const plan = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(debtors[i].v, creditors[j].v);
      plan.push({ from: debtors[i].id, to: creditors[j].id, amt });
      debtors[i].v -= amt; creditors[j].v -= amt;
      if (debtors[i].v <= 0) i++;
      if (creditors[j].v <= 0) j++;
    }
    return plan;
  }

  const monthTotal = () => state.expenses.reduce((s, e) => s + e.amount, 0);
  const lowItems = () => state.items.filter(i => i.stock <= i.threshold);

  /* ---------------- 通用 UI ---------------- */
  let toastTimer = null;
  function toast(msg, type = 'ok') {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 2400);
  }

  function pushActivity(icon, text) {
    state.activities.unshift({ icon, text, time: '刚刚' });
  }

  function statCard(icon, label, value, sub, tone = '') {
    return `
      <div class="card stat-card ${tone}">
        <div class="stat-icon">${icon}</div>
        <div class="stat-body">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
          <div class="stat-sub">${sub}</div>
        </div>
      </div>`;
  }

  /* ============================================================
   * 首页（导航页 + 看板）
   * ============================================================ */
  function renderHome() {
    const bal = computeBalances();
    const my = bal[state.currentUserId];
    const myStat = my >= 0
      ? statCard('💰', '我的净额', `<span class="text-green">待收 ${fmtC(my)}</span>`, '本月垫付较多，等待室友结算 🎉')
      : statCard('💰', '我的净额', `<span class="text-red">待付 ${fmtC(my)}</span>`, '记得在 3 日内结清（公约第 6 条）', 'warn');

    const todayList = state.chores.filter(c => c.date === MOCK.today);
    const pendingToday = todayList.filter(c => c.status !== 'done');
    const choreStat = pendingToday.length
      ? statCard('🧹', '今日值日', `${pendingToday.length} 项待完成`, pendingToday.map(c => `${c.task}·${memberById(c.memberId).name}`).join('，'), 'warn')
      : statCard('🧹', '今日值日', '已全部完成', '今天没有待办值日任务 ✨');

    const lows = lowItems();
    const itemStat = lows.length
      ? statCard('🧻', '库存告急', `${lows.length} 件`, lows.map(i => i.name).join('、') + '，请及时补货', 'warn')
      : statCard('🧻', '库存告急', '0 件', '所有公共物品库存充足 ✨');

    const pactStat = statCard('📜', '室友公约', `${MOCK.pact.signs.length}/4 已签署`, `${MOCK.pact.version} · 1 个修订提案投票中`);

    const overdueCount = state.chores.filter(c => c.status === 'overdue').length;
    const modules = [
      { route: 'expenses', icon: '💰', color: '#f59e0b', name: '费用 AA 分摊', desc: '记一笔公共开销，自动均摊、债务确认，月底一键给出最少转账结算方案。', mini: `本月已记 ${state.expenses.length} 笔 · 总支出 ${fmtA(monthTotal())}` },
      { route: 'chores', icon: '🧹', color: '#0d9488', name: '清洁值日排班', desc: '按轮转规则自动排班，到期提醒、完成打卡留痕，用数据代替“感觉总是我在打扫”。', mini: `今日 ${pendingToday.length} 项待完成${overdueCount ? ` · ${overdueCount} 项逾期` : ''}` },
      { route: 'items', icon: '🧻', color: '#f97316', name: '公共物品登记与提醒', desc: '库存台账 + 低库存提醒，补货一键转公共开销，杜绝“用完了没人补”。', mini: `${state.items.length} 件在册 · ${lows.length} 件告急` },
      { route: 'pact', icon: '📜', color: '#8b5cf6', name: '室友公约管理', desc: '在线共创、签署留痕、修订投票，让口头约定变成有据可依的“基本法”。', mini: `${MOCK.pact.version} · 全员已签署 · 1 个提案投票中` },
    ];

    return `
      <section class="hero card">
        <div>
          <h2>下午好，${me().name} ${me().avatar}</h2>
          <p class="hero-sub">🏘️ ${MOCK.house.name} · 邀请码 <code>${MOCK.house.inviteCode}</code> · ${MOCK.house.memberCount} 位室友在住</p>
        </div>
        <div class="hero-members">${MOCK.members.map(m => avatar(m, 'avatar-lg')).join('')}</div>
      </section>

      <div class="stat-row">
        ${myStat}${choreStat}${itemStat}${pactStat}
      </div>

      <h3 class="section-title">功能模块</h3>
      <div class="module-grid">
        ${modules.map(m => `
          <div class="card module-card" data-goto="${m.route}" role="button" tabindex="0" style="--mc:${m.color}">
            <div class="module-head">
              <span class="module-icon">${m.icon}</span>
              <span class="module-name">${m.name}</span>
              <span class="module-arrow">→</span>
            </div>
            <p class="module-desc">${m.desc}</p>
            <div class="module-mini">${m.mini}</div>
          </div>`).join('')}
      </div>

      <h3 class="section-title">最近动态</h3>
      <section class="card activity-card">
        <ul class="activity-list">
          ${state.activities.slice(0, 8).map(a => `
            <li><span class="activity-icon">${a.icon}</span><span class="activity-text">${esc(a.text)}</span><span class="activity-time">${a.time}</span></li>`).join('')}
        </ul>
      </section>`;
  }

  /* ============================================================
   * 模块一：费用 AA 分摊
   * ============================================================ */
  function renderExpenses() {
    const bal = computeBalances();
    const my = bal[state.currentUserId];
    const plan = settlePlan();
    const avg = monthTotal() / MOCK.members.length;

    const balanceRows = MOCK.members.map(m => {
      const v = bal[m.id];
      const cls = v > 0 ? 'text-green' : v < 0 ? 'text-red' : 'text-muted';
      const label = v > 0 ? `应收 ${fmtC(v)}` : v < 0 ? `应付 ${fmtC(v)}` : '已结清';
      return `<li class="balance-row">${avatar(m)}<span class="balance-name">${m.name}${m.id === state.currentUserId ? '（我）' : ''}</span><span class="balance-amt ${cls}">${label}</span></li>`;
    }).join('');

    const planRows = plan.length
      ? plan.map(p => `
        <li class="settle-row">
          ${memberChip(p.from)}<span class="settle-arrow">➜</span>${memberChip(p.to)}
          <span class="settle-amt">${fmtC(p.amt)}</span>
        </li>`).join('')
      : '<li class="empty">账目已全部结清 🎉</li>';

    const catColors = { '房租': '#6366f1', '水电燃气': '#0ea5e9', '网费': '#14b8a6', '公共用品': '#f97316', '其他': '#94a3b8' };
    const rows = state.expenses.map(e => {
      const n = e.splitAmong.length;
      return `
        <tr>
          <td class="td-date">${e.date.slice(5)}</td>
          <td><span class="cat-badge" style="--cc:${catColors[e.category] || '#94a3b8'}">${e.category}</span>${e.tag ? `<span class="tag">${e.tag}</span>` : ''}</td>
          <td class="td-note">${esc(e.note)}</td>
          <td>${memberChip(e.payerId)}</td>
          <td class="td-num">${fmtA(e.amount)}</td>
          <td class="td-num text-muted">${fmtA(e.amount / n)} × ${n}人</td>
          <td><span class="badge ${e.status === '已确认' ? 'badge-ok' : 'badge-warn'}">${e.status}</span></td>
        </tr>`;
    }).join('');

    return `
      <div class="stat-row">
        ${statCard('🧾', '本月总支出', fmtA(monthTotal()), `共 ${state.expenses.length} 笔公共开销`)}
        ${statCard('👥', '人均支出', fmtA(avg), '按 4 位在住室友计算')}
        ${my >= 0
          ? statCard('🙋', '我的净额', `<span class="text-green">应收 ${fmtC(my)}</span>`, '等待室友按结算建议转账')
          : statCard('🙋', '我的净额', `<span class="text-red">应付 ${fmtC(my)}</span>`, '结算后可在下方标记已结清', 'warn')}
      </div>

      <div class="cols-2">
        <section class="card">
          <h3 class="card-title">成员结余</h3>
          <ul class="balance-list">${balanceRows}</ul>
          <p class="card-foot">结余 = 累计垫付 − 累计应摊，实时计算</p>
        </section>
        <section class="card">
          <h3 class="card-title">结算建议 <span class="card-title-sub">最少 ${plan.length} 笔转账结清</span></h3>
          <ul class="settle-list">${planRows}</ul>
          <button class="btn btn-outline btn-block" data-action="settle-demo">线下转账后，一键标记全部已结清（演示）</button>
        </section>
      </div>

      <section class="card">
        <h3 class="card-title">记一笔公共开销</h3>
        <form id="expense-form" class="expense-form">
          <div class="form-grid">
            <label class="field">
              <span>金额（元）*</span>
              <input type="number" name="amount" min="0.01" step="0.01" placeholder="如 45.90" required />
            </label>
            <label class="field">
              <span>类别</span>
              <select name="category">${MOCK.expenseCategories.map(c => `<option>${c}</option>`).join('')}</select>
            </label>
            <label class="field">
              <span>付款人</span>
              <select name="payer">${MOCK.members.map(m => `<option value="${m.id}" ${m.id === state.currentUserId ? 'selected' : ''}>${m.avatar} ${m.name}</option>`).join('')}</select>
            </label>
            <label class="field field-wide">
              <span>备注</span>
              <input type="text" name="note" placeholder="如：九月电费 / 补货纸巾洗衣液" />
            </label>
          </div>
          <div class="field">
            <span>参与分摊（默认全员均摊，可取消勾选）</span>
            <div class="split-checks">
              ${MOCK.members.map(m => `
                <label class="check-chip">
                  <input type="checkbox" name="split" value="${m.id}" checked />
                  ${avatar(m)} ${m.name}
                </label>`).join('')}
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">＋ 记一笔并自动分摊</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h3 class="card-title">账单明细 <span class="card-title-sub">2026 年 9 月</span></h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>日期</th><th>类别</th><th>备注</th><th>付款人</th><th class="td-num">金额</th><th class="td-num">人均</th><th>状态</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>`;
  }

  /* ============================================================
   * 模块二：清洁值日排班
   * ============================================================ */
  function renderChores() {
    const statusBadge = s =>
      s === 'done' ? '<span class="badge badge-ok">✔ 已完成</span>'
      : s === 'overdue' ? '<span class="badge badge-danger">✖ 已逾期</span>'
      : '<span class="badge badge-warn">待完成</span>';

    const todayList = state.chores.filter(c => c.date === MOCK.today);
    const todayHtml = todayList.map(c => {
      const m = memberById(c.memberId);
      const btn = c.status === 'done'
        ? `<button class="btn btn-sm btn-outline" data-action="toggle-chore" data-id="${c.id}">撤销打卡</button>`
        : `<button class="btn btn-sm btn-primary" data-action="toggle-chore" data-id="${c.id}">完成打卡 ✔</button>`;
      return `<li class="chore-row">${avatar(m)}<span class="chore-task">${c.task}</span>${memberChip(c.memberId)}${statusBadge(c.status)}${btn}</li>`;
    }).join('') || '<li class="empty">今天没有值日任务</li>';

    const dates = [...new Set(state.chores.map(c => c.date))];
    const weekRows = dates.map(d => {
      const items = state.chores.filter(c => c.date === d);
      const isToday = d === MOCK.today;
      return items.map((c, idx) => `
        <tr class="${isToday ? 'row-today' : ''}">
          ${idx === 0 ? `<td class="td-date" rowspan="${items.length}">${d.slice(5)} ${items[0].weekday}${isToday ? '<span class="badge badge-today">今天</span>' : ''}</td>` : ''}
          <td>${c.task}<span class="freq">${c.freq}</span></td>
          <td>${memberChip(c.memberId)}</td>
          <td>${statusBadge(c.status)}</td>
          <td>${c.status === 'done'
            ? '<span class="text-muted">已留痕</span>'
            : `<button class="btn btn-sm btn-outline" data-action="toggle-chore" data-id="${c.id}">打卡</button>`}</td>
        </tr>`).join('');
    }).join('');

    const stats = MOCK.members.map(m => {
      const assigned = state.chores.filter(c => c.memberId === m.id);
      const done = assigned.filter(c => c.status === 'done').length;
      const overdue = assigned.filter(c => c.status === 'overdue').length;
      const pct = assigned.length ? Math.round(done / assigned.length * 100) : 0;
      return { m, total: assigned.length, done, overdue, pct };
    });

    return `
      <div class="cols-2">
        <section class="card card-accent">
          <h3 class="card-title">📅 今日值日 <span class="card-title-sub">${MOCK.todayLabel}</span></h3>
          <ul class="chore-list">${todayHtml}</ul>
        </section>
        <section class="card">
          <h3 class="card-title">🔄 轮转规则</h3>
          <div class="rotation">
            ${MOCK.rotationOrder.map((id, i) => `
              <span class="rot-item">${memberChip(id)}${i < MOCK.rotationOrder.length - 1 ? '<span class="rot-arrow">→</span>' : ''}</span>`).join('')}
            <span class="rot-arrow">↻</span>
          </div>
          <p class="rule-text">「倒垃圾」每日按轮转顺序自动排班；周期任务（厨房 / 卫生间 / 客厅 / 大扫除）按周轮转。请假可发起换班，对方确认后生效并留痕。</p>
          <div class="fair-stats">
            ${stats.map(s => `
              <div class="fair-row">
                ${avatar(s.m)}
                <span class="fair-name">${s.m.name}</span>
                <div class="bar"><div class="bar-fill ${s.pct >= 60 ? 'ok' : 'warn'}" style="width:${s.pct}%"></div></div>
                <span class="fair-num">${s.done}/${s.total}${s.overdue ? ` <em class="text-red">逾期${s.overdue}</em>` : ''}</span>
              </div>`).join('')}
          </div>
          <p class="card-foot">本周完成 / 分配任务数 —— 用数据代替“感觉总是我在打扫”</p>
        </section>
      </div>

      <section class="card">
        <h3 class="card-title">本周排班表 <span class="card-title-sub">09-07 ~ 09-13</span></h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>日期</th><th>任务</th><th>负责人</th><th>状态</th><th>操作</th></tr></thead>
            <tbody>${weekRows}</tbody>
          </table>
        </div>
      </section>`;
  }

  /* ============================================================
   * 模块三：公共物品登记与提醒
   * ============================================================ */
  function renderItems() {
    const lows = lowItems();
    const alertHtml = lows.length
      ? `<div class="alert alert-warn">⚠️ <b>${lows.length} 件物品库存告急：</b>${lows.map(i => `${i.name}（剩 ${i.stock}${i.unit}）`).join('、')} —— 已推送提醒至全体室友，补货后可一键转为公共开销。</div>`
      : '<div class="alert alert-ok">✨ 所有公共物品库存充足</div>';

    const cards = state.items.map(it => {
      const level = it.stock === 0 ? 'out' : it.stock <= it.threshold ? 'low' : 'ok';
      const badge = level === 'out' ? '<span class="badge badge-danger">已用完</span>'
        : level === 'low' ? '<span class="badge badge-danger">告急</span>'
        : '<span class="badge badge-ok">充足</span>';
      const pct = Math.min(100, Math.round(it.stock / (it.threshold * 2) * 100));
      return `
        <div class="card item-card">
          <div class="item-head">
            <span class="item-icon">${it.icon}</span>
            <div class="item-title">
              <div class="item-name">${it.name}</div>
              <div class="item-loc">📍 ${it.location}</div>
            </div>
            ${badge}
          </div>
          <div class="item-stock">库存 <b class="${level === 'ok' ? '' : 'text-red'}">${it.stock}</b> ${it.unit} <span class="text-muted">· 阈值 ${it.threshold}${it.unit}</span></div>
          <div class="bar"><div class="bar-fill ${level === 'ok' ? 'ok' : level === 'low' ? 'warn' : ''}" style="width:${pct}%"></div></div>
          <div class="item-actions">
            <button class="btn btn-sm btn-outline" data-action="consume" data-id="${it.id}">取用 −1</button>
            <button class="btn btn-sm btn-primary" data-action="restock" data-id="${it.id}">补货 +5</button>
          </div>
        </div>`;
    }).join('');

    const logs = state.itemLogs.slice(0, 10).map(l => `
      <tr>
        <td class="td-date">${l.time}</td>
        <td>${l.itemName}</td>
        <td><span class="badge ${l.type === '补货' ? 'badge-ok' : 'badge-info'}">${l.type}</span></td>
        <td class="td-num ${l.qty > 0 ? 'text-green' : 'text-red'}">${l.qty > 0 ? '+' : ''}${l.qty}</td>
        <td>${memberChip(l.byId)}</td>
        <td class="td-num">${l.cost != null ? fmtA(l.cost) : '<span class="text-muted">—</span>'}</td>
        <td>${l.linked ? `<span class="tag">${l.linked}</span>` : '<span class="text-muted">—</span>'}</td>
      </tr>`).join('');

    return `
      ${alertHtml}
      <div class="item-grid">${cards}</div>
      <section class="card">
        <h3 class="card-title">最近流水 <span class="card-title-sub">补货支出可一键转为「费用AA分摊」账单</span></h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>时间</th><th>物品</th><th>类型</th><th class="td-num">数量</th><th>操作人</th><th class="td-num">金额</th><th>关联</th></tr></thead>
            <tbody>${logs}</tbody>
          </table>
        </div>
      </section>`;
  }

  /* ============================================================
   * 模块四：室友公约管理
   * ============================================================ */
  function renderPact() {
    const p = MOCK.pact;
    const pr = state.proposal;
    const forCount = Object.values(pr.votes).filter(v => v === 'for').length + (pr.myVote === 'for' ? 1 : 0);
    const againstCount = Object.values(pr.votes).filter(v => v === 'against').length + (pr.myVote === 'against' ? 1 : 0);
    const total = forCount + againstCount;
    const forPct = total ? Math.round(forCount / total * 100) : 0;

    const clauses = p.clauses.map((c, i) => `
      <li class="clause"><b>${i + 1}. ${c.title}</b><p>${c.text}</p></li>`).join('');

    const signs = p.signs.map(s => {
      const m = memberById(s.memberId);
      return `<div class="sign-card">${avatar(m, 'avatar-lg')}<div class="sign-name">${m.name}</div><div class="sign-time">✅ 已签署<br/>${s.time}</div></div>`;
    }).join('');

    const history = p.history.map(h => `
      <li class="timeline-item">
        <span class="timeline-dot"></span>
        <div><b>${h.version}</b> <span class="text-muted">· ${h.date} · ${memberById(h.byId).name} 发布</span><p>${h.note}</p></div>
      </li>`).join('');

    const voteBtns = pr.myVote
      ? `<div class="voted">已投票：<b>${pr.myVote === 'for' ? '赞成 ✔' : '反对 ✖'}</b>（截止 ${pr.deadline}）</div>`
      : `<div class="vote-btns">
          <button class="btn btn-primary" data-action="vote" data-choice="for">👍 赞成</button>
          <button class="btn btn-outline" data-action="vote" data-choice="against">👎 反对</button>
        </div>`;

    return `
      <section class="card pact-head">
        <div>
          <h2>📜 ${p.title} <span class="badge badge-info">${p.version}</span></h2>
          <p class="hero-sub">${p.effective} 生效 · 签署 ${p.signs.length}/${MOCK.members.length} · 修订需投票通过</p>
        </div>
        <button class="btn btn-outline" data-action="pact-export">导出公约 PDF（演示）</button>
      </section>

      <div class="cols-2">
        <section class="card">
          <h3 class="card-title">公约条款</h3>
          <ol class="clause-list">${clauses}</ol>
        </section>
        <div class="stack">
          <section class="card card-accent">
            <h3 class="card-title">🗳️ 进行中的修订提案 <span class="card-title-sub">截止 ${pr.deadline}</span></h3>
            <p class="proposal-title">「${pr.title}」</p>
            <p class="text-muted small">提案人：${memberById(pr.proposerId).name} · ${pr.rule}</p>
            <div class="vote-bar-wrap">
              <div class="vote-bar"><div class="vote-for" style="width:${forPct}%"></div></div>
              <div class="vote-nums"><span class="text-green">赞成 ${forCount}</span><span class="text-red">反对 ${againstCount}</span></div>
            </div>
            ${voteBtns}
          </section>
          <section class="card">
            <h3 class="card-title">签署记录 <span class="card-title-sub">人 + 时间，永久留痕</span></h3>
            <div class="sign-grid">${signs}</div>
          </section>
        </div>
      </div>

      <section class="card">
        <h3 class="card-title">修订历史</h3>
        <ul class="timeline">${history}</ul>
      </section>`;
  }

  /* ============================================================
   * 交互行为
   * ============================================================ */
  const actions = {
    'toggle-chore'(btn) {
      const c = state.chores.find(x => x.id === btn.dataset.id);
      if (!c) return;
      if (c.status === 'done') {
        c.status = c.date < MOCK.today ? 'overdue' : 'pending';
        toast('已撤销打卡');
      } else {
        c.status = 'done';
        pushActivity('✅', `${me().name} 完成值日打卡：${c.task}`);
        toast(`打卡成功 ✔「${c.task}」已记录 ${MOCK.todayLabel}`);
      }
    },
    'consume'(btn) {
      const it = state.items.find(x => x.id === btn.dataset.id);
      if (!it) return;
      if (it.stock <= 0) { toast(`「${it.name}」已用完，请先补货`, 'err'); return; }
      it.stock -= 1;
      state.itemLogs.unshift({ time: '刚刚', itemName: it.name, type: '消耗', qty: -1, byId: state.currentUserId, cost: null, linked: null });
      if (it.stock === it.threshold) {
        pushActivity('⚠️', `系统提醒：「${it.name}」已低于库存阈值，全员收到补货提醒`);
        toast(`已取用。「${it.name}」库存告急，已提醒全员补货 ⚠️`, 'warn');
      } else {
        toast(`已登记取用：${it.name} −1`);
      }
    },
    'restock'(btn) {
      const it = state.items.find(x => x.id === btn.dataset.id);
      if (!it) return;
      it.stock += 5;
      state.itemLogs.unshift({ time: '刚刚', itemName: it.name, type: '补货', qty: 5, byId: state.currentUserId, cost: null, linked: '待录入金额' });
      pushActivity('📦', `${me().name} 补货登记：${it.name} +5`);
      toast(`补货成功：${it.name} +5，可录入金额转为公共开销`);
    },
    'vote'(btn) {
      const pr = state.proposal;
      if (pr.myVote) { toast('你已经投过票了'); return; }
      pr.myVote = btn.dataset.choice;
      pushActivity('🗳️', `${me().name} 参与了公约修订提案投票`);
      toast(`投票成功：${pr.myVote === 'for' ? '赞成 👍' : '反对 👎'}`);
    },
    'settle-demo'() {
      toast('演示环境：正式版将记录结清凭证并锁定账单', 'warn');
    },
    'pact-export'() {
      toast('演示环境：正式版将导出含签署记录的 PDF', 'warn');
    },
  };

  function onSubmitExpense(e) {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const amount = parseFloat(fd.get('amount'));
    if (!amount || amount <= 0) { toast('请输入正确金额', 'err'); return; }
    const split = fd.getAll('split');
    if (!split.length) { toast('请至少选择一位分摊人', 'err'); return; }
    const category = fd.get('category');
    const note = (fd.get('note') || '').trim() || category;
    state.expenses.unshift({
      id: 'e' + (++state.idSeq),
      date: MOCK.today,
      category, note, amount,
      payerId: fd.get('payer'),
      splitAmong: split,
      status: '待确认',
    });
    pushActivity('💰', `${me().name} 记了一笔：${category}「${note}」${fmtA(amount)}（${split.length}人均摊）`);
    toast(`已记录 ${fmtA(amount)}，自动分摊给 ${split.length} 人 ✔`);
    renderRoute();
  }

  /* ============================================================
   * 路由与初始化
   * ============================================================ */
  const RENDERERS = { home: renderHome, expenses: renderExpenses, chores: renderChores, items: renderItems, pact: renderPact };

  function renderRoute() {
    $('#page-title').textContent = TITLES[state.route] || '首页';
    document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.route === state.route));
    $('#page').innerHTML = (RENDERERS[state.route] || renderHome)();
    const form = $('#expense-form');
    if (form) form.addEventListener('submit', onSubmitExpense);
    window.scrollTo({ top: 0 });
  }

  function onHashChange() {
    const r = (location.hash || '#/home').replace(/^#\//, '');
    state.route = RENDERERS[r] ? r : 'home';
    renderRoute();
  }

  function init() {
    $('#today-chip').textContent = '📅 ' + MOCK.todayLabel;

    // 主内容区事件委托（按钮 / 模块卡片）
    $('#page').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const fn = actions[btn.dataset.action];
        if (fn) fn(btn);
        if (['toggle-chore', 'consume', 'restock', 'vote'].includes(btn.dataset.action)) renderRoute();
        return;
      }
      const card = e.target.closest('[data-goto]');
      if (card) location.hash = '#/' + card.dataset.goto;
    });

    // 键盘可达性：模块卡片回车跳转
    $('#page').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const card = e.target.closest('[data-goto]');
        if (card) location.hash = '#/' + card.dataset.goto;
      }
    });

    window.addEventListener('hashchange', onHashChange);
    onHashChange();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
