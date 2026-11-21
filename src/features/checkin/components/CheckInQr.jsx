import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import styles from './CheckIn.module.css'

/**
 * The booking reference as a QR code, drawn on the device (the API has no QR
 * endpoint). Front desk staff scan it instead of typing the reference.
 */
export function CheckInQr({ bookingId }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    let active = true
    QRCode.toString(bookingId, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#141b2d', light: '#ffffff' } })
      .then((svg) => active && setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`))
      .catch(() => active && setSrc(null))
    return () => {
      active = false
    }
  }, [bookingId])

  return (
    <section className={styles.qrSection} aria-labelledby="qr-heading">
      <h2 id="qr-heading" className={styles.qrTitle}>
        Your Check-In QR Code
      </h2>
      <div className={styles.qrFrame}>
        {src ? (
          <img src={src} alt={`QR code for booking reference ${bookingId}`} className={styles.qrImage} />
        ) : (
          <span className={styles.qrPlaceholder} aria-hidden="true" />
        )}
      </div>
      <p className={styles.helpText}>Show this at the front desk to collect your key.</p>
    </section>
  )
}
