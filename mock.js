/* ============================================================
 * 合租生活管家 - Mock 数据
 * 演示用静态数据，后续接入真实 API 时替换本文件即可
 * ============================================================ */
const MOCK = {
  today: '2026-09-12',
  todayLabel: '2026-09-12 周六',
  currentUserId: 'm1',

  house: { name: '阳光里3栋1202', memberCount: 4, inviteCode: 'SUN1202' },

  members: [
    { id: 'm1', name: '小北', avatar: '🐻', role: '管理员', color: '#f59e0b' },
    { id: 'm2', name: '阿澈', avatar: '🐱', role: '成员',   color: '#3b82f6' },
    { id: 'm3', name: '柚子', avatar: '🍊', role: '成员',   color: '#10b981' },
    { id: 'm4', name: '老王', avatar: '🐼', role: '成员',   color: '#8b5cf6' },
  ],

  /* ---------------- 模块一：费用 AA 分摊 ---------------- */
  expenseCategories: ['房租', '水电燃气', '网费', '公共用品', '其他'],
  expenses: [
    { id: 'e1', date: '2026-09-01', category: '房租',     note: '九月房租（整租四室）',      amount: 4800,   payerId: 'm1', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '已确认' },
    { id: 'e2', date: '2026-09-03', category: '水电燃气', note: '八月水电燃气费',            amount: 216.40, payerId: 'm4', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '已确认' },
    { id: 'e3', date: '2026-09-05', category: '网费',     note: '宽带月费',                  amount: 129,    payerId: 'm2', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '已确认' },
    { id: 'e4', date: '2026-09-07', category: '公共用品', note: '抽纸x3、垃圾袋x2',          amount: 45.90,  payerId: 'm3', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '已确认', tag: '补货转化' },
    { id: 'e5', date: '2026-09-08', category: '其他',     note: '次卧空调维修费',            amount: 86,     payerId: 'm4', splitAmong: ['m1', 'm4'],             status: '待确认', tag: '部分人分摊' },
    { id: 'e6', date: '2026-09-09', category: '公共用品', note: '洗衣液、洁厕灵',            amount: 68,     payerId: 'm1', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '已确认', tag: '补货转化' },
    { id: 'e7', date: '2026-09-11', category: '公共用品', note: '厨房纸巾、洗洁精',          amount: 32.50,  payerId: 'm3', splitAmong: ['m1', 'm2', 'm3', 'm4'], status: '待确认' },
  ],

  /* ---------------- 模块二：清洁值日排班 ---------------- */
  rotationOrder: ['m2', 'm3', 'm4', 'm1'], // 阿澈 → 柚子 → 老王 → 小北
  chores: [
    { id: 'c1',  date: '2026-09-07', weekday: '周一', task: '倒垃圾',         freq: '每日',       memberId: 'm2', status: 'done' },
    { id: 'c2',  date: '2026-09-07', weekday: '周一', task: '厨房清洁',       freq: '每周一 / 四', memberId: 'm3', status: 'done' },
    { id: 'c3',  date: '2026-09-08', weekday: '周二', task: '倒垃圾',         freq: '每日',       memberId: 'm3', status: 'done' },
    { id: 'c4',  date: '2026-09-09', weekday: '周三', task: '倒垃圾',         freq: '每日',       memberId: 'm4', status: 'done' },
    { id: 'c5',  date: '2026-09-09', weekday: '周三', task: '卫生间清洁',     freq: '每周三',     memberId: 'm1', status: 'done' },
    { id: 'c6',  date: '2026-09-10', weekday: '周四', task: '倒垃圾',         freq: '每日',       memberId: 'm1', status: 'done' },
    { id: 'c7',  date: '2026-09-10', weekday: '周四', task: '厨房清洁',       freq: '每周一 / 四', memberId: 'm2', status: 'overdue' },
    { id: 'c8',  date: '2026-09-11', weekday: '周五', task: '倒垃圾',         freq: '每日',       memberId: 'm2', status: 'done' },
    { id: 'c9',  date: '2026-09-12', weekday: '周六', task: '倒垃圾',         freq: '每日',       memberId: 'm3', status: 'pending' },
    { id: 'c10', date: '2026-09-12', weekday: '周六', task: '客厅吸尘',       freq: '每周六',     memberId: 'm4', status: 'pending' },
    { id: 'c11', date: '2026-09-12', weekday: '周六', task: '公共区域大扫除', freq: '每两周',     memberId: 'm1', status: 'pending' },
    { id: 'c12', date: '2026-09-13', weekday: '周日', task: '倒垃圾',         freq: '每日',       memberId: 'm4', status: 'pending' },
    { id: 'c13', date: '2026-09-13', weekday: '周日', task: '厨房清洁',       freq: '每周一 / 四', memberId: 'm1', status: 'pending' },
  ],

  /* ---------------- 模块三：公共物品登记与提醒 ---------------- */
  items: [
    { id: 'i1', icon: '🧻', name: '抽纸',       stock: 1, threshold: 2, unit: '提', location: '卫生间' },
    { id: 'i2', icon: '🗑️', name: '垃圾袋',     stock: 2, threshold: 3, unit: '卷', location: '厨房' },
    { id: 'i3', icon: '🧴', name: '洗衣液',     stock: 6, threshold: 2, unit: '瓶', location: '阳台' },
    { id: 'i4', icon: '🫧', name: '洗洁精',     stock: 3, threshold: 2, unit: '瓶', location: '厨房' },
    { id: 'i5', icon: '🚽', name: '洁厕灵',     stock: 1, threshold: 1, unit: '瓶', location: '卫生间' },
    { id: 'i6', icon: '🍚', name: '大米(5kg)',  stock: 4, threshold: 2, unit: '袋', location: '厨房' },
    { id: 'i7', icon: '🫒', name: '食用油',     stock: 2, threshold: 2, unit: '瓶', location: '厨房' },
    { id: 'i8', icon: '🧼', name: '洗手液',     stock: 4, threshold: 2, unit: '瓶', location: '卫生间' },
  ],
  itemLogs: [
    { time: '09-11 21:40', itemName: '垃圾袋', type: '消耗', qty: -1, byId: 'm4', cost: null,  linked: null },
    { time: '09-11 18:02', itemName: '抽纸',   type: '消耗', qty: -1, byId: 'm2', cost: null,  linked: null },
    { time: '09-10 10:15', itemName: '洗衣液', type: '补货', qty: 1,  byId: 'm1', cost: 36.90, linked: '已转公共开销' },
    { time: '09-09 08:47', itemName: '抽纸',   type: '消耗', qty: -1, byId: 'm3', cost: null,  linked: null },
    { time: '09-07 20:31', itemName: '抽纸',   type: '补货', qty: 3,  byId: 'm3', cost: 45.90, linked: '已转公共开销' },
    { time: '09-06 12:00', itemName: '大米',   type: '补货', qty: 2,  byId: 'm4', cost: null,  linked: null },
  ],

  /* ---------------- 模块四：室友公约管理 ---------------- */
  pact: {
    title: '1202 室友公约',
    version: 'v2.1',
    effective: '2026-08-20',
    clauses: [
      { title: '安静时间', text: '每日 23:00 至次日 7:00 为安静时间，请调低音量、轻声关门；周末可延后至 23:30（提案投票中）。' },
      { title: '访客留宿', text: '访客留宿需提前 24 小时在群内告知全体室友，单人每月连续留宿不超过 2 晚。' },
      { title: '公共卫生', text: '谁弄脏谁清理；使用厨房后当日完成灶台与水池清洁；值日任务按排班表执行并打卡。' },
      { title: '宠物',     text: '现有宠物：无。新增饲养宠物需经全体室友一致同意。' },
      { title: '吸烟',     text: '室内（含阳台、卫生间）全面禁烟，吸烟请至楼下指定区域。' },
      { title: '费用结算', text: '公共开销发起分摊后 3 日内完成结算；有异议先申诉、后付款，不无故拖延。' },
      { title: '快递外卖', text: '外卖快递及时自取，公共快递放置客厅置物架；公共物品到货由收件人登记入库。' },
      { title: '公共物品', text: '个人物品请自行标记；公共物品用至低库存时标记提醒，补货支出可一键转为公共开销均摊。' },
    ],
    signs: [
      { memberId: 'm1', time: '2026-08-20 21:12' },
      { memberId: 'm2', time: '2026-08-20 21:40' },
      { memberId: 'm3', time: '2026-08-21 09:03' },
      { memberId: 'm4', time: '2026-08-21 20:55' },
    ],
    history: [
      { version: 'v2.1', date: '2026-08-20', note: '修订「安静时间」：明确轻声关门要求', byId: 'm1' },
      { version: 'v2.0', date: '2026-06-15', note: '新增「宠物」「吸烟」条款，投票 4/4 通过', byId: 'm3' },
      { version: 'v1.0', date: '2026-03-01', note: '初始版本发布，全员签署', byId: 'm1' },
    ],
  },
  proposal: {
    title: '周末安静时间延后至 24:00（放映电影场景）',
    proposerId: 'm2',
    deadline: '2026-09-14',
    rule: '过半数（≥3 票赞成）通过后并入公约 v2.2',
    votes: { m2: 'for', m3: 'for', m4: 'against' }, // 已有投票；小北(m1)未投
  },

  /* ---------------- 首页动态 ---------------- */
  activities: [
    { icon: '⚠️', text: '系统提醒：抽纸、垃圾袋、洁厕灵、食用油 共 4 件物品库存告急', time: '今天 08:00' },
    { icon: '🧹', text: '阿澈 的值日任务「厨房清洁」已逾期，请补做并打卡', time: '昨天 22:00' },
    { icon: '💰', text: '老王 发起分摊：次卧空调维修费 ¥86.00（小北、老王 两人均摊）', time: '昨天 19:32' },
    { icon: '🧻', text: '柚子 补货登记：抽纸 +3 提，¥45.90 已转为公共开销', time: '09-07 20:31' },
    { icon: '✅', text: '小北 完成值日打卡：卫生间清洁', time: '09-09 20:14' },
    { icon: '📜', text: '阿澈 发起公约修订提案，投票截止 09-14', time: '09-08 15:20' },
  ],
};
