// A tiny one-page PDF writer: text, filled rectangles and lines in the
// built-in Helvetica fonts. Enough for a receipt, with no dependency.
//
// The built-in fonts cover plain Latin text only, so text is reduced to
// ASCII ("₦" becomes "NGN", curly quotes become straight ones).

const PAGE = { width: 595.28, height: 841.89 } // A4 in points

// Helvetica glyph widths (1/1000 em) for the characters right-aligned text
// uses (amounts, short labels); anything else uses an average width.
const WIDTHS = {
  regular: { ' ': 278, ',': 278, '.': 278, '-': 333, ':': 278, '%': 889, '(': 333, ')': 333, x: 500, N: 722, G: 778, A: 667, D: 722, I: 278, P: 667 },
  bold: { ' ': 278, ',': 278, '.': 278, '-': 333, ':': 333, '%': 889, '(': 333, ')': 333, x: 556, N: 722, G: 778, A: 722, D: 722, I: 278, P: 667, M: 833, O: 778, U: 722, T: 611 },
}
const DIGIT = 556
const AVERAGE = 556

const REPLACEMENTS = { '₦': 'NGN ', '–': '-', '—': '-', '·': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '×': 'x', '\u00a0': ' ' }

export function toPdfText(value) {
  return String(value ?? '')
    .replace(/[₦–—·’‘“”×\u00a0]/g, (char) => REPLACEMENTS[char])
    .replace(/[^\x20-\x7e]/g, '?')
}

export function textWidth(text, size, bold = false) {
  const table = bold ? WIDTHS.bold : WIDTHS.regular
  let units = 0
  for (const char of toPdfText(text)) units += /\d/.test(char) ? DIGIT : (table[char] ?? AVERAGE)
  return (units / 1000) * size
}

const escape = (text) => toPdfText(text).replace(/[\\()]/g, (char) => `\\${char}`)

/** '#1a47b8' -> '0.102 0.278 0.722' */
function rgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16)
  return [16, 8, 0].map((shift) => (((value >> shift) & 255) / 255).toFixed(3)).join(' ')
}

/**
 * Coordinates are from the top-left (like the screen), in points.
 *   const doc = createPdf()
 *   doc.rect(0, 0, doc.width, 90, '#1a47b8')
 *   doc.text('Hello', 40, 50, { size: 20, bold: true, color: '#ffffff' })
 *   const blob = doc.toBlob()
 */
export function createPdf() {
  const ops = []
  const y = (top) => (PAGE.height - top).toFixed(2)

  return {
    width: PAGE.width,
    height: PAGE.height,

    text(value, x, top, { size = 10, bold = false, color = '#141b2d', align = 'left' } = {}) {
      const width = align === 'left' ? 0 : textWidth(value, size, bold)
      const left = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x
      ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb(color)} rg ${left.toFixed(2)} ${y(top)} Td (${escape(value)}) Tj ET`)
    },

    rect(x, top, width, height, color) {
      ops.push(`${rgb(color)} rg ${x.toFixed(2)} ${y(top + height)} ${width.toFixed(2)} ${height.toFixed(2)} re f`)
    },

    line(x1, top1, x2, top2, { color = '#e6e0cf', width = 1 } = {}) {
      ops.push(`${rgb(color)} RG ${width} w ${x1.toFixed(2)} ${y(top1)} m ${x2.toFixed(2)} ${y(top2)} l S`)
    },

    /** The finished file as a string of single-byte characters. */
    build({ title = 'Document' } = {}) {
      const stream = ops.join('\n')
      const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
        `<< /Title (${escape(title)}) /Producer (StayEase) >>`,
      ]

      let out = '%PDF-1.4\n'
      const offsets = objects.map((body, index) => {
        const offset = out.length
        out += `${index + 1} 0 obj\n${body}\nendobj\n`
        return offset
      })
      const xref = out.length
      out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
      out += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
      out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\nstartxref\n${xref}\n%%EOF\n`
      return out
    },

    toBlob(options) {
      const content = this.build(options)
      const bytes = new Uint8Array(content.length)
      for (let i = 0; i < content.length; i++) bytes[i] = content.charCodeAt(i) & 0xff
      return new Blob([bytes], { type: 'application/pdf' })
    },
  }
}

/** Saves a Blob as a file via a temporary link. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
