/* global React, Btn, Input, Icon, Badge, ContractBadge, CompanyLogo, fmtDate */
const { useState, useMemo } = React;

const STATUS_TONE_MAP = {
  Active:     'success',
  Onboarding: 'info',
  Suspended:  'error',
};

const CustomerList = ({ customers, onOpen, onNew }) => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [contract, setContract] = useState('All');
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let rows = customers;
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter(c => c.name.toLowerCase().includes(s) || c.address.toLowerCase().includes(s) || (c.license || '').toLowerCase().includes(s));
    }
    if (status !== 'All') rows = rows.filter(c => c.status === status);
    if (contract !== 'All') rows = rows.filter(c => c.contracts.some(k => k.kind === contract));
    rows = [...rows].sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy];
      const r = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === 'asc' ? r : -r;
    });
    return rows;
  }, [customers, q, status, contract, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const sortCell = (key, label) => (
    <span className="tds-table__sort" onClick={() => {
      if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
      else { setSortBy(key); setSortDir('asc'); }
    }}>
      {label}
      <span style={{ opacity: sortBy === key ? 1 : 0.3, fontSize: 9 }}>{sortBy === key && sortDir === 'asc' ? '▲' : '▼'}</span>
    </span>
  );

  return (
    <div className="page">
      <div className="page__head">
        <div>
          <h1 className="page__title">Customers</h1>
          <p className="page__sub">Maintain customer companies, their contracts and operators.</p>
        </div>
        <div className="page__actions">
          <Btn variant="secondary" icon="download" size="md">Export</Btn>
          <Btn variant="primary" icon="plus" size="md" onClick={onNew}>New customer</Btn>
        </div>
      </div>

      <div className="stats">
        <button type="button" className={`stat is-clickable ${status === 'All' && contract === 'All' && !q ? 'is-active' : ''}`} onClick={() => { setStatus('All'); setContract('All'); setPendingOnly(false); setQ(''); setPage(1); }}>
          <div className="stat__label">Total customers</div>
          <div className="stat__val">{customers.length}</div>
          <div className="stat__delta stat__delta--up">↑ 2 this week</div>
          <div className="stat__action">Show all <Icon name="chevR" size={9}/></div>
        </button>
        <button type="button" className={`stat is-clickable ${status === 'Active' ? 'is-active' : ''}`} onClick={() => { setStatus(status === 'Active' ? 'All' : 'Active'); setPage(1); }}>
          <div className="stat__label">Active</div>
          <div className="stat__val">{customers.filter(c => c.status === 'Active').length}</div>
          <div className="stat__delta">{Math.round(customers.filter(c => c.status === 'Active').length / customers.length * 100)}% of total</div>
          <div className="stat__action">Filter <Icon name="chevR" size={9}/></div>
        </button>
        <button type="button" className={`stat is-clickable ${status === 'Suspended' ? 'is-active' : ''}`} onClick={() => { setStatus(status === 'Suspended' ? 'All' : 'Suspended'); setPage(1); }}>
          <div className="stat__label">Suspended</div>
          <div className="stat__val">{customers.filter(c => c.status === 'Suspended').length}</div>
          <div className="stat__delta">access paused</div>
          <div className="stat__action">Filter <Icon name="chevR" size={9}/></div>
        </button>
        <button type="button" className={`stat is-clickable ${status === 'Onboarding' ? 'is-active' : ''}`} onClick={() => { setStatus(status === 'Onboarding' ? 'All' : 'Onboarding'); setPage(1); }}>
          <div className="stat__label">Onboarding</div>
          <div className="stat__val">{customers.filter(c => c.status === 'Onboarding').length}</div>
          <div className="stat__delta">setup in progress</div>
          <div className="stat__action">Filter <Icon name="chevR" size={9}/></div>
        </button>
      </div>

      <div className="list-toolbar">
        <Input prefix={<Icon name="search" size={14}/>} placeholder="Search by name, address, license…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} size="md"/>
        <div className="list-toolbar__filters">
          <div className="tds-select tds-select--md" style={{ width: 140 }}>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option>All</option>
              <option>Active</option>
              <option>Onboarding</option>
              <option>Suspended</option>
            </select>
            <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
          </div>
          <div className="tds-select tds-select--md" style={{ width: 140 }}>
            <select value={contract} onChange={e => { setContract(e.target.value); setPage(1); }}>
              <option value="All">All contracts</option>
              <option>ISV</option>
              <option>ISO</option>
              <option>Acquirer</option>
              <option>PayFac</option>
            </select>
            <span className="tds-select__chevron"><Icon name="chevD" size={14}/></span>
          </div>
        </div>
      </div>

      <div className="table-card">
        <table className="tds-table">
          <thead>
            <tr>
              <th style={{ width: '34%' }}>{sortCell('name', 'Customer')}</th>
              <th style={{ width: '16%' }}>{sortCell('registeredAt', 'Registered')}</th>
              <th>Contracts</th>
              <th style={{ width: '12%' }}>Status</th>
              <th style={{ width: '60px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan="5"><div className="empty">No customers match your filters.</div></td></tr>
            ) : pageRows.map(c => (
              <tr key={c.id} onClick={() => onOpen(c.id)}>
                <td>
                  <div className="cust-cell">
                    <CompanyLogo name={c.name}/>
                    <div>
                      <div className="cust-name">{c.name}</div>
                      <div className="cust-meta">{c.address.split(',').slice(-2).join(',').trim()}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 13.5 }}>{fmtDate(c.registeredAt)}</div>
                  <div className="cust-meta">{c.operators.length} operator{c.operators.length === 1 ? '' : 's'}</div>
                </td>
                <td>
                  <div className="badge-row">
                    {c.contracts.length === 0 ? <span className="muted" style={{ fontSize: 12.5 }}>—</span> :
                      c.contracts.map((k, i) => <ContractBadge key={i} kind={k.kind} status={k.status}/>)
                    }
                  </div>
                </td>
                <td>
                  <Badge tone={STATUS_TONE_MAP[c.status] || 'neutral'} dot>{c.status}</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="iconbtn" onClick={(e) => { e.stopPropagation(); onOpen(c.id); }}>
                    <Icon name="chevR" size={14}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-foot">
          <div className="table-foot__meta">
            Showing <strong>{pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong>–<strong>{(page - 1) * pageSize + pageRows.length}</strong> of <strong>{filtered.length}</strong>
          </div>
          <div className="tds-pagination">
            <button className="tds-pagination__page" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevL" size={12}/></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`tds-pagination__page ${p === page ? 'tds-pagination__page--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="tds-pagination__page" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><Icon name="chevR" size={12}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CustomerList = CustomerList;
