import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import styles from './Alert.module.css'

const ICONS = { error: CircleAlert, warning: TriangleAlert, info: Info, success: CircleCheck }

/** Inline message. Errors are announced immediately (role="alert"). */
export function Alert({ tone = 'info', title, children, actions, ...rest }) {
  const Icon = ICONS[tone]
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'} {...rest}>
      <Icon className={styles.icon} size={20} aria-hidden="true" />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.text}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  )
}
