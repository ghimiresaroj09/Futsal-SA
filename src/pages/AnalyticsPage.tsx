import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, Download, Gauge, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { useToast } from '../components/ui/Toast'
import { PageSkeleton } from '../components/ui/PageSkeleton'
import { authFetch } from '../lib/api'

type Summary = { total_revenue: number; total_bookings: number; average_booking_value: number; active_customers: number; revenue_change_percent: number; bookings_change_percent: number; average_booking_value_change_percent: number; active_customers_change_percent: number }
type RevenuePeriod = { period: string; label: string; revenue: number; booking_count: number }
type StatusBreakdown = { status: string; label: string; count: number; percentage: number }
type DayBookings = { day: string; label: string; booking_count: number }
type RevenueSource = { source: string; label: string; revenue: number; booking_count: number; percentage: number }
type RevenuePaymentMethod = { method: string; label: string; revenue: number; booking_count: number; percentage: number }
type PaymentStatus = { status: string; label: string; count: number; amount: number }
type BookingTime = { start_time: string; end_time: string; booking_count: number; revenue: number }
type Capacity = { total_slots: number; booked_slots: number; available_slots: number; blocked_slots: number; occupancy_percent: number }
type BookingPerformance = { cancelled_bookings: number; completed_bookings: number; cancellation_rate_percent: number; completion_rate_percent: number }
type AnalyticsData = { summary: Summary; revenue_overview: RevenuePeriod[]; booking_status: { total: number; breakdown: StatusBreakdown[] }; bookings_by_day: DayBookings[]; revenue_by_source: RevenueSource[]; revenue_by_payment_method: RevenuePaymentMethod[]; payment_status: { total: number; breakdown: PaymentStatus[] }; bookings_by_time: BookingTime[]; capacity: Capacity; booking_performance: BookingPerformance; generated_at: string; period: { start_date: string; end_date: string; timezone: string } }
type AnalyticsResponse = { success: boolean; message: string; data: AnalyticsData }

const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
const money = (value: number) => `NPR ${Number(value).toLocaleString()}`
const timeLabel = (value: string) => value.slice(0, 5)
const statusTone = (status: string) => ({ CONFIRMED: 'purple', COMPLETED: 'green', CANCELLED: 'red', PENDING: 'yellow', RESCHEDULED: 'blue', PAID: 'green', ADVANCED: 'purple', FAILED: 'red', REFUNDED: 'blue' }[status] || 'purple')
const bookingColor = (status: string) => ({ CONFIRMED: '#7569e8', COMPLETED: '#2da978', CANCELLED: '#e07684', PENDING: '#e8b84f', RESCHEDULED: '#4a9ee9' }[status] || '#dedeea')

export function AnalyticsPage() {
  const { showToast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '6m' | '12m'>('6m')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    authFetch(`${apiBase}/api/v1/analytics/?period=${period}`)
      .then(async (response) => { const body = await response.json().catch(() => ({})); if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load analytics.'); return body as AnalyticsResponse })
      .then((response) => { if (active) setAnalytics(response.data) })
      .catch((error: Error) => { if (active) showToast(error.message, 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [period, showToast])

  const chart = useMemo(() => {
    if (!analytics?.revenue_overview.length) return { points: '', fill: '', max: 0, labels: [] as string[] }
    const entries = analytics.revenue_overview
    const max = Math.max(...entries.map((item) => item.revenue), 1)
    const points = entries.map((item, index) => `${entries.length === 1 ? 400 : index * (800 / (entries.length - 1))},${240 - (item.revenue / max) * 210}`).join(' ')
    return { points, fill: `0,260 ${points} 800,260`, max, labels: entries.map((item) => item.label) }
  }, [analytics])

  useEffect(() => {
    const svg = document.querySelector<SVGSVGElement>('.revenue-chart-area svg')
    if (!svg || !analytics || !chart.max) return
    svg.querySelectorAll('[data-revenue-point]').forEach((point) => point.remove())
    const namespace = 'http://www.w3.org/2000/svg'
    analytics.revenue_overview.forEach((item, index, items) => {
      const point = document.createElementNS(namespace, 'circle')
      point.setAttribute('data-revenue-point', ''); point.setAttribute('class', 'revenue-point'); point.setAttribute('cx', String(items.length === 1 ? 400 : index * (800 / (items.length - 1)))); point.setAttribute('cy', String(240 - (item.revenue / chart.max) * 210)); point.setAttribute('r', '6')
      const title = document.createElementNS(namespace, 'title'); title.textContent = `${item.label}: ${money(item.revenue)} · ${item.booking_count} booking${item.booking_count === 1 ? '' : 's'}`; point.appendChild(title); svg.appendChild(point)
    })
  }, [analytics, chart.max])

  const exportReport = () => {
    if (!analytics || exporting) return
    setExporting(true)
    try {
      const document = new jsPDF({ unit: 'mm', format: 'a4' })
      const width = document.internal.pageSize.getWidth(); const height = document.internal.pageSize.getHeight(); const margin = 16; let cursor = 20
      const space = (needed: number) => { if (cursor + needed > height - 16) { document.addPage(); cursor = 18 } }
      const heading = (value: string) => { space(11); document.setFont('helvetica', 'bold'); document.setFontSize(13); document.setTextColor(48, 49, 71); document.text(value, margin, cursor); cursor += 8 }
      const row = (label: string, value: string) => { const lines = document.splitTextToSize(value, width - margin * 2 - 54); space(Math.max(7, lines.length * 5 + 3)); document.setFont('helvetica', 'bold'); document.setFontSize(9); document.setTextColor(85, 87, 108); document.text(label, margin, cursor); document.setFont('helvetica', 'normal'); document.setTextColor(112, 114, 135); document.text(lines, margin + 54, cursor); cursor += Math.max(7, lines.length * 5 + 3) }
      const divider = () => { space(3); document.setDrawColor(232, 232, 240); document.line(margin, cursor, width - margin, cursor); cursor += 5 }
      document.setFillColor(117, 105, 232); document.rect(0, 0, width, 10, 'F'); document.setFont('helvetica', 'bold'); document.setFontSize(21); document.setTextColor(48, 49, 71); document.text('Nexus FMS Analytics Report', margin, cursor); cursor += 8
      document.setFont('helvetica', 'normal'); document.setFontSize(10); document.setTextColor(112, 114, 135); document.text(`Reporting period: ${analytics.period.start_date} to ${analytics.period.end_date}`, margin, cursor); cursor += 5; document.text(`Generated: ${new Date(analytics.generated_at).toLocaleString()} (${analytics.period.timezone})`, margin, cursor); cursor += 10
      heading('Summary'); row('Total revenue', money(analytics.summary.total_revenue)); row('Total bookings', String(analytics.summary.total_bookings)); row('Average booking value', money(analytics.summary.average_booking_value)); row('Active customers', String(analytics.summary.active_customers)); divider()
      heading('Revenue overview'); analytics.revenue_overview.forEach((item) => row(item.label, `${money(item.revenue)} · ${item.booking_count} bookings`)); divider()
      heading('Booking status'); analytics.booking_status.breakdown.forEach((item) => row(item.label, `${item.count} bookings · ${item.percentage}%`)); divider()
      heading('Bookings by day'); analytics.bookings_by_day.forEach((item) => row(item.label, `${item.booking_count} bookings`)); divider()
      heading('Revenue by source'); analytics.revenue_by_source.forEach((item) => row(item.label, `${money(item.revenue)} · ${item.booking_count} bookings · ${item.percentage}%`)); divider()
      heading('Capacity'); row('Slot utilization', `${analytics.capacity.booked_slots} booked · ${analytics.capacity.available_slots} available · ${analytics.capacity.blocked_slots} blocked`); row('Occupancy', `${analytics.capacity.occupancy_percent}%`); divider()
      heading('Booking performance'); row('Completed', `${analytics.booking_performance.completed_bookings} bookings · ${analytics.booking_performance.completion_rate_percent}%`); row('Cancelled', `${analytics.booking_performance.cancelled_bookings} bookings · ${analytics.booking_performance.cancellation_rate_percent}%`); divider()
      heading('Revenue by payment method'); analytics.revenue_by_payment_method.forEach((item) => row(item.label, `${money(item.revenue)} · ${item.booking_count} bookings · ${item.percentage}%`)); divider()
      heading('Payment status'); analytics.payment_status.breakdown.forEach((item) => row(item.label, `${item.count} bookings · ${money(item.amount)}`)); divider()
      heading('Bookings by time'); analytics.bookings_by_time.forEach((item) => row(`${timeLabel(item.start_time)}–${timeLabel(item.end_time)}`, `${item.booking_count} bookings · ${money(item.revenue)}`))
      const pages = document.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { document.setPage(page); document.setFontSize(8); document.setTextColor(150, 152, 168); document.text(`Nexus FMS · Page ${page} of ${pages}`, width - margin, height - 8, { align: 'right' }) }
      document.save(`nexus-fms-analytics-${analytics.period.start_date}-to-${analytics.period.end_date}.pdf`); showToast('Analytics report downloaded.', 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to export the analytics report.', 'error') } finally { setExporting(false) }
  }

  if (loading) return <PageSkeleton eyebrow="Performance overview" title="Analytics" description="Track revenue, bookings, and customer activity across your facility." />
  if (!analytics) return <div className="empty-page"><h1>Analytics unavailable</h1><p>We couldn’t load the latest analytics. Please refresh and try again.</p></div>

  const { summary, booking_status: bookingStatus, capacity, booking_performance: performance } = analytics
  const metrics = [{ label: 'Total revenue', value: money(summary.total_revenue), change: summary.revenue_change_percent, icon: CircleDollarSign, tone: 'violet' }, { label: 'Total bookings', value: summary.total_bookings.toLocaleString(), change: summary.bookings_change_percent, icon: CalendarDays, tone: 'blue' }, { label: 'Average booking value', value: money(summary.average_booking_value), change: summary.average_booking_value_change_percent, icon: TrendingUp, tone: 'green' }, { label: 'Active customers', value: summary.active_customers.toLocaleString(), change: summary.active_customers_change_percent, icon: UsersRound, tone: 'orange' }]
  const totalDayBookings = Math.max(...analytics.bookings_by_day.map((item) => item.booking_count), 1)
  let progress = 0
  const donutStops = bookingStatus.breakdown.map((item) => { const start = progress; progress += item.percentage; return `${bookingColor(item.status)} ${start}% ${progress}%` }).join(', ')

  return <div className="analytics-page">
    <div className="page-heading"><div><p className="eyebrow">Performance overview</p><h1>Analytics</h1><p className="muted">Track revenue, bookings, capacity, and payments across your facility.</p></div><div className="analytics-actions"><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="6m">Last 6 months</option><option value="12m">Last 12 months</option></select><button className="primary-button" onClick={exportReport} disabled={exporting}><Download size={16} />{exporting ? 'Exporting...' : 'Export report'}</button></div></div>
    <section className="analytics-metrics">{metrics.map(({ label, value, change, icon: Icon, tone }) => { const positive = change >= 0; return <article className="analytics-metric" key={label}><div className={`analytics-metric-icon ${tone}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small className={positive ? '' : 'negative'}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(change)}% <em>vs previous period</em></small></article> })}</section>
    <section className="analytics-main-grid"><article className="analytics-panel revenue-panel"><div className="analytics-panel-heading"><div><h2>Revenue overview</h2><p>Revenue for the selected period</p></div><span className="chart-legend"><i />Revenue</span></div><div className="revenue-chart"><div className="chart-axis">{[1, .75, .5, .25, 0].map((factor) => <span key={factor}>{money(chart.max * factor)}</span>)}</div><div className="revenue-chart-area"><div className="analytics-grid-lines" />{chart.points ? <svg viewBox="0 0 800 260" preserveAspectRatio="none"><defs><linearGradient id="analyticsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7569e8" stopOpacity=".26" /><stop offset="1" stopColor="#7569e8" stopOpacity="0" /></linearGradient></defs><polygon points={chart.fill} fill="url(#analyticsFill)" /><polyline points={chart.points} fill="none" stroke="#7569e8" strokeWidth="3" /></svg> : <div className="analytics-chart-empty">No revenue data available.</div>}<div className="chart-months">{chart.labels.map((label) => <span key={label}>{label}</span>)}</div></div></div></article><article className="analytics-panel status-panel"><div className="analytics-panel-heading"><div><h2>Booking status</h2><p>All bookings by status</p></div></div><div className="donut-wrap"><div className="donut" title={bookingStatus.breakdown.map((item) => `${item.label}: ${item.count} (${item.percentage}%)`).join('\n')} style={{ background: `conic-gradient(${donutStops || '#dedeea 0 100%'})` }}><div><strong>{bookingStatus.total.toLocaleString()}</strong><span>Bookings</span></div></div><div className="status-list">{bookingStatus.breakdown.map((item) => <div className="status-row" key={item.status}><span><i className={statusTone(item.status)} />{item.label}</span><strong>{item.percentage}%</strong><small>{item.count}</small></div>)}</div></div></article></section>
    <section className="analytics-bottom-grid"><article className="analytics-panel bar-panel"><div className="analytics-panel-heading"><div><h2>Bookings by day</h2><p>Bookings in the selected period</p></div><span className="chart-legend blue-legend"><i />Bookings</span></div><div className="bar-chart">{analytics.bookings_by_day.map((item) => <div className="bar-col" key={item.day}><div className="bar" style={{ height: `${(item.booking_count / totalDayBookings) * 100}%` }} title={`${item.booking_count} bookings`} /><span>{item.label}</span></div>)}</div></article><article className="analytics-panel source-panel"><div className="analytics-panel-heading"><div><h2>Revenue by source</h2><p>Where your bookings come from</p></div></div>{analytics.revenue_by_source.map((item) => <div className="source-row" key={item.source}><div className="source-label"><span className={`source-circle ${item.source.toLowerCase()}`}>{item.source.charAt(0)}</span><div><strong>{item.label}</strong><small>{item.booking_count} bookings · {item.percentage}%</small></div></div><strong>{money(item.revenue)}</strong></div>)}</article></section>
    <section className="analytics-detail-grid"><article className="analytics-panel capacity-panel"><div className="analytics-panel-heading"><div><h2>Capacity</h2><p>Slot utilization for the selected period</p></div><Gauge size={19} className="panel-icon" /></div><div className="capacity-score"><strong>{capacity.occupancy_percent}%</strong><span>Occupancy</span></div><div className="capacity-track"><i style={{ width: `${Math.min(Math.max(capacity.occupancy_percent, 0), 100)}%` }} /></div><div className="capacity-list"><span><i className="booked" />Booked <strong>{capacity.booked_slots}</strong></span><span><i className="available" />Available <strong>{capacity.available_slots}</strong></span><span><i className="blocked" />Blocked <strong>{capacity.blocked_slots}</strong></span></div><small className="capacity-total">{capacity.total_slots} total slots</small></article><article className="analytics-panel performance-panel"><div className="analytics-panel-heading"><div><h2>Booking performance</h2><p>Completion and cancellation outcomes</p></div><TrendingUp size={19} className="panel-icon" /></div><div className="performance-row"><div><span>Completion rate</span><strong>{performance.completion_rate_percent}%</strong><small>{performance.completed_bookings} completed bookings</small></div><div className="performance-ring completion" style={{ '--progress': `${performance.completion_rate_percent * 3.6}deg` } as React.CSSProperties} /></div><div className="performance-row"><div><span>Cancellation rate</span><strong>{performance.cancellation_rate_percent}%</strong><small>{performance.cancelled_bookings} cancelled bookings</small></div><div className="performance-ring cancellation" style={{ '--progress': `${performance.cancellation_rate_percent * 3.6}deg` } as React.CSSProperties} /></div></article></section>
    <section className="analytics-detail-grid"><article className="analytics-panel"><div className="analytics-panel-heading"><div><h2>Revenue by payment method</h2><p>Revenue attributed to each payment channel</p></div><WalletCards size={19} className="panel-icon" /></div><div className="analytics-list">{analytics.revenue_by_payment_method.map((item) => <div className="analytics-list-row" key={item.method}><div><strong>{item.label}</strong><small>{item.booking_count} bookings · {item.percentage}%</small></div><strong>{money(item.revenue)}</strong></div>)}</div></article><article className="analytics-panel"><div className="analytics-panel-heading"><div><h2>Payment status</h2><p>Payment totals across all bookings</p></div></div><div className="analytics-list">{analytics.payment_status.breakdown.map((item) => <div className="analytics-list-row" key={item.status}><div className="payment-label"><i className={statusTone(item.status)} /><span><strong>{item.label}</strong><small>{item.count} bookings</small></span></div><strong>{money(item.amount)}</strong></div>)}</div></article></section>
    <section className="analytics-panel time-panel"><div className="analytics-panel-heading"><div><h2>Bookings by time</h2><p>Most active booking windows in the selected period</p></div><Clock3 size={19} className="panel-icon" /></div>{analytics.bookings_by_time.length ? <div className="time-grid">{analytics.bookings_by_time.map((item) => <div className="time-row" key={`${item.start_time}-${item.end_time}`}><strong>{timeLabel(item.start_time)}–{timeLabel(item.end_time)}</strong><span>{item.booking_count} booking{item.booking_count === 1 ? '' : 's'}</span><small>{money(item.revenue)}</small></div>)}</div> : <div className="analytics-chart-empty">No time-based booking data available.</div>}</section>
  </div>
}
