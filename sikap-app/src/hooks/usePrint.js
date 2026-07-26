// ============================================================
// src/hooks/usePrint.js — Wrapper react-to-print v3 API
// ============================================================
import { useReactToPrint } from 'react-to-print'

/**
 * usePrint — abstraksi react-to-print v3 (pakai contentRef)
 * @param {React.RefObject} contentRef - ref ke elemen yang akan di-print
 * @param {string} documentTitle - nama file saat save PDF dari print dialog
 * @param {string} [pageStyle] - custom @page CSS
 */
export function usePrint(contentRef, documentTitle = 'Laporan', pageStyle = '') {
  const defaultPageStyle = `
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
    }
  `
  return useReactToPrint({
    contentRef,
    documentTitle,
    pageStyle: pageStyle || defaultPageStyle,
  })
}
