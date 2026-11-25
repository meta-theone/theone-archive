async function calculateDistribution(month, rows, cache) {
  const ids = new Map();
  const originals = new Map();
  function substitute(value) {
    if (value === undefined || value === null || value === '') return value;
    if (!ids.has(value)) {
      const key = 'k' + ids.size;
      ids.set(value, key);
      originals.set(key, value);
    }
    return ids.get(value);
  }

  const productKey = value => value === '전체' ? value : substitute(value);
  const restore = value => originals.has(value) ? originals.get(value) : value;
  const {
    agents, agentHistory, orgs, overrides, shares, productRules,
    mgmtRules, deductions, clawBacks, rules,
  } = cache;
  const body = {
    month,
    rows: rows.map(row => ({
      agentCode: substitute(row.agentCode), agentName: substitute(row.agentName),
      contractNo: substitute(row.contractNo), vendor: substitute(row.vendor),
      productType: productKey(row.productType), installment: row.installment,
      expectedAmount: row.expectedAmount, premium: row.premium, convertedPrem: row.convertedPrem,
    })),
    agents: agents.map(({id, name, mtCode, grade, teamId}) => ({
      id: substitute(id), name: substitute(name), mtCode: substitute(mtCode),
      grade: substitute(grade), teamId: substitute(teamId),
    })),
    agentHistory: agentHistory.filter(h => h.month <= month).map(({agentId, month, grade}) => ({
      agentId: substitute(agentId), month, grade: substitute(grade),
    })),
    orgs: orgs.map(({id, parentId, leaderId, name, level}) => ({
      id: substitute(id), parentId: substitute(parentId), leaderId: substitute(leaderId),
      name: substitute(name), level,
    })),
    overrides: overrides.map(({agentId, rate}) => ({ agentId: substitute(agentId), rate })),
    shares: shares.filter(s => s.month === month).map(({contractNo, participants}) => ({
      month, contractNo: substitute(contractNo),
      participants: participants?.map(({agentId, ratio}) => ({agentId: substitute(agentId), ratio})),
    })),
    productRules: productRules.map(({grade, productType, rate, cap}) => ({
      grade: substitute(grade), productType: productKey(productType), rate, cap,
    })),
    mgmtRules: mgmtRules.map(({grade, vendor, productType, rate, cap, base}) => ({
      grade: substitute(grade), vendor: substitute(vendor),
      productType: productKey(productType), rate, cap, base,
    })),
    deductions: deductions.filter(d => d.month === month).map(({fromAgentId, toAgentId, amount}) => ({
      month, fromAgentId: substitute(fromAgentId), toAgentId: substitute(toAgentId), amount,
    })),
    clawBacks: clawBacks.filter(c => c.month === month && c.status !== 'applied').map(({agentId, amount}) => ({
      month, agentId: substitute(agentId), amount,
    })),
    rules: {
      grades: rules.grades.map(({name, rate, cap}) => ({name: substitute(name), rate, cap})),
      positions: rules.positions && {
        hq_top: rules.positions.hq_top, hq_upper: rules.positions.hq_upper,
        hq: rules.positions.hq, div: rules.positions.div,
        branch: rules.positions.branch, team: rules.positions.team,
      },
      installment: rules.installment && {
        y1: rules.installment.y1, m13: rules.installment.m13, y14: rules.installment.y14,
        y25: rules.installment.y25, y37: rules.installment.y37,
      },
    },
  };
  const response = await fetch('https://withtheone.com/api/settlement/distribute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'omit',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(response.status === 413 ? '계산할 원장 크기가 너무 큽니다.' : '계산 서버에 연결하지 못했습니다. 다시 시도해 주세요.');
  }
  const {result, unmatched} = await response.json();
  return {
    unmatched,
    result: result.map(row => ({
      ...row, recipientId: restore(row.recipientId),
      name: restore(row.name), orgName: restore(row.orgName) || '',
    })),
  };
}

