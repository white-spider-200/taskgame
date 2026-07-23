
class Component extends DCLogic {
  constructor(props) {
    super(props);
    const now = Date.now();
    this.users = [
      { id: 'sara', name: 'سارة', initial: 'س', color: '#1FB6A6' },
      { id: 'ahmed', name: 'أحمد', initial: 'أ', color: '#FF9F43' },
      { id: 'noura', name: 'نورة', initial: 'ن', color: '#8B5CF6' },
      { id: 'khaled', name: 'خالد', initial: 'خ', color: '#FF6B57' },
      { id: 'mhd', name: 'محمد', initial: 'م', color: '#3D9BE9' }
    ];
    this.state = {
      view: 'tasks', filter: 'all', modalOpen: false, toast: '',
      formTitle: '', formDesc: '', formCat: 'تصميم', titleError: false,
      tick: 0,
      ratings: {},
      tasks: [
        { id: 1, title: 'تجهيز عرض العميل الجديد', desc: '', cat: 'مبيعات', owner: 'ahmed', status: 'running', startedAt: now - 3765000 },
        { id: 2, title: 'تصميم صفحة الهبوط', desc: 'مع نسخة الجوال وقسم الأسئلة الشائعة', cat: 'تصميم', owner: 'noura', status: 'review', elapsedMs: 9600000 },
        { id: 3, title: 'تحديث قائمة العملاء', desc: '', cat: 'إداري', owner: 'sara', status: 'review', elapsedMs: 2520000 },
        { id: 4, title: 'مراجعة تقرير المبيعات', desc: '', cat: 'مبيعات', owner: 'khaled', status: 'done', elapsedMs: 4500000, stars: 4, ratedBy: 'محمد' },
        { id: 5, title: 'حملة السوشيال ميديا', desc: '', cat: 'تصميم', owner: 'sara', status: 'done', elapsedMs: 3300000, stars: 5, ratedBy: 'أحمد' },
        { id: 6, title: 'إعداد اجتماع الربع', desc: '', cat: 'إداري', owner: 'mhd', status: 'done', elapsedMs: 5400000, stars: 4, ratedBy: 'سارة' }
      ],
      basePoints: { sara: 118, ahmed: 117, noura: 98, khaled: 68, mhd: 56 }
    };
  }

  componentDidMount() { this.timer = setInterval(() => this.setState(s => ({ tick: s.tick + 1 })), 1000); }
  componentWillUnmount() { clearInterval(this.timer); }

  fmt(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    const p = n => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}`;
  }
  fmtDur(ms) {
    const total = Math.floor(ms / 60000);
    const h = Math.floor(total / 60), m = total % 60;
    return h > 0 ? `${h}س ${m}د` : `${m}د`;
  }
  user(id) { return this.users.find(u => u.id === id); }
  starsStr(n) { return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }

  points(uid) {
    let pts = this.state.basePoints[uid] || 0;
    this.state.tasks.forEach(t => { if (t.owner === uid && t.status === 'done' && t.stars) pts += t.stars * 2; });
    return pts;
  }

  showToast(msg) {
    this.setState({ toast: msg });
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => this.setState({ toast: '' }), 2600);
  }

  finishTask(id) {
    this.setState(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'review', elapsedMs: Date.now() - t.startedAt } : t)
    }));
    this.showToast('🎉 أُنهيت المهمة — بانتظار تقييم زميل');
  }

  submitRating(id) {
    const stars = this.state.ratings[id] || 0;
    if (!stars) { this.showToast('اختر عدد النجوم أولًا ⭐'); return; }
    this.setState(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'done', stars, ratedBy: 'سارة' } : t)
    }));
    this.showToast(`⭐ منحت ${stars} نجوم (+${stars * 2} نقاط)`);
  }

  createTask() {
    const title = this.state.formTitle.trim();
    if (!title) { this.setState({ titleError: true }); this.showToast('اكتب عنوان المهمة أولًا ✏️'); return; }
    const t = { id: Date.now(), title, desc: this.state.formDesc.trim(), cat: this.state.formCat, owner: 'sara', status: 'running', startedAt: Date.now() };
    this.setState(s => ({ tasks: [t, ...s.tasks], modalOpen: false, formTitle: '', formDesc: '', titleError: false, filter: 'all' }));
    this.showToast('▶ بدأ المؤقّت — بالتوفيق!');
  }

  starEls(id) {
    const val = this.state.ratings[id] || 0;
    return [1, 2, 3, 4, 5].map(i =>
      React.createElement('span', {
        key: i,
        onClick: () => this.setState(s => ({ ratings: { ...s.ratings, [id]: i } })),
        style: { cursor: 'pointer', color: i <= val ? '#F2C94C' : '#E4DCCB', userSelect: 'none' }
      }, '★')
    );
  }

  renderVals() {
    const s = this.state;
    const me = 'sara';
    const labels = ['', 'يحتاج تحسين', 'مقبول', 'جيد 👍', 'ممتاز! 👏', 'أسطوري! 🤩'];

    const tab = v => s.view === v;
    const tabBg = v => tab(v) ? '#2B2118' : 'transparent';
    const tabFg = v => tab(v) ? '#FFFFFF' : '#7A6A55';
    const fSel = f => s.filter === f;
    const fBg = f => fSel(f) ? '#2B2118' : '#FFFFFF';
    const fFg = f => fSel(f) ? '#FFFFFF' : '#7A6A55';
    const fBr = f => fSel(f) ? '#2B2118' : '#FFE3B3';

    const tasks = s.tasks.filter(t => {
      if (s.filter === 'run') return t.status === 'running';
      if (s.filter === 'rev') return t.status === 'review';
      if (s.filter === 'done') return t.status === 'done';
      return true;
    });

    const visibleTasks = tasks.map(t => {
      const u = this.user(t.owner);
      const isMine = t.owner === me;
      const isReviewMine = t.status === 'review' && !isMine;
      let meta = u.name;
      if (t.status === 'running') meta = `${u.name} · جارٍ التنفيذ`;
      if (t.status === 'review') meta = `${u.name} · أنهاها في ${this.fmtDur(t.elapsedMs)}`;
      if (t.status === 'done') meta = `${u.name} · ${this.fmtDur(t.elapsedMs)} · قيّمها ${t.ratedBy}`;
      return {
        title: t.title, desc: t.desc, meta,
        initial: u.initial, color: u.color,
        border: isReviewMine ? '#C9B8F5' : '#FFE3B3',
        isRunning: t.status === 'running',
        canFinish: t.status === 'running' && isMine,
        isDone: t.status === 'done',
        isReviewMine,
        isReviewOthers: t.status === 'review' && isMine,
        timer: t.status === 'running' ? this.fmt(Date.now() - t.startedAt) : '',
        doneStars: t.stars ? this.starsStr(t.stars) : '',
        points: t.stars ? t.stars * 2 : 0,
        starEls: this.starEls(t.id),
        ratingLabel: labels[s.ratings[t.id] || 0] || '',
        submitBg: (s.ratings[t.id] || 0) ? '#8B5CF6' : '#C9B8F5',
        onFinish: () => this.finishTask(t.id),
        onSubmit: () => this.submitRating(t.id)
      };
    });

    const doneTasks = s.tasks.filter(t => t.status === 'done');
    const runCount = s.tasks.filter(t => t.status === 'running').length;
    const revCount = s.tasks.filter(t => t.status === 'review').length;
    const teamAvg = doneTasks.length ? (doneTasks.reduce((a, t) => a + t.stars, 0) / doneTasks.length).toFixed(1) : '—';

    const stats = this.users.map(u => {
      const mine = doneTasks.filter(t => t.owner === u.id);
      const avg = mine.length ? (mine.reduce((a, t) => a + t.stars, 0) / mine.length).toFixed(1) : '—';
      const avgTime = mine.length ? mine.reduce((a, t) => a + t.elapsedMs, 0) / mine.length : Infinity;
      return { ...u, count: mine.length, avg, avgTime, pts: this.points(u.id) };
    });
    const maxCount = Math.max(1, ...stats.map(m => m.count));
    const memberStats = stats.slice().sort((a, b) => b.count - a.count).map(m => ({ ...m, pct: Math.round(m.count / maxCount * 100) + '%' }));
    const fastest = stats.filter(m => m.count > 0).sort((a, b) => a.avgTime - b.avgTime)[0] || stats[0];

    const sorted = stats.slice().sort((a, b) => b.pts - a.pts);
    const rankColors = ['#F2C94C', '#C9C0B4', '#D8956B'];
    const miniLeaders = sorted.slice(0, 3).map((m, i) => ({ rank: i + 1, name: m.id === me ? 'أنت' : m.name, pts: m.pts, rankColor: rankColors[i] }));
    const leaderRows = sorted.map((m, i) => ({
      rank: i + 1, name: m.id === me ? `${m.name} (أنت)` : m.name, initial: m.initial, color: m.color,
      tasks: m.count, avg: m.avg, pts: m.pts, bg: m.id === me ? '#FFFBF0' : '#FFFFFF'
    }));

    const myDoneTasks = doneTasks.filter(t => t.owner === me);
    const myAvg = myDoneTasks.length ? (myDoneTasks.reduce((a, t) => a + t.stars, 0) / myDoneTasks.length).toFixed(1) : '—';
    const myTime = myDoneTasks.length ? this.fmtDur(myDoneTasks.reduce((a, t) => a + t.elapsedMs, 0) / myDoneTasks.length) : '—';

    const cats = ['تصميم', 'مبيعات', 'تطوير', 'إداري'];
    const catIcons = { 'تصميم': '🎨', 'مبيعات': '📈', 'تطوير': '💻', 'إداري': '📝' };
    const categoryChips = cats.map(c => {
      const sel = s.formCat === c;
      return React.createElement('div', {
        key: c,
        onClick: () => this.setState({ formCat: c }),
        style: {
          padding: '7px 16px', borderRadius: '999px', cursor: 'pointer', fontWeight: sel ? 700 : 600, fontSize: '14px',
          background: sel ? '#FF6B57' : '#FFF7EC', color: sel ? '#FFF' : '#7A6A55',
          border: sel ? '2px solid #FF6B57' : '2px solid #FFE3B3',
          boxShadow: sel ? '0 3px 0 #E04B38' : 'none'
        }
      }, `${catIcons[c]} ${c}`);
    });

    return {
      showTasks: s.view === 'tasks', showDash: s.view === 'dash', showLeaders: s.view === 'leaders', showProfile: s.view === 'profile',
      goTasks: () => this.setState({ view: 'tasks' }),
      goDash: () => this.setState({ view: 'dash' }),
      goLeaders: () => this.setState({ view: 'leaders' }),
      goProfile: () => this.setState({ view: 'profile' }),
      tabTasksBg: tabBg('tasks'), tabTasksFg: tabFg('tasks'),
      tabDashBg: tabBg('dash'), tabDashFg: tabFg('dash'),
      tabLeadersBg: tabBg('leaders'), tabLeadersFg: tabFg('leaders'),
      tabProfileBg: tabBg('profile'), tabProfileFg: tabFg('profile'),
      filterAll: () => this.setState({ filter: 'all' }), filterRun: () => this.setState({ filter: 'run' }),
      filterRev: () => this.setState({ filter: 'rev' }), filterDone: () => this.setState({ filter: 'done' }),
      fAllBg: fBg('all'), fAllFg: fFg('all'), fAllBr: fBr('all'),
      fRunBg: fBg('run'), fRunFg: fFg('run'), fRunBr: fBr('run'),
      fRevBg: fBg('rev'), fRevFg: fFg('rev'), fRevBr: fBr('rev'),
      fDoneBg: fBg('done'), fDoneFg: fFg('done'), fDoneBr: fBr('done'),
      visibleTasks, emptyList: visibleTasks.length === 0,
      toast: s.toast,
      myPoints: this.points(me),
      doneCount: doneTasks.length, totalCount: s.tasks.length,
      donePct: Math.round(doneTasks.length / Math.max(1, s.tasks.length) * 100) + '%',
      runCount, revCount, teamAvg,
      memberStats, miniLeaders, leaderRows,
      fastName: fastest.name, fastInitial: fastest.initial, fastColor: fastest.color,
      fastTime: fastest.avgTime !== Infinity ? this.fmtDur(fastest.avgTime) : '—',
      p1: sorted[0], p2: sorted[1], p3: sorted[2],
      myDone: myDoneTasks.length, myAvg, myTime,
      myTasks: myDoneTasks.map(t => ({ title: t.title, time: this.fmtDur(t.elapsedMs), stars: this.starsStr(t.stars) })),
      modalOpen: s.modalOpen,
      openModal: () => this.setState({ modalOpen: true }),
      closeModal: () => this.setState({ modalOpen: false, titleError: false }),
      stopProp: e => e.stopPropagation(),
      formTitle: s.formTitle, formDesc: s.formDesc,
      onFormTitle: e => this.setState({ formTitle: e.target.value, titleError: false }),
      onFormDesc: e => this.setState({ formDesc: e.target.value }),
      titleBorder: s.titleError ? '#FF6B57' : '#FFE3B3',
      categoryChips,
      createTask: () => this.createTask()
    };
  }
}
