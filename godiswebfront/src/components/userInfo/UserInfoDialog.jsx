import { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import UserInfoCard from "./UserInfoCard";

export default function UserInfoDialog({ open, onClose }) {
  const { user } = useAuth(); // { userId, userNm, usrGrpNm, ... }

  const viewModel = useMemo(() => {
    if (!user) return null;
    return {
      username: user.userId ?? "",
      displayName: user.userNm ?? "",
      department: user.usrGrpNm ?? user.department ?? "",
      position: user.position ?? "",
      accountType: user.accountType ?? "-",
      groupId: user.usrGrpId ?? "",
      authorities: Array.isArray(user.authorities) ? user.authorities : [],
    };
  }, [user]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {/* DOM nesting 경고 방지 */}
        <Typography variant="h6" component="div">User Information</Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {!viewModel ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            로그인 정보가 없습니다. (세션 만료 또는 미로그인)
          </Typography>
        ) : (
          <UserInfoCard user={viewModel} />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
