import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { type QuoteItem, calcLineTotal, calcQuoteTotal } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

// Register no custom fonts — use built-in Helvetica for reliability

const BLUE = '#1e40af'
const BLUE_LIGHT = '#dbeafe'
const SLATE = '#334155'
const SLATE_LIGHT = '#94a3b8'
const BORDER = '#e2e8f0'
const BG_LIGHT = '#f8fafc'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: SLATE,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  // ── Header ──────────────────────────────────────────────
  header: {
    backgroundColor: BLUE,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flexDirection: 'column' },
  headerBrand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 4 },
  headerSub: { fontSize: 9, color: '#93c5fd' },
  headerRight: { alignItems: 'flex-end' },
  headerQuoteNum: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  headerVersion: { fontSize: 9, color: '#93c5fd', marginTop: 2 },
  headerStatus: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  headerStatusText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  // ── Body ────────────────────────────────────────────────
  body: { paddingHorizontal: 40, paddingTop: 24 },
  section: { marginBottom: 20 },
  // ── Info row ────────────────────────────────────────────
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  infoBox: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    borderRadius: 6,
    padding: 12,
    border: `1 solid ${BORDER}`,
  },
  infoLabel: { fontSize: 7, color: SLATE_LIGHT, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  infoValue: { fontSize: 9, color: SLATE, marginBottom: 3 },
  infoValueBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 3 },
  // ── Section heading ─────────────────────────────────────
  sectionHeading: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: SLATE_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  // ── Items table ─────────────────────────────────────────
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE_LIGHT,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    alignItems: 'flex-start',
  },
  tableRowAlt: { backgroundColor: BG_LIGHT },
  colProduct: { flex: 3 },
  colSize: { flex: 1.2, textAlign: 'center' },
  colColor: { flex: 1.2, textAlign: 'center' },
  colQty: { flex: 0.8, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colDiscount: { flex: 0.9, textAlign: 'center' },
  colLead: { flex: 1.5 },
  colTotal: { flex: 1.2, textAlign: 'right' },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BLUE, textTransform: 'uppercase', letterSpacing: 0.3 },
  tdText: { fontSize: 8.5, color: SLATE },
  tdTextBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  tdSub: { fontSize: 7, color: SLATE_LIGHT, marginTop: 2 },
  // ── Mockup image per item ─────────────────────────────
  itemMockup: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  mockupImage: { width: 70, height: 70, borderRadius: 4, objectFit: 'contain' },
  mockupCaption: { fontSize: 7, color: SLATE_LIGHT, marginTop: 4 },
  // ── Totals ───────────────────────────────────────────────
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: SLATE, marginRight: 24 },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: BLUE, minWidth: 80, textAlign: 'right' },
  // ── Notes ────────────────────────────────────────────────
  notesBox: {
    backgroundColor: BG_LIGHT,
    borderRadius: 6,
    padding: 12,
    border: `1 solid ${BORDER}`,
  },
  notesText: { fontSize: 9, color: SLATE, lineHeight: 1.5 },
  // ── Footer ───────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: SLATE_LIGHT },
})

export interface PdfQuoteItem extends QuoteItem {
  productName: string
  mockupDataUrl: string | null
}

interface QuotePdfProps {
  quoteNumber: string
  version: number
  status: string
  clientCompany: string
  clientContact: string
  clientEmail: string
  ownerName: string
  createdAt: string
  validityDate: string | null
  notes: string | null
  items: PdfQuoteItem[]
  generatedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  changes_requested: 'Changes Requested',
  rejected: 'Rejected',
}

export function QuotePdf({
  quoteNumber,
  version,
  status,
  clientCompany,
  clientContact,
  clientEmail,
  ownerName,
  createdAt,
  validityDate,
  notes,
  items,
  generatedAt,
}: QuotePdfProps) {
  const total = calcQuoteTotal(items)

  return (
    <Document
      title={`${quoteNumber} — Quote`}
      author="QuoteTool"
      creator="QuoteTool"
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>QuoteTool</Text>
            <Text style={styles.headerSub}>Professional Quote</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerQuoteNum}>{quoteNumber}</Text>
            <Text style={styles.headerVersion}>Version {version}</Text>
            <View style={styles.headerStatus}>
              <Text style={styles.headerStatusText}>
                {STATUS_LABELS[status] ?? status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Info row ── */}
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Prepared for</Text>
              <Text style={styles.infoValueBold}>{clientCompany}</Text>
              <Text style={styles.infoValue}>{clientContact}</Text>
              <Text style={styles.infoValue}>{clientEmail}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Quote Details</Text>
              <Text style={styles.infoValue}>Issued: <Text style={styles.infoValueBold}>{formatDate(createdAt)}</Text></Text>
              {validityDate && (
                <Text style={styles.infoValue}>Valid until: <Text style={styles.infoValueBold}>{formatDate(validityDate)}</Text></Text>
              )}
              <Text style={styles.infoValue}>Prepared by: <Text style={styles.infoValueBold}>{ownerName}</Text></Text>
            </View>
          </View>

          {/* ── Line items ── */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Products &amp; Pricing</Text>
            <View style={styles.table}>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <View style={styles.colProduct}><Text style={styles.thText}>Product</Text></View>
                <View style={styles.colSize}><Text style={styles.thText}>Size</Text></View>
                <View style={styles.colColor}><Text style={styles.thText}>Color</Text></View>
                <View style={styles.colQty}><Text style={styles.thText}>Qty</Text></View>
                <View style={styles.colPrice}><Text style={styles.thText}>Unit Price</Text></View>
                <View style={styles.colDiscount}><Text style={styles.thText}>Disc.</Text></View>
                <View style={styles.colLead}><Text style={styles.thText}>Lead Time</Text></View>
                <View style={styles.colTotal}><Text style={styles.thText}>Total</Text></View>
              </View>

              {/* Rows */}
              {items.map((item, i) => (
                <View key={item.id} wrap={false}>
                  <View style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <View style={styles.colProduct}>
                      <Text style={styles.tdTextBold}>{item.productName}</Text>
                    </View>
                    <View style={styles.colSize}><Text style={styles.tdText}>{item.size ?? '—'}</Text></View>
                    <View style={styles.colColor}><Text style={styles.tdText}>{item.color ?? '—'}</Text></View>
                    <View style={styles.colQty}><Text style={styles.tdText}>{item.quantity}</Text></View>
                    <View style={styles.colPrice}><Text style={styles.tdText}>{formatCurrency(item.unit_price)}</Text></View>
                    <View style={styles.colDiscount}>
                      <Text style={styles.tdText}>{item.discount > 0 ? `${item.discount}%` : '—'}</Text>
                    </View>
                    <View style={styles.colLead}><Text style={styles.tdText}>{item.lead_time ?? '—'}</Text></View>
                    <View style={styles.colTotal}><Text style={styles.tdTextBold}>{formatCurrency(calcLineTotal(item))}</Text></View>
                  </View>

                  {/* Mockup image row */}
                  {item.mockupDataUrl && (
                    <View style={[styles.itemMockup, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Image src={item.mockupDataUrl} style={styles.mockupImage} />
                      <Text style={styles.mockupCaption}>Logo mockup · {item.productName}{item.color ? ` · ${item.color}` : ''}</Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Total row */}
              <View style={styles.totalsRow}>
                <Text style={styles.totalLabel}>Quote Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>

          {/* ── Notes ── */}
          {notes && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Notes &amp; Terms</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {quoteNumber} · v{version} · Generated {generatedAt}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
