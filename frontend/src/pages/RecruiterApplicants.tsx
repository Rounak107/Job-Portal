import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Select,
  MenuItem,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ApplicantRow = {
  id: number;                 // application id
  status: 'PENDING' | 'REJECTED' | 'SHORTLISTED' | 'REVIEWED' | 'ACCEPTED';
  appliedAt: string;
  resumeUrl?: string | null;
  user: { id: number; name: string; email: string } | null;
  job: { id: number; title: string } | null;
};

function getToken() {
  try { return localStorage.getItem('jobportal_token') || ''; } catch { return ''; }
}

const statusDisplayToEnum: Record<string, ApplicantRow['status']> = {
  Pending: 'PENDING',
  Rejected: 'REJECTED',
  Selected: 'SHORTLISTED', // <- maps "Selected" to SHORTLISTED
};

const enumToStatusDisplay: Record<ApplicantRow['status'], string> = {
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  SHORTLISTED: 'Selected',
  REVIEWED: 'Reviewed',
  ACCEPTED: 'Accepted',
};

export default function RecruiterApplicants() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApplicantRow[]>([]);
  const [editStatus, setEditStatus] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  }), []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        // If you want to filter by jobId, add ?jobId=123 to this URL
        const res = await fetch('/api/applications/recruiter/applicants', {
          headers: authHeaders,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Failed to load applicants (${res.status})`);
        const data = await res.json();
        const applicants: ApplicantRow[] = (data.applicants || data.items || []).map((a: any) => ({
          id: a.id,
          status: a.status,
          appliedAt: a.appliedAt || a.createdAt,
          resumeUrl: a.resumeUrl ?? null,
          user: a.user ?? null,
          job: a.job ?? null,
        }));
        setRows(applicants);
        // initialize dropdown selections with current status labels
        const init: Record<number, string> = {};
        applicants.forEach(r => { init[r.id] = enumToStatusDisplay[r.status] || 'Pending'; });
        setEditStatus(init);
      } catch (e: any) {
        setToast({ open: true, message: e?.message || 'Failed to load applicants', severity: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [authHeaders]);

  async function confirmUpdate(appId: number) {
    try {
      const display = editStatus[appId] || 'Pending';
      const next = statusDisplayToEnum[display] || 'PENDING';

      setSaving(s => ({ ...s, [appId]: true }));

      const res = await fetch(`${API_BASE}/api/applications/applications/${appId}/status`, {
  method: 'PATCH',
  headers: authHeaders,
  body: JSON.stringify({ status: next }),
});

if (!res.ok) {
  const j = await res.json().catch(() => ({}));
  throw new Error(j?.message || `Update failed (${res.status})`);
}

      // optimistic UI: update that row
      setRows(prev => prev.map(r => (r.id === appId ? { ...r, status: next } : r)));

      setToast({
        open: true,
        message: 'Status updated and email sent.',
        severity: 'success',
      });
    } catch (e: any) {
      setToast({ open: true, message: e?.message || 'Failed to update status', severity: 'error' });
    } finally {
      setSaving(s => ({ ...s, [appId]: false }));
    }
  }

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="max-w-6xl mx-auto py-6">
      <Card className="shadow-xl">
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5" fontWeight={800}>Applicants</Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {rows.length}
            </Typography>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Job</TableCell>
                <TableCell>Applied</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.user?.name || '—'}</TableCell>
                  <TableCell>{r.user?.email || '—'}</TableCell>
                  <TableCell>{r.job?.title || '—'}</TableCell>
                  <TableCell>{new Date(r.appliedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={editStatus[r.id] ?? enumToStatusDisplay[r.status] ?? 'Pending'}
                      onChange={(e) =>
                        setEditStatus((s) => ({ ...s, [r.id]: e.target.value as string }))
                      }
                      sx={{ minWidth: 160 }}
                    >
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Rejected">Rejected</MenuItem>
                      <MenuItem value="Selected">Selected</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="contained"
                      onClick={() => confirmUpdate(r.id)}
                      disabled={saving[r.id] === true}
                    >
                      {saving[r.id] ? 'Updating…' : 'Confirm'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No applicants yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(s => ({ ...s, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
