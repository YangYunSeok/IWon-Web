import React, { useState } from "react";
import { Modal, Form, Input, Select, InputNumber, Checkbox, Table, Button, Space, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";

/**
 * 작업그룹 등록/수정 팝업
 * - 레이아웃: 이미지와 동일한 표 형태(좌측 라벨 셀 + 우측 입력 셀)
 * - 반응형: 화면에 넘치지 않게 본문 스크롤
 */
export default function GPCLOPRBT01P1({ open, onCancel, onSave, parentName, initial = null }) {
  const [form] = Form.useForm();
  React.useEffect(()=>{ if(open){ form.resetFields(); if(initial) form.setFieldsValue(initial); } }, [open]);
  const [rows, setRows] = useState([]);

  // 파라미터 테이블
  const columns = [
    {
      title: "Key",
      dataIndex: "key",
      render: (_, r, i) => (
        <Input value={r.key} onChange={(e) => updateRow(i, { key: e.target.value })} />
      ),
    },
    {
      title: "Value",
      dataIndex: "value",
      render: (_, r, i) => (
        <Input value={r.value} onChange={(e) => updateRow(i, { value: e.target.value })} />
      ),
    },
    {
      title: "",
      width: 42,
      render: (_, __, i) => (
        <Button danger icon={<DeleteOutlined />} onClick={() => removeRow(i)} />
      ),
    },
  ];

  const addRow = () => setRows((prev) => [...prev, { key: "", value: "" }]);
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx));
  const updateRow = (idx, patch) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      onSave?.({ ...vals, params: rows });
    } catch {}
  };

  const labelCell = {
    background: "#eaf3ff",
    border: "1px solid #cfd8dc",
    padding: "8px 10px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  };
  const inputCell = { border: "1px solid #cfd8dc", padding: "6px 8px" };

  return (
    <Modal
      open={open}
      title="작업그룹상세"
      centered
      onCancel={onCancel}
      width={"min(920px, calc(100vw - 40px))"}
      bodyStyle={{ maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}
      footer={null}
      destroyOnClose
    >
      {/* 상단 상세 */}
      <div style={{ border: "1px solid #c8c8c8", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            background: "#f7f7f7",
            padding: "8px 10px",
            borderBottom: "1px solid #ddd",
            fontWeight: 600,
          }}
        >
          작업그룹상세
        </div>
        <div style={{ padding: 0 }}>
          <Form form={form} layout="vertical">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr 150px 1fr",
                alignItems: "stretch",
              }}
            >
              {/* 작업그룹ID / 수동입력 */}
              <div style={labelCell}>작업그룹ID</div>
              <div style={inputCell}>
                <Form.Item name="groupId" style={{ margin: 0 }}>
                  <Input disabled placeholder="자동생성" />
                </Form.Item>
              </div>
              <div style={labelCell}>작업그룹ID (직접입력)</div>
              <div style={inputCell}>
                <Form.Item name="groupIdManual" style={{ margin: 0 }}>
                  <Input />
                </Form.Item>
              </div>

              {/* 작업그룹명 */}
              <div style={labelCell}>작업그룹명</div>
              <div style={{ ...inputCell, gridColumn: "2 / 5" }}>
                <Form.Item
                  name="groupName"
                  rules={[{ required: true, message: "작업그룹명을 입력하세요" }]}
                  style={{ margin: 0 }}
                >
                  <Input />
                </Form.Item>
              </div>

              {/* 작업그룹설명 */}
              <div style={labelCell}>작업그룹설명</div>
              <div style={{ ...inputCell, gridColumn: "2 / 5" }}>
                <Form.Item name="groupDesc" style={{ margin: 0 }}>
                  <Input.TextArea rows={5} />
                </Form.Item>
              </div>

              {/* 유형 / 정렬순서 */}
              <div style={labelCell}>작업그룹유형</div>
              <div style={inputCell}>
                <Form.Item name="groupType" initialValue="" style={{ margin: 0 }}>
                  <Select
                    options={[
                      { value: "", label: "-- Select --" },
                      { value: "정기", label: "정기" },
                      { value: "임시", label: "임시" },
                      { value: "OnDemand", label: "OnDemand" },
                    ]}
                  />
                </Form.Item>
              </div>
              <div style={labelCell}>정렬순서</div>
              <div style={inputCell}>
                <Form.Item name="orderNo" initialValue={0} style={{ margin: 0 }}>
                  <InputNumber style={{ width: "100%" }} />
                </Form.Item>
              </div>

              {/* 상위작업그룹 */}
              <div style={labelCell}>상위작업그룹</div>
              <div style={{ ...inputCell, gridColumn: "2 / 5" }}>
                <Form.Item name="parentGroup" style={{ margin: 0 }}>
                  <Input value={parentName || ""} placeholder="(선택된 상위그룹 경로)" readOnly />
                </Form.Item>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* 파라미터 */}
      <div style={{ border: "1px solid #c8c8c8", borderRadius: 2, marginTop: 12 }}>
        <div
          style={{
            background: "#f7f7f7",
            padding: "8px 10px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 600, flex: 1 }}>파라미터</div>
          <Space>
            <Typography.Text type="secondary">Total ({rows.length})</Typography.Text>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addRow} />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setRows([])}
              title="모두삭제"
            />
          </Space>
        </div>
        <div style={{ padding: 10 }}>
          <Table
            size="small"
            dataSource={rows.map((r, i) => ({ ...r, __key: i }))}
            columns={columns}
            pagination={false}
            rowKey="__key"
          />
        </div>
      </div>

      {/* 하단 옵션 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={{ border: "1px solid #ddd", borderRadius: 2, padding: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>실행스케줄</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input placeholder="스케줄" />
            <Button icon={<SearchOutlined />} />
          </div>
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: 2, padding: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>영업일자적용</span>
              <Checkbox defaultChecked />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>사용</span>
              <Checkbox defaultChecked />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <Button type="primary" onClick={handleOk}>
          Save
        </Button>
        <Button onClick={onCancel}>Close</Button>
      </div>
    </Modal>
  );
}