import React, { useState, useEffect, useMemo } from 'react';
import { Select, Button, Card, message } from 'antd';
//import EditableTable from '../../../../components/EditableTable';

/**
 * Page1 renders a table similar to the "청약관리" list in the provided
 * screenshot. It demonstrates how to use the Ant Design Table and Tag
 * components to display a data grid with colour-coded status values.
 */
export default function Page1() {
  // Holds the selected status code filter. When null all records are shown.
  const [statusCodeFilter, setStatusCodeFilter] = useState(null);
  // Holds the status code options fetched from the backend. Each entry
  // contains a value (code) and label (code name).
  const [statusOptions, setStatusOptions] = useState([]);
  // Holds all records retrieved from the backend. Editing the table will update this state.
  const [data, setData] = useState([]);
  const [editingRowKey, setEditingRowKey] = useState(null);

  // Fetch subscription records from the backend. Optionally accepts a status
  // filter; if provided the query parameter "status" will be appended to
  // the API call. This helper is reused for the initial load and the
  // search functionality.
  const fetchRecords = async (statusCode) => {
    try {
      const param = statusCode ? `?statusCode=${encodeURIComponent(statusCode)}` : '';
      const response = await fetch(`/api/getsubscriptions/records${param}`);
      if (!response.ok) throw new Error('HTTP error ' + response.status);
      const records = await response.json();
      const mapped = records.map((rec, idx) => ({
        key: rec.tknSecId ? rec.tknSecId.toString() : (rec.tknSecCd || idx.toString()),
        code: rec.tknSecCd,
        name: rec.tknSecNm,
        asset: rec.unlynKorNm,
        assetType: rec.unlynDtlNm,
        status: rec.subscrpStaNm,
        publicCount: rec.offrQty,
        publicAmount: rec.offrAmt,
        applyTotal: rec.subscrpQty,
        startDate: rec.subscrpSd,
        endDate: rec.subscrpEd,
        issueDate: rec.issueDd,
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      message.error('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // Fetch the status code list from the backend to populate the drop‑down
  // options. Each option will have a value (CD_VAL) and label (CD_VAL_NM).
  useEffect(() => {
    const fetchStatusCodes = async () => {
      try {
        const res = await fetch('/api/codes/subscription-status');
        if (!res.ok) throw new Error('HTTP error ' + res.status);
        const codes = await res.json();
        setStatusOptions(codes.map(code => ({ value: code.cdVal, label: code.cdValNm })));
      } catch (err) {
        console.error(err);
        message.error('상태 코드를 불러오는 중 오류가 발생했습니다.');
      }
    };
    fetchStatusCodes();
  }, []);

  // Initial fetch on mount with no status filter
  useEffect(() => {
    fetchRecords(null);
  }, []);

  // Define the column definitions for the editable common table. Each column
  // corresponds to a field in the data source. These definitions are
  // passed to the EditableTable component, which will handle
  // rendering the appropriate input controls for editing.
  const columns = useMemo(() => [
    { title: '청약관리 코드', dataIndex: 'code', key: 'code', width: 130, readOnly: true },
    { title: '공모종목 명', dataIndex: 'name', key: 'name', width: 200 },
    { title: '기초자산 명', dataIndex: 'asset', key: 'asset', width: 200 },
    { title: '자산유형', dataIndex: 'assetType', key: 'assetType', width: 120 },
    { title: '청약상태', dataIndex: 'status', key: 'status', width: 120 },
    { title: '공모수량', dataIndex: 'publicCount', key: 'publicCount', width: 120, align: 'right' },
    { title: '공모금액', dataIndex: 'publicAmount', key: 'publicAmount', width: 120, align: 'right' },
    { title: '청약신청 총수량', dataIndex: 'applyTotal', key: 'applyTotal', width: 150, align: 'right' },
    { title: '청약시작일', dataIndex: 'startDate', key: 'startDate', width: 110, align: 'center' },
    { title: '청약마감일', dataIndex: 'endDate', key: 'endDate', width: 110, align: 'center' },
    { title: '발행일', dataIndex: 'issueDate', key: 'issueDate', width: 110, align: 'center' },
  ], []);

  /**
   * When the user clicks the search button, filter the data based on the selected
   * status. If no status is selected, show all rows.
   */
  const handleSearch = () => {
    // When the user clicks search, query the backend using the selected
    // status. If no status is selected, all records will be returned.
    fetchRecords(statusCodeFilter || null);
  };

  return (
    <div style={{ padding: 0 }}>
      {/* Title and search controls */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Select
          value={statusCodeFilter}
          onChange={setStatusCodeFilter}
          placeholder="청약상태 선택"
          style={{ width: 150 }}
          allowClear
          options={statusOptions}
        performanceMode="large"
        />
        <Button type="primary" onClick={handleSearch}>조회</Button>
      </div>
        {/* Use the EditableTable to display and edit subscription data */}
      <Card size="small" title="청약등록관리">
        {/* <EditableTable
          showRowEditAction
          editingRowKey={editingRowKey}
          onStartEdit={(k)=>setEditingRowKey(k)}
          columns={columns}
          data={data}
          onDataChange={setData}
          tableWidth="100%"
          scrollX={1200}
          enableRowSelection={true}
          totalCount={data.length}
          totalLabel="Total"
        /> */}
      </Card>
    </div>
  );
}