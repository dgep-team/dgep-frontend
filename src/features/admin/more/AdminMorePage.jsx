import { LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { staffLogout } from '../../../services/adminService.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const ROLE_LABELS = { MANAGER: 'Manager', RECEPTION: 'Reception', HOUSEKEEPING: 'Housekeeping', MAINTENANCE: 'Maintenance' }

/** Signed-in staff member and log out. Requests, rooms and staff screens can join this menu later. */
export function AdminMorePage() {
  const { staff } = useStaffSession()
  const navigate = useNavigate()

  const logout = () => {
    staffLogout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminScreen title="More">
      <Card>
        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            <UserRound size={22} />
          </span>
          <span className={styles.text}>
            <span className={styles.primary}>{[staff?.firstName, staff?.lastName].filter(Boolean).join(' ') || 'Staff member'}</span>
            <span className={styles.secondary}>
              {[ROLE_LABELS[staff?.role] ?? staff?.role, staff?.email].filter(Boolean).join(' · ')}
            </span>
          </span>
        </div>
      </Card>
      <Button fullWidth variant="secondary" onClick={logout} iconRight={<LogOut size={18} aria-hidden="true" />}>
        Log out
      </Button>
    </AdminScreen>
  )
}
