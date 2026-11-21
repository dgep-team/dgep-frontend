import { ChevronRight, DoorOpen, LogOut, UserRound, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { staffLogout } from '../../../services/adminService.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { can, personName, roleLabel } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const LINKS = [
  { to: '/admin/rooms', label: 'Rooms', description: 'Availability and adding rooms', icon: DoorOpen, permission: 'frontDesk' },
  { to: '/admin/staff', label: 'Staff', description: 'Your team and adding staff', icon: Users },
]

/** Rooms, Staff, the signed-in staff member and log out. */
export function AdminMorePage() {
  const { staff } = useStaffSession()
  const navigate = useNavigate()

  const logout = () => {
    staffLogout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminScreen title="More">
      <ul className={styles.menuList}>
        {LINKS.filter((link) => !link.permission || can(staff, link.permission)).map(({ to, label, description, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className={styles.row}>
              <span className={`${styles.avatar} ${styles.avatarAccent}`} aria-hidden="true">
                <Icon size={20} />
              </span>
              <span className={styles.text}>
                <span className={styles.primary}>{label}</span>
                <span className={styles.secondary}>{description}</span>
              </span>
              <ChevronRight size={20} className={styles.chevron} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <Card>
        <div className={styles.profile}>
          <span className={styles.avatar} aria-hidden="true">
            <UserRound size={22} />
          </span>
          <span className={styles.text}>
            <span className={styles.primary}>{personName(staff) ?? 'Staff member'}</span>
            <span className={styles.secondary}>{[roleLabel(staff?.role), staff?.email].filter(Boolean).join(' · ')}</span>
          </span>
        </div>
      </Card>
      <Button fullWidth variant="secondary" onClick={logout} iconRight={<LogOut size={18} aria-hidden="true" />}>
        Log out
      </Button>
    </AdminScreen>
  )
}
