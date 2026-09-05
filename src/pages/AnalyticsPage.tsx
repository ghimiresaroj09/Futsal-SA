import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Download, LoaderCircle, TrendingUp, UsersRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { authFetch } from '../lib/api'
import { PageSkeleton } from '../components/ui/PageSkeleton'

type Summary = { total_revenue: number; total_bookings: number; average_booking_value: number; active_customers: number; revenue_change_percent: number; bookings_change_percent: number; average_booking_value_change_percent: number; active_customers_change_percent: number }
type RevenuePeriod = { period: string; label: string; revenue: number; booking_count: number }
type StatusBreakdown = { status: string; label: string; count: number; percentage: number }
type DayBookings = { day: string; label: string; booking_count: number }
type RevenueSource = { source: string; label: string; revenue: number; booking_count: number; percentage: number }
type AnalyticsData = { summary: Summary; revenue_overview: RevenuePeriod[]; booking_status: { total: number; breakdown: StatusBreakdown[] }; bookings_by_day: DayBookings[]; revenue_by_source: RevenueSource[]; generated_at: string; period: { start_date: string; end_date: string; timezone: string } }
type AnalyticsResponse = { success: boolean; message: string; data: AnalyticsData }

const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
const money = (value: number) => `NPR ${Number(value).toLocaleString()}`
const statusTone = (status: string) => ({ CONFIRMED: 'purple', COMPLETED: 'green', CANCELLED: 'red', PENDING: 'yellow', RESCHEDULED: 'blue' }[status] || 'purple')

export function AnalyticsPage() {
  const { showToast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '6m' | '12m'>('6m')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    authFetch(`${apiBase}/api/v1/analytics/?period=${period}`).then(async (response) => {
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load analytics.')
      return body as AnalyticsResponse
    }).then((response) => { if (active) setAnalytics(response.data) }).catch((error: Error) => { if (active) showToast(error.message, 'error') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [period, showToast])

  const chart = useMemo(() => {
    if (!analytics?.revenue_overview.length) return { points: '', fill: '', max: 0, labels: [] as string[] }
    const entries = analytics.revenue_overview
    const max = Math.max(...entries.map((item) => item.revenue), 1)
    const points = entries.map((item, index) => `${entries.length === 1 ? 400 : index * (800 / (entries.length - 1))},${240 - (item.revenue / max) * 210}`).join(' ')
    const fill = `0,260 ${points} 800,260`
    return { points, fill, max, labels: entries.map((item) => item.label) }
  }, [analytics])

  useEffect(() => {
    const svg = document.querySelector<SVGSVGElement>('.revenue-chart-area svg')
    if (!svg || !analytics || !chart.max) return
    svg.querySelectorAll('[data-revenue-point]').forEach((point) => point.remove())
    const namespace = 'http://www.w3.org/2000/svg'
    analytics.revenue_overview.forEach((item, index, items) => {
      const point = document.createElementNS(namespace, 'circle')
      point.setAttribute('data-revenue-point', '')
      point.setAttribute('class', 'revenue-point')
      point.setAttribute('cx', String(items.length === 1 ? 400 : index * (800 / (items.length - 1))))
      point.setAttribute('cy', String(240 - (item.revenue / chart.max) * 210))
      point.setAttribute('r', '6')
      const title = document.createElementNS(namespace, 'title')
      title.textContent = `${item.label}: ${money(item.revenue)} · ${item.booking_count} booking${item.booking_count === 1 ? '' : 's'}`
      point.appendChild(title)
      svg.appendChild(point)
    })
  }, [analytics, chart.max])

  if (loading) return <PageSkeleton eyebrow="Performance overview" title="Analytics" description="Track revenue, bookings, and customer activity across your facility." />
  if (!analytics) return <div className="empty-page"><h1>Analytics unavailable</h1><p>We couldn’t load the latest analytics. Please refresh and try again.</p></div>

  const { summary, booking_status: bookingStatus } = analytics
  const metrics = [
    { label: 'Total revenue', value: money(summary.total_revenue), change: summary.revenue_change_percent, icon: CircleDollarSign, tone: 'violet' },
    { label: 'Total bookings', value: summary.total_bookings.toLocaleString(), change: summary.bookings_change_percent, icon: CalendarDays, tone: 'blue' },
    { label: 'Average booking value', value: money(summary.average_booking_value), change: summary.average_booking_value_change_percent, icon: TrendingUp, tone: 'green' },
    { label: 'Active customers', value: summary.active_customers.toLocaleString(), change: summary.active_customers_change_percent, icon: UsersRound, tone: 'orange' },
  ]
  const totalDayBookings = Math.max(...analytics.bookings_by_day.map((item) => item.booking_count), 1)
  let progress = 0
  const donutStops = bookingStatus.breakdown.map((item) => { const start = progress; progress += item.percentage; return `${({ CONFIRMED: '#7569e8', COMPLETED: '#2da978', CANCELLED: '#e07684', PENDING: '#e8b84f', RESCHEDULED: '#4a9ee9' }[item.status] || '#dedeea')} ${start}% ${progress}%` }).join(', ')

  return <div className="analytics-page"><div className="page-heading"><div><p className="eyebrow">Performance overview</p><h1>Analytics</h1><p className="muted">Track revenue, bookings, and customer activity across your facility.</p></div><div className="analytics-actions"><select value={period} onChange={(event) => setPeriod(event.target.value as typeof period)}><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="6m">Last 6 months</option><option value="12m">Last 12 months</option></select><button className="primary-button" disabled><Download size={16} />Export report</button></div></div><section className="analytics-metrics">{metrics.map(({ label, value, change, icon: Icon, tone }) => { const positive = change >= 0; return <article className="analytics-metric" key={label}><div className={`analytics-metric-icon ${tone}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small className={positive ? '' : 'negative'}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(change)}% <em>vs previous period</em></small></article> })}</section><section className="analytics-main-grid"><article className="analytics-panel revenue-panel"><div className="analytics-panel-heading"><div><h2>Revenue overview</h2><p>Revenue for the selected period</p></div><span className="chart-legend"><i />Revenue</span></div><div className="revenue-chart"><div className="chart-axis">{[1, .75, .5, .25, 0].map((factor) => <span key={factor}>{money(chart.max * factor)}</span>)}</div><div className="revenue-chart-area"><div className="analytics-grid-lines" />{chart.points ? <svg viewBox="0 0 800 260" preserveAspectRatio="none"><defs><linearGradient id="analyticsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7569e8" stopOpacity=".26" /><stop offset="1" stopColor="#7569e8" stopOpacity="0" /></linearGradient></defs><polygon points={chart.fill} fill="url(#analyticsFill)" /><polyline points={chart.points} fill="none" stroke="#7569e8" strokeWidth="3" /></svg> : <div className="analytics-chart-empty">No revenue data available.</div>}<div className="chart-months">{chart.labels.map((label) => <span key={label}>{label}</span>)}</div></div></div></article><article className="analytics-panel status-panel"><div className="analytics-panel-heading"><div><h2>Booking status</h2><p>All bookings by status</p></div></div><div className="donut-wrap"><div className="donut" title={bookingStatus.breakdown.map((item) => `${item.label}: ${item.count} (${item.percentage}%)`).join('\n')} style={{ background: `conic-gradient(${donutStops || '#dedeea 0 100%'})` }}><div><strong>{bookingStatus.total.toLocaleString()}</strong><span>Bookings</span></div></div><div className="status-list">{bookingStatus.breakdown.map((item) => <div className="status-row" key={item.status}><span><i className={statusTone(item.status)} />{item.label}</span><strong>{item.percentage}%</strong><small>{item.count}</small></div>)}</div></div></article></section><section className="analytics-bottom-grid"><article className="analytics-panel bar-panel"><div className="analytics-panel-heading"><div><h2>Bookings by day</h2><p>Bookings in the selected period</p></div><span className="chart-legend blue-legend"><i />Bookings</span></div><div className="bar-chart">{analytics.bookings_by_day.map((item) => <div className="bar-col" key={item.day}><div className="bar" style={{ height: `${(item.booking_count / totalDayBookings) * 100}%` }} title={`${item.booking_count} bookings`} /><span>{item.label}</span></div>)}</div></article><article className="analytics-panel source-panel"><div className="analytics-panel-heading"><div><h2>Revenue by source</h2><p>Where your bookings come from</p></div></div>{analytics.revenue_by_source.map((item) => <div className="source-row" key={item.source}><div className="source-label"><span className={`source-circle ${item.source.toLowerCase()}`}>{item.source.charAt(0)}</span><div><strong>{item.label}</strong><small>{item.booking_count} bookings · {item.percentage}%</small></div></div><strong>{money(item.revenue)}</strong></div>)}</article></section></div>
}
