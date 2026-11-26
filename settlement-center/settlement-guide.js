(() => {
  const templates = {
    org: {
      filename: '조직도_업로드_양식.xlsx', sheet: '조직도',
      rows: [['조직명', '계층', '코드'], ['예시팀', 5, 'TEAM-001']]
    },
    agents: {
      filename: 'CA마스터_업로드_양식.xlsx', sheet: 'CA마스터',
      rows: [['이름', 'MT코드', '직급', '팀명', '위촉일', '상태'],
        ['예시 설계사', '000123', 'CA1', '예시팀', '2026-01-01', 'active']]
    },
    ledger: {
      filename: '메리츠_원장_업로드_양식.xlsx', sheet: '메리츠',
      rows: [['설계자명', '모집인코드', '증권번호', '상품명', '보험료', '지급예상액', '회차', '납입구분'],
        ['예시 설계사', '000123', 'SAMPLE-001', '예시 건강보험', 30000, 100000, '1', '초회']]
    }
  };

  async function readWorkbook(file) {
    if (typeof XLSX === 'undefined') throw new Error('엑셀 기능을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const zip = data[0] === 0x50 && data[1] === 0x4b;
      const ole = [0xd0, 0xcf, 0x11, 0xe0].every((byte, index) => data[index] === byte);
      const biff = data[0] === 0x09 && [0x00, 0x02, 0x04, 0x08].includes(data[1]);
      if (!zip && !ole && !biff) throw new Error();
      const workbook = XLSX.read(data, {type:'array'});
      if (!workbook.SheetNames.length) throw new Error();
      return workbook;
    } catch {
      throw new Error('엑셀 파일을 읽을 수 없습니다. 열리는 .xlsx 또는 .xls 파일인지 확인해 주세요.');
    }
  }

  function amount(value) {
    const number = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(number) ? number : 0;
  }

  function downloadTemplate(type) {
    if (typeof XLSX === 'undefined') {
      toast('엑셀 기능을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.', 'red');
      return;
    }
    const {filename, sheet, rows} = templates[type];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheet);
    XLSX.writeFile(workbook, filename);
  }

  window.SettlementGuide = {amount, downloadTemplate, readWorkbook};
})();
