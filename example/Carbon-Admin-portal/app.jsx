/* global React, ReactDOM, ToastProvider, CustomerList, CustomerWizard, CustomerDetail, OrderList, OrderWizard, OrderDetail, Settings, Icon, useToast, SEED_CUSTOMERS, SEED_ORDERS, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect, UserMenu, SignOutModal, LockScreen, UIcon, ProfilePage, AccountSecurityPage, WorkspacesPage, ActivityPage, HelpPage, FeedbackPage, AuditLogPage, DeviceModelList, DeviceModelForm, SEED_DEVICE_MODELS */
const { useState, useEffect, useRef } = React;

const CURRENT_USER = { name: 'Jordan Diaz', email: 'admin@toms', initials: 'JD', org: 'TOMS · Carbon · Production' };

const SidebarItem = ({ icon, label, active, onClick, badge, children, expanded, onToggle, hasActiveChild }) => {
  const hasChildren = !!children;
  const showOpen = hasChildren && (expanded || hasActiveChild);
  const handleRowClick = () => {
    if (hasChildren) {
      if (onClick) onClick();
      if (!expanded && !hasActiveChild) onToggle && onToggle();
    } else if (onClick) {
      onClick();
    }
  };
  return (
    <>
      <div
        className={`side__item ${active ? 'is-active' : ''} ${hasChildren ? 'is-parent' : ''} ${showOpen ? 'is-open' : ''}`}
        onClick={handleRowClick}>
        <Icon name={icon} size={15} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{badge}</span>}
        {hasChildren && (
          <span className={`side__chev ${showOpen ? 'is-open' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}>
            <Icon name="chevR" size={12} />
          </span>
        )}
      </div>
      {showOpen && (
        <div className="side__sublist">{children}</div>
      )}
    </>
  );
};

const SidebarSub = ({ label, active, onClick }) => (
  <div className={`side__sub ${active ? 'is-active' : ''}`} onClick={onClick}>
    <span>{label}</span>
  </div>
);


const App = () => {
  // Persistent tweak state (via tweaks-panel helper)
  const [t, setTweak] = useTweaks(window.__CARBON_TWEAKS__ || { density: 'comfortable', demoState: 'list', maskSensitive: true, theme: 'light', lang: 'en' });

  // Apply theme to <html data-theme>; 'system' follows OS
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      let theme = t.theme || 'light';
      if (theme === 'system') {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', theme);
    };
    applyTheme();
    if (t.theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [t.theme]);

  // Lang + user menu state
  useEffect(() => { document.documentElement.setAttribute('data-lang', t.lang || 'en'); }, [t.lang]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const userCardRef = useRef(null);
  const toast = useToast();

  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [models, setModels] = useState(SEED_DEVICE_MODELS);
  const [route, setRoute] = useState({ name: 'list' });
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ settings: false, orders: false, customers: false, devices: true });
  const toggleMenu = (key) => setExpandedMenus((m) => ({ ...m, [key]: !m[key] }));

  // Global ⌘K / Ctrl+K and ⌘L shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen((v) => !v);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setLocked(true);
      } else if (e.key === 'Escape' && cmdkOpen) {
        setCmdkOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmdkOpen]);

  // Apply demoState tweak as a one-way teleport
  const [lastDemoState, setLastDemoState] = useState(t.demoState);
  useEffect(() => {
    if (t.demoState !== lastDemoState) {
      setLastDemoState(t.demoState);
      if (t.demoState === 'List') setRoute({ name: 'list' });
      if (t.demoState === 'Wizard') setRoute({ name: 'new' });
      if (t.demoState === 'Detail') setRoute({ name: 'detail', id: customers[0]?.id });
      if (t.demoState === 'Settings') setRoute({ name: 'settings' });
      if (t.demoState === 'Orders') setRoute({ name: 'orders' });
      if (t.demoState === 'New order') setRoute({ name: 'order-new' });
      if (t.demoState === 'Order detail') setRoute({ name: 'order', id: orders[0]?.id });
      if (t.demoState === 'Profile') setRoute({ name: 'profile' });
      if (t.demoState === 'Account') setRoute({ name: 'account' });
      if (t.demoState === 'Workspaces') setRoute({ name: 'workspaces' });
      if (t.demoState === 'Activity') setRoute({ name: 'activity' });
      if (t.demoState === 'Help') setRoute({ name: 'help' });
      if (t.demoState === 'Feedback') setRoute({ name: 'feedback' });
      if (t.demoState === 'Audit log') setRoute({ name: 'audit' });
      if (t.demoState === 'Device models') setRoute({ name: 'models' });
      if (t.demoState === 'New model') setRoute({ name: 'model-new' });
      if (t.demoState === 'Edit model') setRoute({ name: 'model-edit', id: models[0]?.id });
    }
  }, [t.demoState, lastDemoState, customers, orders, models]);

  const current = route.name === 'detail' ? customers.find((c) => c.id === route.id) : null;
  const currentOrder = route.name === 'order' ? orders.find((o) => o.id === route.id) : null;
  const currentModel = route.name === 'model-edit' ? models.find((m) => m.id === route.id) : null;

  const update = (next) => setCustomers((cs) => cs.map((c) => c.id === next.id ? next : c));
  const add = (c) => setCustomers((cs) => [c, ...cs]);

  const updateOrder = (next) => setOrders((os) => os.map((o) => o.id === next.id ? next : o));
  const addOrder = (o) => setOrders((os) => [o, ...os]);

  const updateModel = (next) => setModels((ms) => ms.map((m) => m.id === next.id ? next : m));
  const addModel = (m) => setModels((ms) => [m, ...ms]);
  const removeModel = (id) => setModels((ms) => ms.filter((m) => m.id !== id));

  const goList = () => setRoute({ name: 'list' });
  const goNew = () => setRoute({ name: 'new' });
  const goDetail = (id) => setRoute({ name: 'detail', id });
  const goSettings = () => setRoute({ name: 'settings', tab: 'roles' });
  const goOrders = () => setRoute({ name: 'orders' });
  const goNewOrder = () => setRoute({ name: 'order-new' });
  const goOrder = (id) => setRoute({ name: 'order', id });
  const goProfile = () => setRoute({ name: 'profile' });
  const goAccount = () => setRoute({ name: 'account' });
  const goWorkspaces = () => setRoute({ name: 'workspaces' });
  const goActivity = () => setRoute({ name: 'activity' });
  const goHelp = () => setRoute({ name: 'help' });
  const goFeedback = () => setRoute({ name: 'feedback' });
  const goAudit = () => setRoute({ name: 'audit' });
  const goModels = () => setRoute({ name: 'models' });
  const goNewModel = () => setRoute({ name: 'model-new' });
  const goEditModel = (id) => setRoute({ name: 'model-edit', id });

  const userPageRoutes = ['profile','account','workspaces','activity','help','feedback'];
  const userCrumb = {
    profile: 'My profile', account: 'Account & security', workspaces: 'Switch workspace',
    activity: 'My activity', help: 'Help center', feedback: 'Send feedback'
  };

  const inOrdersSection = route.name === 'orders' || route.name === 'order-new' || route.name === 'order';
  const inModelsSection = route.name === 'models' || route.name === 'model-new' || route.name === 'model-edit';
  const inDevicesSection = inOrdersSection || inModelsSection;

  return (
    <div className="app" data-density={t.density}>
      <aside className="side">
        <div className="side__brand">
          <div className="side__logo"><img src="assets/toms-logo.png" alt="TOMS" /></div>
          <div className="side__name">TOMS<small>Carbon · Admin</small></div>
        </div>

        <div className="side__sectionlabel">Manage</div>
        <nav className="side__nav">
          <SidebarItem icon="users" label="Customers" active={route.name === 'list' || route.name === 'new' || route.name === 'detail'} onClick={goList} />
          <SidebarItem
            icon="package"
            label="Devices"
            active={false}
            hasActiveChild={inDevicesSection}
            expanded={expandedMenus.devices}
            onToggle={() => toggleMenu('devices')}>
            <SidebarSub label="Sample Orders" active={inOrdersSection} onClick={goOrders} />
            <SidebarSub label="Device Models" active={inModelsSection} onClick={goModels} />
          </SidebarItem>
        </nav>

        <div className="side__sectionlabel">System</div>
        <nav className="side__nav">
          <SidebarItem icon="audit" label="Audit log" active={route.name === 'audit'} onClick={goAudit} />
          <SidebarItem icon="settings" label="Settings" active={route.name === 'settings'} onClick={goSettings} />
        </nav>

        <button
          ref={userCardRef}
          type="button"
          className={`side__footer side__user ${menuOpen ? 'is-open' : ''} ${userPageRoutes.includes(route.name) ? 'is-active' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}>
          <div className="side__avatar">{CURRENT_USER.initials}</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <div style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{CURRENT_USER.name}</div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{CURRENT_USER.email}</div>
          </div>
          <span className="side__user__chev"><Icon name="chevR" size={12} /></span>
        </button>

        <UserMenu
          anchorRef={userCardRef}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={CURRENT_USER}
          theme={t.theme || 'light'}
          lang={t.lang || 'en'}
          onTheme={(v) => { setTweak('theme', v); toast({ kind: 'success', title: `Theme set to ${v}` }); }}
          onLang={(v) => { setTweak('lang', v); toast({ kind: 'success', title: v === 'zh' ? '已切换为中文' : 'Switched to English' }); }}
          onGoProfile={goProfile}
          onGoAccount={goAccount}
          onGoWorkspaces={goWorkspaces}
          onGoActivity={goActivity}
          onGoHelp={goHelp}
          onGoFeedback={goFeedback}
          onLock={() => setLocked(true)}
          onSignOut={() => setSignOutOpen(true)}
        />
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumbs">
            {userPageRoutes.includes(route.name) ?
            <>
                <a onClick={() => setMenuOpen(true)}>{CURRENT_USER.name}</a>
                <span className="crumbs__sep">/</span>
                <span className="crumbs__current">{userCrumb[route.name]}</span>
              </> :
            route.name === 'settings' ?
            <>
                <a onClick={goSettings}>Settings</a>
                <span className="crumbs__sep">/</span>
                <span className="crumbs__current">Roles & Permissions</span>
              </> :
            route.name === 'audit' ?
            <>
                <a onClick={goAudit}>System</a>
                <span className="crumbs__sep">/</span>
                <span className="crumbs__current">Audit log</span>
              </> :
            inModelsSection ?
            <>
                <a onClick={goModels}>Devices</a>
                <span className="crumbs__sep">/</span>
                {route.name === 'models' ? (
                  <span className="crumbs__current">Device Models</span>
                ) : (
                  <>
                    <a onClick={goModels}>Device Models</a>
                    <span className="crumbs__sep">/</span>
                    <span className="crumbs__current">{route.name === 'model-new' ? 'New' : (currentModel ? currentModel.name : 'Edit')}</span>
                  </>
                )}
              </> :
            inOrdersSection ?
            <>
                <a onClick={goOrders}>Devices</a>
                <span className="crumbs__sep">/</span>
                <a onClick={goOrders}>Sample Orders</a>
                {route.name === 'order-new' && <><span className="crumbs__sep">/</span><span className="crumbs__current">New</span></>}
                {route.name === 'order' && currentOrder && <><span className="crumbs__sep">/</span><span className="crumbs__current" style={{ fontFamily: 'var(--font-family-mono)' }}>{currentOrder.number}</span></>}
              </> :

            <>
                <a onClick={goList}>Customers</a>
                {route.name === 'new' && <><span className="crumbs__sep">/</span><span className="crumbs__current">New</span></>}
                {route.name === 'detail' && current && <><span className="crumbs__sep">/</span><span className="crumbs__current">{current.name}</span></>}
              </>
            }
          </div>
          <div className="topbar__spacer" />
          <button type="button" className="topbar__search" onClick={() => setCmdkOpen(true)}>
            <Icon name="search" size={13} />
            <span>Search…</span>
            <kbd>⌘K</kbd>
          </button>
          <button className="iconbtn"><Icon name="bell" size={15} /></button>
        </header>

        <div className="content">
          {route.name === 'list' &&
          <CustomerList customers={customers} onOpen={goDetail} onNew={goNew} />
          }
          {route.name === 'new' &&
          <CustomerWizard onCancel={goList} onComplete={(c) => {add(c);goDetail(c.id);}} />
          }
          {route.name === 'detail' && current &&
          <CustomerDetail customer={current} orders={orders} onBack={goList} onUpdate={update} onOpenOrder={(id) => id === '__all__' ? goOrders() : goOrder(id)} onNewOrder={() => goNewOrder()} maskOn={t.maskSensitive} setMaskOn={(v) => setTweak('maskSensitive', v)} />
          }
          {route.name === 'detail' && !current &&
          <div className="page"><div className="empty">Customer not found. <a onClick={goList} style={{ color: 'var(--color-primary-500)', cursor: 'pointer' }}>Back to list</a></div></div>
          }
          {route.name === 'settings' && <Settings />}
          {route.name === 'orders' &&
          <OrderList orders={orders} onOpen={goOrder} onNew={goNewOrder} />
          }
          {route.name === 'order-new' &&
          <OrderWizard customers={customers} onCancel={goOrders} onComplete={(o) => {addOrder(o);goOrder(o.id);}} />
          }
          {route.name === 'order' && currentOrder &&
          <OrderDetail order={currentOrder} onBack={goOrders} onUpdate={updateOrder} />
          }
          {route.name === 'order' && !currentOrder &&
          <div className="page"><div className="empty">Order not found. <a onClick={goOrders} style={{ color: 'var(--color-primary-500)', cursor: 'pointer' }}>Back to orders</a></div></div>
          }
          {route.name === 'profile' && <ProfilePage user={CURRENT_USER} />}
          {route.name === 'account' && <AccountSecurityPage />}
          {route.name === 'workspaces' && <WorkspacesPage />}
          {route.name === 'activity' && <ActivityPage />}
          {route.name === 'help' && <HelpPage onOpenShortcuts={() => setCmdkOpen(true)} />}
          {route.name === 'feedback' && <FeedbackPage />}
          {route.name === 'audit' && <AuditLogPage />}
          {route.name === 'models' &&
          <DeviceModelList
            models={models}
            onNew={goNewModel}
            onEdit={goEditModel}
            onDelete={(m) => { if (window.confirm(`Delete ${m.name}? This cannot be undone.`)) { removeModel(m.id); toast({ kind: 'success', title: `${m.name} deleted` }); } }} />
          }
          {route.name === 'model-new' &&
          <DeviceModelForm onCancel={goModels} onSave={(m) => { addModel(m); goModels(); }} />
          }
          {route.name === 'model-edit' && currentModel &&
          <DeviceModelForm initial={currentModel} onCancel={goModels} onSave={(m) => { updateModel(m); goModels(); }} />
          }
          {route.name === 'model-edit' && !currentModel &&
          <div className="page"><div className="empty">Device model not found. <a onClick={goModels} style={{ color: 'var(--color-primary-500)', cursor: 'pointer' }}>Back to models</a></div></div>
          }
        </div>
      </main>

      {cmdkOpen && (
        <CommandPalette
          customers={customers}
          orders={orders}
          onClose={() => setCmdkOpen(false)}
          onPick={(kind, id) => {
            setCmdkOpen(false);
            if (kind === 'customer') goDetail(id);
            else if (kind === 'order') goOrder(id);
            else if (kind === 'route') {
              if (id === 'list') goList();
              else if (id === 'orders') goOrders();
              else if (id === 'new') goNew();
              else if (id === 'order-new') goNewOrder();
              else if (id === 'settings') goSettings();
            }
          }}
        />
      )}

      <SignOutModal
        open={signOutOpen}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => { setSignOutOpen(false); setSignedOut(true); }}
      />
      <LockScreen open={locked} user={CURRENT_USER} onUnlock={() => setLocked(false)} />
      {signedOut && (
        <div className="signedout">
          <div className="signedout__card">
            <div className="signedout__logo"><img src="assets/toms-logo.png" alt="TOMS" /></div>
            <h2 className="signedout__title">You've been signed out</h2>
            <p className="signedout__sub">Your session ended at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Sign back in to continue.</p>
            <button type="button" className="tds-btn tds-btn--primary tds-btn--md" onClick={() => setSignedOut(false)}>Back to sign in</button>
            <div className="signedout__hint">Demo only — click to return to the workspace.</div>
          </div>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Demo state" />
        <TweakSelect label="Screen" value={t.demoState}
        options={['List', 'Wizard', 'Detail', 'Settings', 'Orders', 'New order', 'Order detail', 'Device models', 'New model', 'Edit model', 'Profile', 'Account', 'Workspaces', 'Activity', 'Help', 'Feedback', 'Audit log']}
        onChange={(v) => setTweak('demoState', v)} />

        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme || 'light'}
        options={['light', 'dark', 'system']}
        onChange={(v) => setTweak('theme', v)} />
        <TweakRadio label="Language" value={t.lang || 'en'}
        options={['en', 'zh']}
        onChange={(v) => setTweak('lang', v)} />

        <TweakSection label="Display" />
        <TweakRadio label="Density" value={t.density}
        options={['comfortable', 'compact']}
        onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Mask sensitive data" value={t.maskSensitive}
        onChange={(v) => setTweak('maskSensitive', v)} />
      </TweaksPanel>

      {/* density styles */}
      <style>{`
        [data-density="compact"] .page { padding: 18px 24px 48px; }
        [data-density="compact"] .stats { gap: 10px; margin-bottom: 14px; }
        [data-density="compact"] .stat { padding: 12px 14px; }
        [data-density="compact"] .stat__val { font-size: 20px; }
        [data-density="compact"] .info-card__body { padding: 14px 16px; }
        [data-density="compact"] .info-card__head { padding: 10px 16px; }
        [data-density="compact"] .crow { padding: 10px 14px; }
        [data-density="compact"] .det-header { padding: 16px 18px; }
        [data-density="compact"] .tds-table tbody td { padding: 8px 14px; }
        [data-density="compact"] .stepper { padding: 12px 16px; margin-bottom: 18px; }
      `}</style>
    </div>);

};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);