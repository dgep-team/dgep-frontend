import styles from './Card.module.css'

/** tone: 'default' (white) | 'muted' (ivory) | 'accent' (light blue) */
export function Card({ as: Tag = 'section', tone = 'default', className = '', children, ...rest }) {
  return (
    <Tag className={`${styles.card} ${styles[tone]} ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

export function Divider() {
  return <hr className={styles.divider} />
}
