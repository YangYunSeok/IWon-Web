# GODIS 화면 표준화 개발가이드 (v 1.0)
최초작성일: 2025-12-22
최종수정일: 2025-12-22

## 개요
본 문서는 GODIS WEB 화면 표준화한 내용을 정리한 가이드입니다.

### 표준화 대상 참고 화면 (관리자 화면 10개)
1. **GPCLOPRUS01S1** - 사용자 관리
2. **GPCLOPRMN01S1** - 메뉴 관리
3. **GPCLOPRAH01S1** - 역할 정의 & 메뉴/버튼 권한
4. **GPCLOPRAH02S1** - 사용자 권한 매핑
5. **GPCLOPRCD01S1** - 공통코드 관리
6. **GPCLOPRCD03S1** - 계층코드 관리
7. **GPCLOPRCD04S1** - 시스템 메세지 관리
8. **GPCLOPRMT02S1** - 사용자접속 모니터링
9. **GPCLOPRMT03S1** - Push메세지내역
10. **GPCLOPRLG02S1** - 트랜잭션모니터링

---

## 전체 구조 요약
새로운 화면을 개발할 때는 다음 컴포넌트들을 사용하여 표준화된 구조로 구성합니다.

### 기본 화면 구조

```jsx
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GSearchHeader from '@/components/GSearchHeader';
import GContentBox from '@/components/GContentBox';
import GDataGrid from '@/components/GDataGrid';
import GDetailTitle from '@/components/GDetailTitle';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GButtonGroup from '@/components/GButtonGroup';
import GButton from '@/components/GButton';

export default function NewScreen() {
  return (
    <GPageContainer>
      {/* 1. 조회 영역 (선택) */}
      <GSearchSection>
        <GSearchHeader
          fields={[...]}
          buttons={[...]}
        />
      </GSearchSection>

      {/* 2. 그리드/컨텐츠 영역 */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid ... />
        <GButtonGroup>
          <GButton auth="Save" label="Save" onClick={handleSave} />
        </GButtonGroup>
      </GContentBox>

      {/* 3. 상세 영역 (선택) */}
      <GContentBox flex={true}>
        <GDetailTitle title="상세 정보" />
        <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
          <GLayoutItem label="필드명">
            <GTextField ... />
          </GLayoutItem>
        </GLayoutGroup>
        <GButtonGroup>
          <GButton auth="Save" label="Save" onClick={handleSave} />
        </GButtonGroup>
      </GContentBox>
    </GPageContainer>
  );
}
```

### 컴포넌트 계층 구조

```
GPageContainer (최상위 컨테이너)
├── GSearchSection (조회 영역 래퍼)
│   └── GSearchHeader (조회 헤더)
│       ├── fields[] (입력 필드들)
│       └── buttons[] (조회 버튼들)
│
├── GContentBox (그리드/컨텐츠 영역)
│   ├── GDataGrid / GSimpleTreeGrid / GDataTreeGrid
│   └── GButtonGroup
│       └── GButton[]
│
└── GContentBox (상세 영역)
    ├── GDetailTitle (상세 영역 타이틀)
    ├── GLayoutGroup
    │   └── GLayoutItem[]
    │       └── GTextField / GSelectBox / GDatePicker / etc.
    └── GButtonGroup
        └── GButton[]
```

### 주요 컴포넌트 역할

| 컴포넌트            | 역할                                    | 필수 여부              |
|--------------------|----------------------------------------|--------------------- -|
| `GPageContainer`   | 화면 최상위 컨테이너                      | ✅ 필수               |
| `GSearchSection`   | 조회 영역 래퍼                           | 조회 영역이 있을 때     |
| `GSearchHeader`    | 조회 헤더 (입력 필드 + 버튼)              | 조회 영역이 있을 때     |
| `GContentBox`      | 그리드/컨텐츠 영역 래퍼                   | ✅ 필수               |
| `GDataGrid`        | 데이터 그리드                            | 그리드가 있을 때        |
| `GDetailTitle`     | 상세 영역 타이틀                         | 상세 영역이 있을 때      |
| `GLayoutGroup`     | 상세 영역 레이아웃 그룹                   | 상세 영역이 있을 때      |
| `GLayoutItem`      | 상세 영역 입력 필드 레이아웃               | 상세 영역이 있을 때     |
| `GButtonGroup`     | 버튼 그룹                               | 버튼이 있을 때          |
| `GButton`          | 표준 버튼                               | 버튼이 있을 때          |

### 빠른 시작 체크리스트

1. ✅ `GPageContainer`로 화면 전체 감싸기
2. ✅ 조회 영역이 있으면 `GSearchSection` + `GSearchHeader` 사용
3. ✅ 그리드 영역은 `GContentBox`로 감싸기
4. ✅ 상세 영역은 `GDetailTitle` + `GLayoutGroup` + `GLayoutItem` 사용
5. ✅ 버튼은 `GButtonGroup`으로 감싸기
6. ✅ 모든 버튼은 `GButton` 컴포넌트 사용

---

## 1. 전체 레이아웃 표준화

### 1.1 GPageContainer 컴포넌트

모든 화면의 최상위 컨테이너로 사용하여 일관된 레이아웃을 제공합니다.

#### 구조
```jsx
<GPageContainer>
  {/* 화면 내용 */}
</GPageContainer>
```

#### 파라미터

| 파라미터   | 타입             | 기본값                      | 설명                        |
|-----------|-----------------|----------------------------|----------------------------|
| `children` | ReactNode      | 필수                        | 화면 내용                   |
| `height`   | string         | `'calc(100vh - 120px)'`     | 컨테이너 높이               |
| `padding`  | number/string  | `0.5`                       | 내부 패딩 (MUI spacing 단위)|
| `gap`      | number/string  | `1`                         | 자식 요소 간 간격           |
| `overflow` | string         | `'hidden'`                  | overflow 속성              |
| `sx`       | object         | `{}`                        | 추가 스타일                 |

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리)**
```jsx
import GPageContainer from '@/components/GPageContainer';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRUS01S1() {
  return (
    <GPageContainer>
      {/* 상단: 소속그룹 영역 */}
      <GContentBox flex={false} marginBottom="8px">
        {/* 그리드 영역 */}
      </GContentBox>
      
      {/* 하단: 사용자 영역 */}
      <GContentBox flex={true}>
        {/* 그리드 영역 */}
      </GContentBox>
    </GPageContainer>
  );
}
```

**예시 화면: GPCLOPRCD01S1 (공통코드 관리)**
```jsx
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GSearchHeader from '@/components/GSearchHeader';
import GContentBox from '@/components/GContentBox';

export default function GPCLOPRCD01S1() {
  return (
    <GPageContainer>
      <GSearchSection>
        <GSearchHeader ... />
      </GSearchSection>
      
      {/* 그리드 영역들 */}
      <GContentBox flex={false} marginBottom="8px">
        {/* 상단 그리드 */}
      </GContentBox>
      <GContentBox flex={true}>
        {/* 하단 그리드 */}
      </GContentBox>
    </GPageContainer>
  );
}
```

#### 적용 규칙
- ✅ **모든 화면의 최상위는 `GPageContainer`로 감싸야 합니다**
- ✅ 기본값으로 대부분의 경우 충분하지만, 필요시 `height`, `padding`, `gap` 등을 커스터마이징 가능
- ✅ 내부에 여러 섹션(검색, 그리드, 상세 영역)을 배치

---

### 1.2 GContentBox 컴포넌트

그리드나 컨텐츠 영역을 감싸는 래퍼 컴포넌트입니다. 일관된 스타일(padding, backgroundColor, borderRadius)을 제공합니다.

#### 구조
```jsx
{/* 고정 높이 영역 */}
<GContentBox flex={false} marginBottom="8px">
  <GDataGrid ... />
  <GButtonGroup>...</GButtonGroup>
</GContentBox>

{/* 확장 가능 영역 */}
<GContentBox flex={true}>
  <GDataGrid ... />
  <GButtonGroup>...</GButtonGroup>
</GContentBox>
```

#### 파라미터

| 파라미터              | 타입           | 기본값                                                     | 설명                      |
|----------------------|---------------|-----------------------------------------------------------|---------------------------|
| `children`           | ReactNode     | 필수                                                      | 컨텐츠 (그리드, 상세 영역 등) |
| `flex`               | boolean       | `false`                                | 확장가능여부: `true`면 `flex: 1`, `false`면 `flexShrink: 0` |
| `marginBottom`       | string/number | `flex=false`일 때 `'8px'`, `flex=true`일 때 `0`            | 하단 마진           |
| `overflow`           | string        | `flex=true`일 때 `'hidden'`, `flex=false`일 때 `'visible'` | overflow 속성      |
| `display`            | string        | `flex=true`일 때 `'flex'`, `flex=false`일 때 `'block'`     | display 속성       |
| `flexDirection`      | string        | `flex=true`일 때 `'column'`, `flex=false`일 때 `'row'`     | flexDirection 속성 |
| `minHeight`          | number/string | `flex=true`일 때 `0`, `flex=false`일 때 `'auto'`           | minHeight 속성     |
| `sx`                 | object        | `{}`                                                      | 추가 스타일         |

#### 기본 스타일
- `padding: '8px'`
- `borderRadius: '4px'`

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리) - 고정 높이 영역**
```jsx
import GContentBox from '@/components/GContentBox';

<GPageContainer>
  {/* 상단: 소속그룹 영역 (고정 높이) */}
  <GContentBox flex={false} marginBottom="8px">
    <Stack direction="row" spacing={2} height={345}>
      <GSimpleTreeGrid ... />
      {/* 상세 영역 */}
    </Stack>
  </GContentBox>

  {/* 하단: 사용자 영역 (확장 가능) */}
  <GContentBox flex={true}>
    <GDataGrid ... />
    <GButtonGroup>...</GButtonGroup>
  </GContentBox>
</GPageContainer>
```

**예시 화면: GPCLOPRCD01S1 (공통코드 관리)**
```jsx
<GPageContainer>
  <GSearchSection>
    <GSearchHeader ... />
  </GSearchSection>

  {/* 상단: 공통코드그룹 (고정 높이) */}
  <GContentBox flex={false} marginBottom="8px">
    <GDataGrid
      title="공통코드그룹"
      rows={groups}
      columns={groupColumns}
      // ... 기타 props
    />
    <GButtonGroup>
      <GButton auth="Save" label="Save" onClick={saveGroup} />
    </GButtonGroup>
  </GContentBox>

  {/* 하단: 공통코드 (확장 가능) */}
  <GContentBox flex={true}>
    <GDataGrid
      title="공통코드"
      rows={codes}
      columns={codeColumns}
      // ... 기타 props
    />
    <GButtonGroup>
      <GButton auth="Save" label="Save" onClick={saveCode} />
    </GButtonGroup>
  </GContentBox>
</GPageContainer>
```

**예시 화면: GPCLOPRMT02S1 (사용자접속 모니터링) - 확장 가능 영역**
```jsx
<GPageContainer>
  <GSearchSection>
    <GSearchHeader ... />
  </GSearchSection>

  {/* 그리드 영역 (확장 가능) */}
  <GContentBox flex={true}>
    <GDataGrid
      title="사용자접속모니터링"
      rows={data}
      columns={gridColumns}
      // ... 기타 props
    />
  </GContentBox>
</GPageContainer>
```

**예시 화면: GPCLOPRLG02S1 (트랜잭션모니터링) - 그리드 + 디테일**
```jsx
<GPageContainer>
  <GSearchSection>
    <GSearchHeader ... />
  </GSearchSection>

  {/* 그리드 영역 (확장 가능) */}
  <GContentBox flex={true}>
    <GDataGrid ... />
  </GContentBox>

  {/* 디테일 영역 (고정 높이) */}
  <GContentBox flex={false} marginBottom={0}>
    <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
      {/* 입력 필드들 */}
    </GLayoutGroup>
  </GContentBox>
</GPageContainer>
```

**예시 화면: GPCLOPRAH02S1 (사용자 권한 매핑) - 커스텀 스타일**
```jsx
<GPageContainer>
  {/* 상단 영역 (고정 높이, 커스텀 스타일) */}
  <GContentBox 
    flex={false} 
    marginBottom={0}
    display="flex"
    overflow="hidden"
    sx={{ height: 340, gap: 1 }}
  >
    {/* 여러 그리드들 */}
  </GContentBox>

  {/* 하단 영역 (확장 가능) */}
  <GContentBox 
    flex={true}
    display="flex"
    overflow="hidden"
    sx={{ gap: 1 }}
  >
    {/* 여러 그리드들 */}
  </GContentBox>
</GPageContainer>
```

#### 적용 규칙
- ✅ **그리드나 컨텐츠 영역을 감싸는 `Box`는 `GContentBox`로 대체**
- ✅ 고정 높이 영역: `flex={false}`, `marginBottom="8px"` (기본값)
- ✅ 확장 가능 영역: `flex={true}` (기본값으로 `flex: 1`, `minHeight: 0`, `overflow: 'hidden'` 적용)
- ✅ 필요시 `sx` prop으로 추가 스타일 커스터마이징 가능
- ✅ 기본 스타일(padding, backgroundColor, borderRadius)은 자동 적용

---

## 2. 그리드 표준화

### 2.1 GDataGrid 컴포넌트

일반적인 데이터 그리드로 사용하며, 페이징 처리를 포함합니다.

#### 구조
```jsx
<GDataGrid
  title="그리드 제목"
  rows={rows}
  columns={columns}
  pagination={true}
  pageSizeOptions={[50, 100]}
  initialState={paginationInitialState}
  sx={paginationCenterSx}
  // 기타 props
/>
```

#### 필수 파라미터 (표준화)

| 파라미터            | 타입    | 기본값                  | 설명                                    |
|---------------------|---------|-------------------------|-----------------------------------------|
| `title`              | string  | -                       | 그리드 제목                              |
| `rows`               | array   | 필수                    | 데이터 행 배열                           |
| `columns`            | array   | 필수                    | 컬럼 정의 배열                           |
| `pagination`        | boolean | `true`                  | 페이징 활성화 여부                       |
| `pageSizeOptions`   | array   | `[50, 100]`             | 페이지 크기 옵션                        |
| `initialState`      | object  | `paginationInitialState` | 초기 페이징 상태 (100개)                 |
| `sx`                | object  | `paginationCenterSx`    | 페이징 중앙 정렬 스타일                  |
| `columnHeaderHeight` | number | `30`                    | 헤더 높이                                |
| `rowHeight`         | number  | `25`                    | 행 높이                                  |
| `Buttons`           | object  | -                       | 버튼 설정 `{add, delete, revert, excel}` |

#### 페이징 설정

**GPagination.jsx에서 제공하는 표준 설정:**
```jsx
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';

// paginationCenterSx: 페이징 푸터 중앙 정렬 및 높이 36px로 설정
// paginationInitialState: 초기 페이지 크기 100개
```

#### 사용 예시

**예시 화면: GPCLOPRCD01S1 (공통코드 관리)**
```jsx
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';

<GDataGrid
  title="공통코드그룹"
  rows={groups}
  columns={groupColumns}
  Buttons={{ add: true, delete: true, revert: true, excel: true }}
  columnHeaderHeight={30}
  rowHeight={25}
  checkboxSelection
  height={345}
  pagination={true}
  pageSizeOptions={[50, 100]}
  initialState={paginationInitialState}
  sx={paginationCenterSx}
  disableRowSelectionOnClick
  onRowsChange={setGroups}
  onRowClick={(params) => {
    setSelectedGrpId(params.row);
    getItems(params.row);
  }}
  createNewRow={addGroupRow}
/>
```

**예시 화면: GPCLOPRMT02S1 (사용자접속 모니터링)**
```jsx
<GDataGrid
  title="사용자접속모니터링"
  rows={data}
  columns={gridColumns}
  columnHeaderHeight={30}
  rowHeight={25}
  loading={false}
  Buttons={[false, false, false, false]}
  pagination={true}
  pageSizeOptions={[50, 100]}
  initialState={paginationInitialState}
  sx={paginationCenterSx}
/>
```

#### 적용 규칙
- ✅ **페이징이 필요한 그리드는 반드시 `pagination={true}`, `pageSizeOptions={[50, 100]}`, `initialState={paginationInitialState}`, `sx={paginationCenterSx}`를 설정**
- ✅ 트리 그리드는 페이징 제외 (GSimpleTreeGrid, GDataTreeGrid)
- ✅ `columnHeaderHeight={30}`, `rowHeight={25}`로 통일
- ✅ 버튼은 `Buttons={{ add: true, delete: true, revert: true, excel: true }}` 형태로 객체로 전달

### 2.2 GSimpleTreeGrid 컴포넌트

계층 구조를 가진 데이터를 트리 형태로 표시하는 그리드입니다.

#### 구조
```jsx
<GSimpleTreeGrid
  title="트리 제목"
  rows={treeData}
  idField="ID"
  parentIdField="PARENT_ID"
  labelField="NAME"
  // 기타 props
/>
```

#### 필수 파라미터

| 파라미터                | 타입     | 설명              |
|-------------------------|----------|-------------------|
| `title`                 | string   | 트리 제목         |
| `rows`                  | array    | 트리 데이터 배열  |
| `idField`               | string   | 고유 ID 필드명    |
| `parentIdField`         | string   | 부모 ID 필드명    |
| `labelField`            | string   | 표시할 라벨 필드명 |
| `selectedItem`          | object   | 선택된 항목       |
| `onSelectedItemChange`  | function | 선택 변경 콜백    |

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리)**
```jsx
<GSimpleTreeGrid
  rows={groups}
  onRowsChange={handleGroupRowsChange}
  idField="USR_GRP_ID"
  parentIdField="UP_USR_GRP_ID"
  labelField="USR_GRP_NM"
  columnLabel="사용자그룹명"
  createNewRow={createNewGroupRow}
  generateNewId={generateNewGroupId}
  title="소속그룹"
  selectedItem={selectedGroup}
  onSelectedItemChange={handleGroupSelect}
  onHasChanges={setHasGroupChanges}
  Buttons={{ add: true, delete: true, revert: true, excel: false }}
  onRevertClick={handleGroupRevert}
  sx={{ height: '100%' }}
/>
```

### 2.3 GDataTreeGrid 컴포넌트

복잡한 계층 구조를 가진 데이터를 표 형태의 트리로 표시합니다.

#### 사용 예시

**예시 화면: GPCLOPRAH01S1 (역할 정의 & 메뉴/버튼 권한)**
```jsx
<GDataTreeGrid
  title="메뉴버튼/권한"
  rows={treeRows}
  columns={finalColumns}
  getRowId={(row) => row.MENU_ID}
  initiallyExpandAll={true}
  checkboxSelection={false}
  disableRowSelectionOnClick
  columnHeaderHeight={30}
  rowHeight={25}
  pagination={false}
  hideFooter
  Buttons={{ add: false, delete: false, revert: true, excel: true }}
  onRevertClick={() => doRevert("GDataTreeGrid")}
/>
```

---

## 3. 조회 영역 표준화

### 3.1 GSearchSection 컴포넌트

검색 영역을 감싸는 래퍼 컴포넌트입니다.

#### 구조
```jsx
<GSearchSection>
  <GSearchHeader ... />
</GSearchSection>
```

#### 파라미터

| 파라미터     | 타입      | 기본값 | 설명                  |
|-------------|-----------|-------|-----------------------|
| `children`   | ReactNode | 필수   | GSearchHeader 컴포넌트 |
| `flexShrink` | boolean   | `true` | flex-shrink 속성       |
| `sx`         | object    | `{}`   | 추가 스타일           |

#### 사용 예시

**예시 화면: GPCLOPRCD01S1 (공통코드 관리)**
```jsx
import GSearchSection from '@/components/GSearchSection';
import GSearchHeader from '@/components/GSearchHeader';

<GSearchSection>
  <GSearchHeader
    fields={[
      {
        header: '공통코드명',
        content: (
          <TextField
            fullWidth
            name="text"
            value={grpNm}
            onChange={(e) => setGrpNm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                getGroups();
              }
            }}
            placeholder="공통코드명 입력"
          />
        ),
      },
      {
        header: '그룹유형',
        content: (
          <GSelectBox 
            items={lstGrpTpCd}
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            toplabel="A"
            value={grpTpCd}
            onChange={(v) => setGrpTpCd(v)}
          />
        ),
      },
      {}, // 빈 필드 (여백)
      {}  // 빈 필드 (여백)
    ]}
    buttons={[
      <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
      <GButton key="search" auth="Search" label="Search" onClick={getGroups} />,
    ]}
  />
</GSearchSection>
```

**예시 화면: GPCLOPRMT02S1 (사용자접속 모니터링)**
```jsx
<GSearchSection>
  <GSearchHeader
    fields={[
      {
        header: '접속상태',
        content: (
          <GSelectBox
            items={loginStatusOptions}
            value={cboConnStat}
            onChange={(value) => setCboConnStat(value)}
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            toplabel="A"
          />
        ),
      },
      {
        header: '사용자그룹',
        content: (
          <GSelectBox
            valueKey="CD_VAL"
            labelKey="CD_VAL_NM"
            toplabel="A"
          />
        ),
      },
      // ... 기타 필드
    ]}
    buttons={[
      <GButton key="search" auth="Search" label="Search" onClick={getuserconnectstatus} />,
    ]}
  />
</GSearchSection>
```

### 3.2 입력 컴포넌트 표준

조회 영역에서 사용하는 입력 컴포넌트들:

#### GTextField
```jsx
<TextField
  fullWidth
  name="text"
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }}
  placeholder="검색어 입력"
/>
```

#### GSelectBox
```jsx
<GSelectBox 
  items={codeList}
  valueKey="CD_VAL"
  labelKey="CD_VAL_NM"
  toplabel="A"
  value={selectedValue}
  onChange={(v) => setSelectedValue(v)}
/>
```

#### GDatePicker / GDateRangePicker
```jsx
// 단일 날짜
<GDatePicker
  value={date}
  onChange={(v) => setDate(v)}
  format="YYYY-MM-DD"
/>

// 날짜 범위
<GDateRangePicker
  value={[fromDate, toDate]}
  onChange={([from, to]) => {
    setFromDate(from);
    setToDate(to);
  }}
/>
```

#### 적용 규칙
- ✅ **조회 영역이 있는 화면은 반드시 `GSearchSection`으로 감싸야 합니다**
- ✅ `GSearchHeader`의 `fields` 배열에서 빈 객체 `{}`는 여백으로 사용
- ✅ Enter 키로 검색 가능하도록 `onKeyDown` 처리
- ✅ 버튼은 `GButton` 컴포넌트 사용

---

## 4. 디테일 영역 표준화

### 4.1 GDetailTitle 컴포넌트

상세 영역의 섹션 제목을 표시하는 컴포넌트입니다.

#### 구조
```jsx
<GDetailTitle title="섹션 제목" />
```

#### 파라미터

| 파라미터   | 타입      | 기본값 | 설명                      |
|-----------|-----------|-------|---------------------------|
| `title`    | string    | 필수   | 타이틀 텍스트              |
| `iconSize` | number    | `16`   | GTitleIcon 크기            |
| `action`   | ReactNode | `null` | 우측 액션 영역 컴포넌트     |
| `sx`       | object    | `{}`   | 추가 스타일                |

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리)**
```jsx
import GDetailTitle from '@/components/GDetailTitle';

<Stack flex={6}>
  <GDetailTitle title="사용자 그룹 정보" />
  
  <Box sx={{ flex: 1, overflow: 'auto' }}>
    <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
      {/* 입력 필드들 */}
    </GLayoutGroup>
  </Box>
</Stack>
```

**예시 화면: GPCLOPRCD03S1 (계층코드 관리)**
```jsx
<Stack flex={5} sx={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
  <GDetailTitle title="계층코드 상세" />
  
  <Box sx={{ flex: 1, overflow: 'auto' }}>
    <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
      {/* 입력 필드들 */}
    </GLayoutGroup>
  </Box>
</Stack>
```

### 4.2 GLayoutGroup & GLayoutItem 컴포넌트

디테일 영역의 입력 필드들을 레이아웃하는 컴포넌트입니다.

#### 구조
```jsx
<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
  <GLayoutItem label="필드명">
    <GTextField ... />
  </GLayoutItem>
  
  <GLayoutGroup orientation="horizontal">
    <GLayoutItem label="필드1">
      <GTextField ... />
    </GLayoutItem>
    <GLayoutItem label="필드2">
      <GTextField ... />
    </GLayoutItem>
  </GLayoutGroup>
</GLayoutGroup>
```

#### GLayoutGroup 파라미터

| 파라미터      | 타입   | 기본값        | 설명                                          |
|--------------|--------|--------------|-----------------------------------------------|
| `orientation` | string | `'vertical'` | 레이아웃 방향: `'vertical'` \| `'horizontal'` |
| `itemBorder` | string | -            | 아이템 테두리 스타일                           |
| `labelWidth` | number | -            | 레이블 고정 너비 (px)                         |
| `itemHeight` | number | -            | 아이템 기본 높이 (px)                          |
| `spacing`    | number | `0`          | 아이템 간 간격                                 |

#### GLayoutItem 파라미터

| 파라미터       | 타입      | 기본값 | 설명            |
|---------------|-----------|-------|-----------------|
| `label`       | string    | -     | 레이블 텍스트    |
| `labelWidth`  | number    | -     | 레이블 너비 (px) |
| `labelPaddingX` | number | `40`  | 레이블 좌우 패딩 (px) |
| `height`      | number    | `30`  | 아이템 높이 (px) |
| `children`    | ReactNode | 필수  | 입력 컴포넌트    |

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리)**
```jsx
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';

<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
  <GLayoutItem label="그룹ID">
    <GTextField 
      value={selectedGroup?.USR_GRP_ID || ''} 
      isReadOnly={true} 
    />
  </GLayoutItem>

  <GLayoutItem label="그룹명">
    <GTextField 
      value={selectedGroup?.USR_GRP_NM || ''} 
      fieldName="USR_GRP_NM"
      onFieldChange={handleGroupFieldChange}
      isRequired={true}
    />
  </GLayoutItem>
</GLayoutGroup>
```

**예시 화면: GPCLOPRMN01S1 (메뉴 관리)**
```jsx
<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
  <GLayoutGroup orientation="horizontal">
    <GLayoutItem label="Menu ID">
      <GTextField value={detailData.MENU_ID} isReadOnly={true} />
    </GLayoutItem>
    <GLayoutItem label="Menu ID (직접입력)">
      <GTextField 
        value={detailData.MENU_ID_NUM} 
        fieldName="MENU_ID_NUM"
        onFieldChange={handleFieldChange}
      />
    </GLayoutItem>
  </GLayoutGroup>

  <GLayoutItem label="연결프로그램">
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
      <GTextField 
        value={detailData.PROGM_NM} 
        fieldName="PROGM_NM"
        onFieldChange={handleFieldChange}
        sx={{ flex: 1 }} 
      />
      <GButton label="Search" auth="Search" onClick={handleProgramSearch} iconOnly />
    </Box>
  </GLayoutItem>
</GLayoutGroup>
```

**예시 화면: GPCLOPRLG02S1 (트랜잭션모니터링) - 멀티라인**
```jsx
<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
  <GLayoutItem label="작업파라미터" height={60}>
    <GTextField
      value={selectedRow?.TRAN_CONTN || "조회된 데이터가 없습니다."}
      isReadOnly={true}
      multiline
      minRows={1}
    />
  </GLayoutItem>
  <GLayoutItem label="요청내용" height={60}>
    <GTextField
      value={selectedRow?.REQ_CONTN || "조회된 데이터가 없습니다."}
      isReadOnly={true}
      multiline
      minRows={1}
    />
  </GLayoutItem>
</GLayoutGroup>
```

#### 입력 컴포넌트 표준

**GTextField**
```jsx
<GTextField 
  value={value}
  fieldName="FIELD_NAME"
  onFieldChange={handleFieldChange}
  isReadOnly={false}
  isRequired={false}
  multiline={false}
  minRows={1}
  height={30}
/>
```

**GSelectBox**
```jsx
<GSelectBox
  items={codeList}
  valueKey="CD_VAL"
  labelKey="CD_VAL_NM"
  value={selectedValue}
  onChange={(v) => setSelectedValue(v)}
  fieldName="FIELD_NAME"
  onFieldChange={handleFieldChange}
/>
```

**검색 가능한 필드 (GTextField + GButton iconOnly)**
```jsx
<GLayoutItem label="연결프로그램">
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
    <GTextField 
      value={detailData.PROGM_NM} 
      fieldName="PROGM_NM"
      onFieldChange={handleFieldChange}
      sx={{ flex: 1 }} 
    />
    <GButton label="Search" auth="Search" onClick={handleSearch} iconOnly />
  </Box>
</GLayoutItem>
```

#### 적용 규칙
- ✅ **디테일 영역의 제목은 반드시 `GDetailTitle` 사용**
- ✅ 입력 필드는 `GLayoutGroup`과 `GLayoutItem`으로 레이아웃
- ✅ `itemBorder="1px solid #ddd"`, `labelWidth={130}`로 통일
- ✅ 수평 배치는 `GLayoutGroup orientation="horizontal"` 사용
- ✅ 멀티라인 입력은 `GTextField`에 `multiline`, `minRows`, `height` 설정

---

## 5. 버튼 영역 표준화

### 5.1 GButtonGroup 컴포넌트

버튼들을 그룹화하여 표시하는 컴포넌트입니다. 디테일영역에 있는 Save 버튼 영역에서 사용합니다.

#### 구조
```jsx
<GButtonGroup>
  <GButton auth="Save" label="Save" onClick={handleSave} />
</GButtonGroup>
```

#### 파라미터

| 파라미터        | 타입          | 기본값        | 설명                                                          |
|----------------|---------------|--------------|---------------------------------------------------------------|
| `children`      | ReactNode     | 필수         | 버튼 컴포넌트들                                                |
| `justifyContent` | string        | `'flex-end'` | 정렬 방식: `'flex-start'` \| `'center'` \| `'flex-end'` \| `'space-between'` |
| `marginTop`     | string/number | `'8px'`      | 상단 마진                                                      |
| `flexShrink`    | boolean       | `true`       | flex-shrink 속성                                               |
| `sx`            | object        | `{}`         | 추가 스타일                                                    |

#### 사용 예시

**예시 화면: GPCLOPRCD01S1 (공통코드 관리) - 단일 버튼**
```jsx
import GButtonGroup from '@/components/GButtonGroup';
import GButton from '@/components/GButton';

<GButtonGroup>
  <GButton key="save" auth="Save" label="Save" onClick={saveGroup} />
</GButtonGroup>
```

**예시 화면: GPCLOPRCD04S1 (시스템 메세지 관리) - 여러 버튼**
```jsx
<GButtonGroup>
  <GButton auth="CacheDeploy" label="Cache Deploy" onClick={BtnCacheDeploy_Click} />
  <GButton key="Save" auth="Save" label="Save" disabled={!hasChanges} onClick={SaveMessageCode} />
</GButtonGroup>
```

**예시 화면: GPCLOPRCD03S1 (계층코드 관리) - space-between**
```jsx
<GButtonGroup justifyContent="space-between">
  <GButton auth="CacheDeploy" label="Cache Deploy" onClick={BtnCacheDeploy_Click} />
  <GButton key="Save" auth="Save" label="Save" disabled={!hasCodeChanges} onClick={SaveClssCode} />
</GButtonGroup>
```

### 5.2 GButton 컴포넌트

표준화된 버튼 컴포넌트입니다.

#### 구조
```jsx
<GButton auth="Save" label="Save" onClick={handleSave} />
```

#### 파라미터

| 파라미터   | 타입    | 기본값  | 설명                          |
|-----------|---------|--------|-------------------------------|
| `auth`     | string  | -      | 권한 코드 (필수)               |
| `label`    | string  | -      | 버튼 텍스트 (필수)             |
| `onClick`  | function | -      | 클릭 핸들러                    |
| `iconOnly` | boolean | `false` | 아이콘만 표시 (상세 영역 검색 버튼용) |
| `disabled` | boolean | `false` | 비활성화 여부                  |
| `sx`       | object  | `{}`   | 추가 스타일                    |

#### 버튼 타입별 색상

| label                    | variant    | color      | 용도         |
|-------------------------|------------|------------|--------------|
| `"Search"`              | `contained` | `primary`  | 조회         |
| `"Save"`                 | `contained` | `primary`  | 저장         |
| `"Init"` / `"Initialize"` | `outlined` | `secondary` | 초기화       |
| `"Cancel"`              | `outlined` | `secondary` | 취소         |
| `"Revert"`              | `outlined` | `warning`  | 되돌리기     |
| `"CacheDeploy"`         | `contained` | `warning`  | 캐시 배포    |
| `"Image"`               | `outlined` | `secondary` | 이미지 검색  |
| `"Authority"`           | `outlined` | `warning`  | 권한 설정    |

#### iconOnly 모드

상세 영역의 검색 버튼에 사용:
```jsx
<GButton label="Search" auth="Search" onClick={handleSearch} iconOnly />
<GButton label="Image" auth="Image" onClick={handleImageSearch} iconOnly />
```

#### 사용 예시

**예시 화면: GPCLOPRUS01S1 (사용자 관리)**
```jsx
<GButtonGroup>
  <GButton auth="Save" label="Save" onClick={saveGroup} />
</GButtonGroup>
```

**예시 화면: GPCLOPRAH01S1 (역할 정의)**
```jsx
<GButtonGroup>
  <GButton auth="Save" label="Save" onClick={saveRole} disabled={savingRole} />
</GButtonGroup>
```

**예시 화면: GPCLOPRMN01S1 (메뉴 관리) - 상세 영역 검색 버튼**
```jsx
<GLayoutItem label="연결프로그램">
  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
    <GTextField 
      value={detailData.PROGM_NM} 
      fieldName="PROGM_NM"
      onFieldChange={handleFieldChange}
      sx={{ flex: 1 }} 
    />
    <GButton label="Search" auth="Search" onClick={handleProgramSearch} iconOnly />
  </Box>
</GLayoutItem>
```

#### 적용 규칙
- ✅ **그리드 하단, 상세 영역 하단의 버튼은 반드시 `GButtonGroup`으로 감싸야 합니다**
- ✅ 기본 정렬은 `flex-end` (우측 정렬)
- ✅ 여러 버튼이 있을 경우 `justifyContent="space-between"` 사용 가능
- ✅ 상세 영역의 검색 버튼은 `iconOnly` 모드 사용
- ✅ 버튼은 `GButton` 컴포넌트 사용, `auth` 속성 필수

---

## 6. 입력 컴포넌트 표준화

조회 영역과 상세 영역에서 사용하는 표준 입력 컴포넌트들입니다.

### 6.1 GTextField 컴포넌트

텍스트 입력 필드 컴포넌트입니다.

#### 구조
```jsx
<GTextField 
  value={value}
  fieldName="FIELD_NAME"
  onFieldChange={handleFieldChange}
  isReadOnly={false}
  isRequired={false}
  multiline={false}
  minRows={1}
  height={30}
/>
```

#### 파라미터

| 파라미터      | 타입    | 기본값  | 설명                                          |
|--------------|---------|--------|-----------------------------------------------|
| `value`      | string  | `''`   | 입력값                                        |
| `fieldName`  | string  | -      | 필드명 (onFieldChange와 함께 사용)             |
| `onFieldChange` | function | -   | 필드 변경 핸들러 `(fieldName, value) => void` |
| `onChange`   | function | -      | 직접 변경 핸들러 `(event) => void`            |
| `isReadOnly` | boolean | `false` | 읽기 전용 (회색 배경)                         |
| `isRequired` | boolean | `false` | 필수 입력 (노란색 배경)                       |
| `isNumeric`  | boolean | `false` | 숫자만 입력 허용                               |
| `maxLength`  | number  | -      | 최대 길이                                     |
| `transform`  | string  | -      | `'uppercase'` \| `'lowercase'`                |
| `multiline`  | boolean | `false` | 멀티라인 입력                                 |
| `minRows`    | number  | `1`    | 멀티라인 최소 행 수                           |
| `height`     | number  | `30`   | 높이 (px)                                     |
| `fullWidth`  | boolean | `true` | 전체 너비                                     |
| `sx`         | object  | `{}`   | 추가 스타일                                   |

#### 사용 예시

**조회 영역에서 사용**
```jsx
<GSearchHeader
  fields={[
    {
      header: '공통코드명',
      content: (
        <GTextField
          fullWidth
          value={grpNm}
          onChange={(e) => setGrpNm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="공통코드명 입력"
        />
      ),
    },
  ]}
/>
```

**상세 영역에서 사용**
```jsx
<GLayoutItem label="그룹명">
  <GTextField 
    value={selectedGroup?.USR_GRP_NM || ''} 
    fieldName="USR_GRP_NM"
    onFieldChange={handleGroupFieldChange}
    isRequired={true}
  />
</GLayoutItem>
```

**멀티라인 입력**
```jsx
<GLayoutItem label="작업파라미터" height={60}>
  <GTextField
    value={selectedRow?.TRAN_CONTN || ""}
    isReadOnly={true}
    multiline
    minRows={1}
  />
</GLayoutItem>
```

### 6.2 GSelectBox 컴포넌트

드롭다운 선택 박스 컴포넌트입니다.

#### 구조
```jsx
<GSelectBox
  items={codeList}
  valueKey="CD_VAL"
  labelKey="CD_VAL_NM"
  value={selectedValue}
  onChange={(v) => setSelectedValue(v)}
  fieldName="FIELD_NAME"
  onFieldChange={handleFieldChange}
  toplabel="A"
/>
```

#### 파라미터

| 파라미터      | 타입    | 기본값  | 설명                                          |
|--------------|---------|--------|-----------------------------------------------|
| `items`      | array   | `[]`   | 선택 옵션 배열                                 |
| `valueKey`   | string  | `'code'` | 값 필드명                                     |
| `labelKey`   | string  | `'name'` | 표시 필드명                                   |
| `value`      | string  | -      | 선택된 값                                     |
| `onChange`   | function | -      | 변경 핸들러 `(value, item) => void`           |
| `fieldName`  | string  | -      | 필드명 (onFieldChange와 함께 사용)             |
| `onFieldChange` | function | -   | 필드 변경 핸들러                               |
| `isReadOnly` | boolean | `false` | 읽기 전용                                     |
| `isRequired` | boolean | `false` | 필수 선택                                     |
| `toplabel`   | string  | `null` | `'A'` (-- All --) \| `'S'` (-- Select --)     |
| `topLabelText` | string | -      | 상단 라벨 텍스트 직접 지정                     |
| `label`      | string  | -      | MUI InputLabel 텍스트                         |
| `fullWidth`  | boolean | `true` | 전체 너비                                     |
| `sx`         | object  | `{}`   | 추가 스타일                                   |

#### 사용 예시

**조회 영역에서 사용**
```jsx
<GSearchHeader
  fields={[
    {
      header: '그룹유형',
      content: (
        <GSelectBox 
          items={lstGrpTpCd}
          valueKey="CD_VAL"
          labelKey="CD_VAL_NM"
          toplabel="A"
          value={grpTpCd}
          onChange={(v) => setGrpTpCd(v)}
        />
      ),
    },
  ]}
/>
```

**상세 영역에서 사용**
```jsx
<GLayoutItem label="메세지분류">
  <GSelectBox
    items={messageTypeOptions}
    valueKey="CD_VAL"
    labelKey="CD_VAL_NM"
    value={detailData.MSG_CLSS_CD}
    fieldName="MSG_CLSS_CD"
    onFieldChange={handleFieldChange}
    toplabel="S"
  />
</GLayoutItem>
```

### 6.3 GDatePicker 컴포넌트

단일 날짜 선택 컴포넌트입니다.

#### 구조
```jsx
<GDatePicker
  value={date}
  onChange={(v) => setDate(v)}
  format="YYYY-MM-DD"
  placeholder="날짜 선택"
/>
```

#### 파라미터

| 파라미터          | 타입          | 기본값        | 설명                          |
|-------------------|---------------|--------------|-------------------------------|
| `value`           | string        | -            | 날짜 값 (format 형식 문자열)   |
| `onChange`        | function      | -            | 변경 핸들러 `(dateString) => void` |
| `format`          | string        | `'YYYY-MM-DD'` | 날짜 형식                    |
| `placeholder`     | string        | `'날짜 선택'` | placeholder 텍스트            |
| `width`           | string/number | `'100%'`     | 너비                          |
| `height`          | number        | `25`         | 높이 (px)                     |
| `disabled`        | boolean       | `false`      | 비활성화                      |
| `showCalendarIcon` | boolean       | `false`      | 캘린더 아이콘 표시             |
| `allowClear`      | boolean       | `true`       | 클리어 버튼 표시               |
| `style`           | object        | `{}`         | 추가 스타일                   |

#### 스타일
- 기본 테두리 색상: `#c3c3c3`
- 호버 테두리 색상: `#000000` (검정색)
- 포커스 테두리 색상: `#c3c3c3`

#### 사용 예시

**조회 영역에서 사용**
```jsx
<GSearchHeader
  fields={[
    {
      header: '시작일',
      content: (
        <GDatePicker
          value={fromDate}
          onChange={(v) => setFromDate(v)}
          format="YYYY-MM-DD"
          placeholder="시작일 선택"
        />
      ),
    },
  ]}
/>
```

**상세 영역에서 사용**
```jsx
<GLayoutItem label="등록일자">
  <GDatePicker
    value={detailData.REG_DT}
    onChange={(v) => handleFieldChange('REG_DT', v)}
    format="YYYY-MM-DD"
  />
</GLayoutItem>
```

### 6.4 GDateRangePicker 컴포넌트

날짜 범위 선택 컴포넌트입니다.

#### 구조
```jsx
<GDateRangePicker
  value={[fromDate, toDate]}
  onChange={([from, to]) => {
    setFromDate(from);
    setToDate(to);
  }}
  format="YYYY-MM-DD"
/>
```

#### 파라미터

| 파라미터      | 타입          | 기본값                    | 설명                          |
|--------------|---------------|---------------------------|-------------------------------|
| `value`       | array         | -                         | `[시작일, 종료일]` 배열 (format 형식 문자열) |
| `onChange`    | function      | -                         | 변경 핸들러 `(dateStrings) => void` |
| `format`      | string        | `'YYYY-MM-DD'`             | 날짜 형식                     |
| `placeholder` | array         | `['시작일', '종료일']`    | placeholder 텍스트 배열      |
| `width`       | string/number | `'100%'`                   | 너비                          |
| `height`      | number        | `25`                      | 높이 (px)                     |
| `disabled`    | boolean       | `false`                   | 비활성화                      |
| `style`       | object        | `{}`                      | 추가 스타일                   |

#### 스타일
- 기본 테두리 색상: `#c3c3c3`
- 호버 테두리 색상: `#000000` (검정색)
- 포커스 테두리 색상: `#c3c3c3`
- 구분자: `~`

#### 사용 예시

**조회 영역에서 사용**
```jsx
<GSearchHeader
  fields={[
    {
      header: '기간',
      content: (
        <GDateRangePicker
          value={[fromDate, toDate]}
          onChange={([from, to]) => {
            setFromDate(from);
            setToDate(to);
          }}
          format="YYYY-MM-DD"
          placeholder={['시작일', '종료일']}
        />
      ),
    },
  ]}
/>
```

### 6.5 GCodePicker 컴포넌트

공통코드 선택 팝업 컴포넌트입니다. 내부적으로 `GLayoutItem`을 포함하고 있습니다.

#### 구조
```jsx
<GCodePicker
  label="사용공통코드"
  value={codeValue}
  display={codeName}
  onChange={(value, row) => {
    setCodeValue(value);
    setCodeName(row?.CD_VAL_NM);
  }}
  cacheKey="GRP_TP_CD"
  title="사용공통코드"
/>
```

#### 파라미터

| 파라미터    | 타입     | 기본값            | 설명                          |
|------------|----------|-------------------|-------------------------------|
| `label`     | string   | -                 | 레이블 텍스트                  |
| `value`     | string   | -                 | 선택된 코드값 (CD_VAL)         |
| `display`   | string   | -                 | 선택된 코드명 (CD_VAL_NM)      |
| `onChange`  | function | -                 | 변경 핸들러 `(value, row) => void` |
| `readOnly`  | boolean  | `false`           | 읽기 전용                      |
| `required`  | boolean  | `false`           | 필수 선택                      |
| `cacheKey`  | string   | -                 | 캐시 키 (예: `'GRP_TP_CD'`)    |
| `title`     | string   | `'사용공통코드'`   | 팝업 타이틀                    |
| `className` | string   | -                 | 추가 클래스명                  |

#### 특징
- 내부적으로 `GLayoutItem`을 포함하므로 외부에서 `GLayoutItem`으로 감쌀 필요 없음
- `cacheCode` 유틸리티를 사용하여 서버 캐시에서 데이터 로드
- `GPopup` 컴포넌트를 사용하여 코드 선택 팝업 표시
- 검색 아이콘 클릭 시 팝업 오픈

#### 사용 예시

**상세 영역에서 사용**
```jsx
<GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
  <GCodePicker
    label="사용공통코드"
    value={detailData.GRP_CD_ID}
    display={detailData.GRP_NM}
    onChange={(value, row) => {
      handleFieldChange('GRP_CD_ID', value);
      handleFieldChange('GRP_NM', row?.CD_VAL_NM);
    }}
    cacheKey="GRP_TP_CD"
    title="사용공통코드"
  />
</GLayoutGroup>
```

**참고:** `GCodePicker`는 내부적으로 `GLayoutItem`을 포함하므로, 외부에서 `GLayoutItem`으로 감싸지 않아도 됩니다.

### 6.6 입력 컴포넌트 적용 규칙

#### 조회 영역
- ✅ `GSearchHeader`의 `fields` 배열 내부에서 사용
- ✅ `TextField`는 `fullWidth` prop 사용
- ✅ Enter 키로 검색 가능하도록 `onKeyDown` 처리
- ✅ `GDateRangePicker`는 기간 검색에 사용

#### 상세 영역
- ✅ `GLayoutItem` 내부에서 사용
- ✅ `fieldName`과 `onFieldChange`를 사용하여 일관된 데이터 바인딩
- ✅ `isReadOnly`, `isRequired` prop으로 상태 표시
- ✅ 멀티라인 입력은 `GTextField`에 `multiline`, `minRows`, `height` 설정
- ✅ `GCodePicker`는 외부 `GLayoutItem` 없이 직접 사용

#### 공통 규칙
- ✅ 모든 입력 컴포넌트는 표준 컴포넌트 사용 (`GTextField`, `GSelectBox`, `GDatePicker`, `GDateRangePicker`, `GCodePicker`)
- ✅ 날짜 형식은 `'YYYY-MM-DD'`로 통일
- ✅ 읽기 전용 필드는 `isReadOnly={true}` 설정
- ✅ 필수 입력 필드는 `isRequired={true}` 설정

---

## 전체 화면 구조 예시

### 예시 1: 검색 영역 + 그리드 + 상세 영역 (GPCLOPRCD01S1)

```jsx
import GPageContainer from '@/components/GPageContainer';
import GSearchSection from '@/components/GSearchSection';
import GSearchHeader from '@/components/GSearchHeader';
import GContentBox from '@/components/GContentBox';
import GDataGrid from '@/components/GDataGrid';
import GButtonGroup from '@/components/GButtonGroup';
import GButton from '@/components/GButton';
import GSelectBox from '@/components/GSelectBox';
import { TextField } from '@mui/material';
import { paginationCenterSx, paginationInitialState } from '@/components/GPagination';

export default function GPCLOPRCD01S1() {
  const [grpNm, setGrpNm] = useState('');
  const [grpTpCd, setGrpTpCd] = useState('');
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedGrpId, setSelectedGrpId] = useState(null);
  const [lstGrpTpCd, setLstGrpTpCd] = useState([]);

  const handleInitialize = () => {
    setGrpNm('');
    setGrpTpCd('');
  };

  const getGroups = async () => {
    // 조회 로직
  };

  return (
    <GPageContainer>
      {/* 1. 조회 영역 */}
      <GSearchSection>
        <GSearchHeader
          fields={[
            {
              header: '공통코드명',
              content: (
                <TextField
                  fullWidth
                  name="text"
                  value={grpNm}
                  onChange={(e) => setGrpNm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      getGroups();
                    }
                  }}
                  placeholder="공통코드명 입력"
                />
              ),
            },
            {
              header: '그룹유형',
              content: (
                <GSelectBox 
                  items={lstGrpTpCd}
                  valueKey="CD_VAL"
                  labelKey="CD_VAL_NM"
                  toplabel="A"
                  value={grpTpCd}
                  onChange={(v) => setGrpTpCd(v)}
                />
              ),
            },
            {}, // 빈 필드 (여백)
            {}  // 빈 필드 (여백)
          ]}
          buttons={[
            <GButton key="init" auth="Init" label="Initialize" onClick={handleInitialize} />,
            <GButton key="search" auth="Search" label="Search" onClick={getGroups} />,
          ]}
        />
      </GSearchSection>

      {/* 2. 그리드 영역 (고정 높이) */}
      <GContentBox flex={false} marginBottom="8px">
        <GDataGrid
          title="공통코드그룹"
          rows={groups}
          columns={groupColumns}
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          columnHeaderHeight={30}
          rowHeight={25}
          onRowsChange={setGroups}
          onRowClick={(params) => {
            setSelectedGrpId(params.row);
            getItems(params.row);
          }}
        />
        <GButtonGroup>
          <GButton key="save" auth="Save" label="Save" onClick={saveGroup} />
        </GButtonGroup>
      </GContentBox>

      {/* 3. 하단 그리드 영역 (확장 가능) */}
      <GContentBox flex={true}>
        <GDataGrid
          title="공통코드"
          rows={items}
          columns={itemColumns}
          pagination={true}
          pageSizeOptions={[50, 100]}
          initialState={paginationInitialState}
          sx={paginationCenterSx}
          Buttons={{ add: true, delete: true, revert: true, excel: true }}
          columnHeaderHeight={30}
          rowHeight={25}
          onRowsChange={setItems}
        />
        <GButtonGroup>
          <GButton key="save" auth="Save" label="Save" onClick={saveCode} />
        </GButtonGroup>
      </GContentBox>
    </GPageContainer>
  );
}
```

### 예시 2: 트리 + 상세 영역 (GPCLOPRUS01S1)

```jsx
import GPageContainer from '@/components/GPageContainer';
import GContentBox from '@/components/GContentBox';
import GSimpleTreeGrid from '@/components/GSimpleTreeGrid';
import GDataGrid from '@/components/GDataGrid';
import GDetailTitle from '@/components/GDetailTitle';
import GLayoutGroup from '@/components/GLayoutGroup';
import GLayoutItem from '@/components/GLayoutItem';
import GTextField from '@/components/GTextField';
import GButtonGroup from '@/components/GButtonGroup';
import GButton from '@/components/GButton';
import { Box, Stack } from '@mui/material';

export default function GPCLOPRUS01S1() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <GPageContainer>
      {/* 상단: 소속그룹 영역 (고정 높이) */}
      <GContentBox flex={false} marginBottom="8px">
        <Stack direction="row" spacing={2} height={345}>
          {/* 왼쪽: 트리 그리드 */}
          <Box sx={{ flex: 4, overflow: 'hidden' }}>
            <GSimpleTreeGrid
              rows={groups}
              onRowsChange={handleGroupRowsChange}
              idField="USR_GRP_ID"
              parentIdField="UP_USR_GRP_ID"
              labelField="USR_GRP_NM"
              columnLabel="사용자그룹명"
              title="소속그룹"
              selectedItem={selectedGroup}
              onSelectedItemChange={handleGroupSelect}
              Buttons={{ add: true, delete: true, revert: true, excel: false }}
              sx={{ height: '100%' }}
            />
          </Box>

          {/* 오른쪽: 상세 영역 */}
          <Stack flex={6}>
            <GDetailTitle title="사용자 그룹 정보" />
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
                <GLayoutItem label="그룹ID">
                  <GTextField 
                    value={selectedGroup?.USR_GRP_ID || ''} 
                    isReadOnly={true} 
                  />
                </GLayoutItem>
                <GLayoutItem label="그룹명">
                  <GTextField 
                    value={selectedGroup?.USR_GRP_NM || ''} 
                    fieldName="USR_GRP_NM"
                    onFieldChange={handleGroupFieldChange}
                    isRequired={true}
                  />
                </GLayoutItem>
              </GLayoutGroup>
            </Box>

            <GButtonGroup>
              <GButton auth="Save" label="Save" onClick={saveGroup} />
            </GButtonGroup>
          </Stack>
        </Stack>
      </GContentBox>

      {/* 하단: 사용자 영역 (확장 가능) */}
      <GContentBox flex={true}>
        <Box sx={{ 
          flex: 1, 
          minHeight: 0, 
          display: 'flex', 
          gap: 2,
          overflow: 'hidden'
        }}>
          <Stack direction="row" spacing={2} sx={{ flex: 1, width: '100%' }}>
            {/* 왼쪽: 사용자 그리드 */}
            <Box sx={{ 
              flex: 4, 
              minHeight: 0, 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <GDataGrid
                title={`사용자 Total (${users.length})`}
                rows={users}
                columns={userColumns}
                Buttons={{ add: true, delete: true, revert: true, excel: false }}
                columnHeaderHeight={30}
                rowHeight={25}
                pagination={false}
                hideFooter
                onRowClick={handleUserRowClick}
              />
            </Box>

            {/* 오른쪽: 사용자 상세 영역 */}
            <Stack flex={6}>
              <GDetailTitle title="사용자 정보" />
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <GLayoutGroup itemBorder="1px solid #ddd" labelWidth={130}>
                  {/* 사용자 입력 필드들 */}
                </GLayoutGroup>
              </Box>
              <GButtonGroup>
                <GButton auth="Save" label="Save" onClick={saveUser} />
              </GButtonGroup>
            </Stack>
          </Stack>
        </Box>
      </GContentBox>
    </GPageContainer>
  );
}
```

---

## 체크리스트

새로운 화면을 개발할 때 다음 항목을 확인하세요:

### ✅ 전체 레이아웃
- [ ] 최상위에 `GPageContainer` 사용
- [ ] 기본 파라미터로 충분한지 확인
- [ ] 그리드나 컨텐츠 영역은 `GContentBox`로 감싸기
- [ ] 고정 높이 영역: `flex={false}`, `marginBottom="8px"`
- [ ] 확장 가능 영역: `flex={true}`

### ✅ 그리드
- [ ] 페이징이 필요한 경우: `pagination={true}`, `pageSizeOptions={[50, 100]}`, `initialState={paginationInitialState}`, `sx={paginationCenterSx}` 설정
- [ ] `columnHeaderHeight={30}`, `rowHeight={25}` 설정
- [ ] 버튼은 `Buttons={{ add, delete, revert, excel }}` 형태로 객체 전달

### ✅ 조회 영역
- [ ] `GSearchSection`으로 `GSearchHeader` 감싸기
- [ ] 입력 컴포넌트는 표준 컴포넌트 사용 (GTextField, GSelectBox, GDatePicker 등)
- [ ] Enter 키로 검색 가능하도록 처리

### ✅ 디테일 영역
- [ ] `GDetailTitle`로 섹션 제목 표시
- [ ] `GLayoutGroup`과 `GLayoutItem`으로 레이아웃
- [ ] `itemBorder="1px solid #ddd"`, `labelWidth={130}` 설정
- [ ] 입력 컴포넌트는 표준 컴포넌트 사용

### ✅ 버튼 영역
- [ ] `GButtonGroup`으로 버튼들 감싸기
- [ ] `GButton` 컴포넌트 사용, `auth` 속성 필수
- [ ] 상세 영역 검색 버튼은 `iconOnly` 모드 사용

---

## 참고 자료

### 컴포넌트 위치
- `src/components/GPageContainer.jsx`
- `src/components/GContentBox.jsx`
- `src/components/GSearchSection.jsx`
- `src/components/GDetailTitle.jsx`
- `src/components/GButtonGroup.jsx`
- `src/components/GDataGrid.jsx`
- `src/components/GSimpleTreeGrid.jsx`
- `src/components/GDataTreeGrid.jsx`
- `src/components/GPagination.jsx`
- `src/components/GLayoutGroup.jsx`
- `src/components/GLayoutItem.jsx`
- `src/components/GButton.jsx`
- `src/components/GTextField.jsx`
- `src/components/GSelectBox.jsx`
- `src/components/GSearchHeader.jsx`

### 예시 화면 위치
- `src/screens/GPCL/OPR/User/GPCLOPRUS01S1.jsx`
- `src/screens/GPCL/OPR/Menu/GPCLOPRMN01S1.jsx`
- `src/screens/GPCL/OPR/Authority/GPCLOPRAH01S1.jsx`
- `src/screens/GPCL/OPR/Authority/GPCLOPRAH02S1.jsx`
- `src/screens/GPCL/OPR/Code/GPCLOPRCD01S1.jsx`
- `src/screens/GPCL/OPR/Code/GPCLOPRCD03S1.jsx`
- `src/screens/GPCL/OPR/Code/GPCLOPRCD04S1.jsx`
- `src/screens/GPCL/OPR/Monitor/GPCLOPRMT02S1.jsx`
- `src/screens/GPCL/OPR/Monitor/GPCLOPRMT03S1.jsx`
- `src/screens/GPCL/OPR/Log/GPCLOPRLG02S1.jsx`
- `src/screens/GPCL/OPR/Log/GPCLOPRLG01S1.jsx` (예외현황)

---

## 예외 처리 (Exception Handling)

GODIS 시스템은 전역 예외 처리 메커니즘을 통해 모든 예외를 일관되게 처리하고, 자동으로 데이터베이스에 로그를 저장합니다.

### 개요

- **전역 예외 처리기**: `GlobalExceptionHandler`가 모든 컨트롤러 예외를 자동 처리
- **자동 로그 저장**: 모든 예외는 `GPCL_EXCPT_LOG` 테이블에 자동 저장
- **프론트엔드 자동 처리**: 서버 에러 응답 시 자동으로 팝업 표시
- **예외 분류**: UI 오류(U), Service 오류(S), DB 오류(D)

---

### 1. 백엔드 예외 처리

#### 1.1 예외 처리 흐름

```
[Controller/Service] → [예외 발생] → [GlobalExceptionHandler] → [응답 생성] → [DB 로그 저장]
                                                              ↓
                                                      [프론트엔드 응답]
```

#### 1.2 예외 타입별 처리

| 예외 타입 | 처리 클래스 | HTTP 상태 | errorType | EXCPT_LOC_TP_CD |
|---------|-----------|----------|-----------|----------------|
| 비즈니스 로직 예외 | `BizException` | 400 Bad Request | BIZ | S (Service) |
| 데이터베이스 예외 | `DataAccessException`, `SQLException` | 500 Internal Server Error | DB | D (DB) |
| 요청 검증 예외 | `HttpMessageNotReadableException`, `IllegalArgumentException` | 400 Bad Request | VALIDATION | S (Service) |
| 시스템 예외 | `RuntimeException`, `Exception` | 500 Internal Server Error | SYSTEM | S (Service) |

#### 1.3 BizException 사용 방법

비즈니스 로직에서 예외를 발생시킬 때는 `BizException`을 사용합니다.

##### 기본 사용법

```java
import com.godisweb.exception.BizException;

@Service
public class MenuService {
    
    public void saveMenuData(List<Map<String, Object>> param) {
        // 필수 필드 검증
        if (param == null || param.isEmpty()) {
            throw new BizException("MGW00018", "저장할 데이터가 없습니다.");
        }
        
        // 중복 체크
        String menuId = (String) row.get("MENU_ID");
        if (isDuplicate(menuId)) {
            throw new BizException("MGI00111", "메뉴 ID");
        }
        
        // 저장 로직...
    }
}
```

##### 생성자 종류

```java
// 1. 예외 코드만 사용
throw new BizException("MGW00018");

// 2. 예외 코드 + 메시지
throw new BizException("MGW00018", "메뉴명");

// 3. 예외 코드 + 인자 배열 (메시지 코드에 파라미터 전달)
throw new BizException("MGW00018", new String[]{"메뉴명", "필수"});

// 4. 예외 코드 + 원인 예외
throw new BizException("MGW00018", cause);

// 5. 예외 코드 + 메시지 + 원인 예외
throw new BizException("MGW00018", "메뉴명", cause);
```

##### 실제 사용 예시

```java
@Service
public class MenuService {
    
    @Transactional
    public Map<String, Object> saveMenuData(List<Map<String, Object>> param) {
        // 1. 데이터 존재 여부 체크
        if (param == null || param.isEmpty()) {
            throw new BizException("MGW00018", "저장할 데이터가 없습니다.");
        }
        
        for (Map<String, Object> row : param) {
            String rowState = (String) row.get("ROW_STATE");
            
            // 2. 필수 필드 검증
            if ("I".equals(rowState) || "U".equals(rowState)) {
                String menuNm = (String) row.get("MENU_NM");
                if (menuNm == null || menuNm.trim().isEmpty()) {
                    throw new BizException("MGW00018", "메뉴명");
                }
                
                // 3. INSERT 시 중복 체크
                if ("I".equals(rowState)) {
                    String menuId = (String) row.get("MENU_ID");
                    if (menuId == null || menuId.trim().isEmpty()) {
                        throw new BizException("MGW00018", "메뉴 ID");
                    }
                    
                    // 중복 체크
                    LinkedHashMap<String, Object> checkParam = new LinkedHashMap<>();
                    checkParam.put("MENU_ID", menuId);
                    List<Map<String, Object>> existingMenu = menuMapper.selectMenuList(checkParam);
                    if (existingMenu != null && !existingMenu.isEmpty()) {
                        throw new BizException("MGI00111", "메뉴 ID");
                    }
                }
            }
        }
        
        // 저장 로직 실행...
        return result;
    }
}
```

#### 1.4 예외 응답 형식

백엔드에서 예외가 발생하면 다음 형식으로 응답합니다:

```json
{
  "success": false,
  "errorType": "BIZ",  // BIZ | DB | VALIDATION | SYSTEM
  "code": "MGW00018",  // BizException인 경우
  "args": "[\"메뉴명\"]",  // BizException에 인자가 있는 경우
  "message": "메뉴명은 필수입니다."
}
```

#### 1.5 자동 로그 저장

모든 예외는 자동으로 `GPCL_EXCPT_LOG` 테이블에 저장됩니다:

- **EXCPT_LOC_TP_CD**: 예외 위치 구분 코드 (U: UI, S: Service, D: DB)
- **USR_ID**: 현재 로그인한 사용자 ID
- **MENU_ID**: 프론트엔드에서 전달한 `X-Menu-Id` 헤더 값
- **EXCPT_MSG_CONTN**: 예외 메시지 (최대 2000자)
- **EXCPT_TRACE_CONTN**: 스택 트레이스 (최대 4000자, 최대 20줄)
- **SYS_TP_CD**: 캐시에서 조회한 시스템 구분 코드 (기본값: "STO")

---

### 2. 프론트엔드 예외 처리

#### 2.1 자동 예외 처리

프론트엔드는 `Protocol.jsx`의 HTTP 클라이언트를 통해 자동으로 예외를 처리합니다.

##### 처리 흐름

```
[HTTP 요청] → [서버 에러 응답] → [Protocol.jsx 자동 감지] → [GMessageBox 팝업 표시]
```

##### 자동 처리 내용

- 서버에서 `success: false` 응답 시 자동으로 팝업 표시
- `errorType`에 따라 다른 팝업 타입 표시:
  - `BIZ`: warning 타입
  - `DB`: error 타입
  - `VALIDATION`: info 타입
  - `SYSTEM`: error 타입
- `code`가 있으면 `GMessageBox.Show(code, 'Ok', ...args)` 호출
- `code`가 없으면 `GMessageBox.ShowEx()` 호출

##### 예시 코드 (자동 처리되므로 별도 코드 불필요)

```jsx
// 별도의 예외 처리 코드가 필요 없습니다!
// Protocol.jsx가 자동으로 처리합니다.

const handleSave = async () => {
  try {
    await http.post('/admin/savemenudata', data);
    message.success('저장되었습니다.');
  } catch (e) {
    // catch 블록은 선택사항입니다.
    // 서버 에러는 이미 팝업으로 표시되었습니다.
  }
};
```

#### 2.2 UI 오류 처리

프론트엔드에서 발생한 JavaScript 오류는 자동으로 서버에 전송되어 로그로 저장됩니다.

##### 처리 메커니즘

- **window.onerror**: 일반 JavaScript 오류
- **unhandledrejection**: Promise rejection 오류
- **ErrorBoundary**: React 컴포넌트 오류

##### 오류 전송

`ErrorHandler.jsx`가 자동으로 오류를 `/api/error/log`로 전송합니다:

```javascript
// 자동으로 처리되므로 별도 코드 불필요
// ErrorHandler.jsx가 초기화 시 자동 등록됨
```

##### 오류 정보

- **message**: 오류 메시지
- **stack**: 스택 트레이스
- **url**: 현재 페이지 URL
- **menuId**: 현재 활성 메뉴 ID (자동 추출)

---

### 3. 데이터베이스 예외 처리

#### 3.1 자동 처리

데이터베이스 예외는 `GlobalExceptionHandler`가 자동으로 처리합니다:

- **DataAccessException**: Spring의 데이터 접근 예외 (MyBatis, JPA 등)
- **SQLException**: 직접 발생한 SQL 예외

#### 3.2 처리 내용

- HTTP 500 (Internal Server Error) 응답
- `errorType: "DB"` 설정
- `EXCPT_LOC_TP_CD: "D"` 로그 저장
- SQLException인 경우 상세 메시지 포함

#### 3.3 예시

```java
// MyBatis에서 예외 발생 시 자동 처리
@Mapper
public interface MenuMapper {
    // SQL 오류 발생 시 자동으로 DataAccessException으로 변환되어 처리됨
    int insertMenuInfo(Map<String, Object> row);
}
```

---

### 4. 예외 로그 조회

예외 로그는 **GPCLOPRLG01S1 (예외현황)** 화면에서 조회할 수 있습니다.

#### 4.1 조회 조건

- 발생일자 (범위)
- 사용자ID
- 메뉴ID
- 오류위치 (전체/UI/Service/DB)

#### 4.2 조회 항목

- 발생일시
- 사용자ID
- 메뉴ID / 메뉴명
- 오류위치 (UI/Service/DB)
- 화면URL
- 예외메시지
- 예외추적내용 (스택 트레이스)
- 사용자IP / 서버IP

---

### 5. 예외 처리 체크리스트

#### ✅ 백엔드 개발 시

- [ ] 비즈니스 로직 검증 실패 시 `BizException` 사용
- [ ] 예외 코드는 메시지 코드 테이블에 등록된 코드 사용
- [ ] 예외 메시지는 사용자에게 표시될 수 있도록 명확하게 작성
- [ ] 중복 체크, 필수 필드 검증 등은 서비스 레이어에서 처리
- [ ] 트랜잭션 처리 시 `@Transactional` 사용

#### ✅ 프론트엔드 개발 시

- [ ] HTTP 요청은 `http` 객체 사용 (자동 예외 처리)
- [ ] 별도의 try-catch는 선택사항 (자동으로 팝업 표시됨)
- [ ] 서버 에러 응답은 자동 처리되므로 추가 코드 불필요
- [ ] UI 오류는 자동으로 서버에 전송되므로 별도 처리 불필요

#### ✅ 예외 로그 확인

- [ ] 예외 발생 시 GPCLOPRLG01S1 화면에서 로그 확인
- [ ] EXCPT_LOC_TP_CD로 오류 위치 확인 (U/S/D)
- [ ] EXCPT_TRACE_CONTN으로 스택 트레이스 확인

---

### 6. 참고 자료

#### 백엔드 파일 위치

- `src/main/java/com/godisweb/exception/BizException.java`
- `src/main/java/com/godisweb/exception/GlobalExceptionHandler.java`
- `src/main/java/com/godisweb/service/LogService.java`
- `src/main/java/com/godisweb/controller/admin/ExceptionController.java`
- `src/main/java/com/godisweb/service/admin/ExceptionService.java`
- `src/main/java/com/godisweb/mapper/admin/ExceptionMapper.java`
- `src/main/resources/mapper/admin/ExceptionMapper.xml`

#### 프론트엔드 파일 위치

- `src/libs/Protocol.jsx` (HTTP 클라이언트, 자동 예외 처리)
- `src/libs/ErrorHandler.jsx` (UI 오류 처리)
- `src/screens/GPCL/OPR/Log/GPCLOPRLG01S1.jsx` (예외현황 화면)

#### 데이터베이스 테이블

- `GPCL_EXCPT_LOG`: 예외 로그 저장 테이블



#### GCodePicker 사용 예시
```javaScript
<GCodePicker
  label="사용공통코드(그룹유형)"
  valueVar = '코드ID'           // GPopup에서 가져다 쓸 Value
  displayVar = '코드명'         // GPopup에서 가져다 쓸 display
  value={drvSelectedClssCode?.GRP_NM || ''} 
  display={drvSelectedClssCode?.GRP_NM || ''} 
  onChange={(val, row) => {
    updateSelectedClssCode({
      GRP_CD_ID: val,
      GRP_NM: row?.코드명 || '',
      CD_VAL : ''
    });

    /* 사용공통코드 값 변경 시, 연결코드 콤보 박스를 재조회 한다.*/
    getCboCache(val);
  }}
  cacheKey="SEARCH_COMMOMCODEGRP"     /* GCodePicker의 서버단 쿼리 중 하나로, 별개의 쿼리가 필요할 시 추가할 것.*/
  required={true}
/>
```
1. valueVar/displayVar 설정을 통해 실 사용 value와 display 값 지정
  -> 캐시를 사용한다면 정해진 칼럼을 사용하기 때문에 연관이 없으나, DB 조회 시 칼럼 명이 모두 다름(ASIS 기준)
2. 사용할 키 값은 cacheKey에 설정.
3. 관련 서버단 소스는 CodePickerController 및 관련 소스 참조.

---