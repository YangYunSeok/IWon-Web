import { Box } from "@mui/material";
import "./css/userInfo.css";

/**
 * props.user: { username, accountType, department, position, ... }
 * - 한 줄에 (라벨 | 값) × 2 세트 배치
 */
export default function UserInfoCard({ user }) {
  const rows = [
    // [왼 라벨, 왼 값, 오른 라벨, 오른 값]
    ["사용자", user.username, "계정유형", user.accountType],
    ["부서명", user.department, "직위", user.position],
  ];

  const safe = (v) => (v === undefined || v === null || v === "" ? "-" : v);

  return (
    <Box className="ui-card">
      {rows.map(([l1, v1, l2, v2], i) => (
        <div className="ui-row" key={i}>
          <div className="ui-label">{l1}</div>
          <div className="ui-sep">|</div>
          <div className="ui-value">{safe(v1)}</div>

          <div className="ui-spacer" />

          <div className="ui-label">{l2}</div>
          <div className="ui-sep">|</div>
          <div className="ui-value">{safe(v2)}</div>
        </div>
      ))}
    </Box>
  );
}
