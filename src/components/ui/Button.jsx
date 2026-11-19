import { Link } from 'react-router'
import styles from './Button.module.css'

/**
 * Renders a <Link> when `to` is given, otherwise a <button>.
 * variant: 'primary' | 'secondary' | 'ghost'
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  loadingLabel,
  iconRight,
  to,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
      {!loading && iconRight}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  )
}
