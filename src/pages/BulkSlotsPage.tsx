import { CalendarRange, Check, LoaderCircle, Plus, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../components/ui/Toast'
import { authFetch } from '../lib/api'

type SlotRow = { start_time: string; end_time: string; status: string; price: string }
type Slot = SlotRow & { id: string; date: string }
type SlotsResponse = { success: boolean; message: string; data: { count: number; results: Slot[] } }
type GenerateSlotsResponse = { success: boolean; message: string; data: { created: number; slots: Slot[] } }
type BulkUpdateResponse = { success: boolean; message: string; data: { date: string; updated_slots: number; skipped_booked_slots: number; not_found_start_times: string[]; slots: Slot[] } }

const apiBase = import.meta.env.DEV ? '/backend' : (import.meta.env.VITE_API_BASE_URL || '')
const toInputTime = (value: string) => value.slice(0, 5)
const toApiTime = (value: string) => `${value}:00`

export function BulkSlotsPage() {
  const { showToast } = useToast()
  const [mode, setMode] = useState<'add' | 'update'>('add')
  const [addForm, setAddForm] = useState({ start_date: '', end_date: '' })
  const [updateForm, setUpdateForm] = useState({ date: '' })
  const [slotRows, setSlotRows] = useState<SlotRow[]>([])
  const [generating, setGenerating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [addCreated, setAddCreated] = useState(false)
  const [updateCreated, setUpdateCreated] = useState(false)

  useEffect(() => {
    if (mode !== 'update' || !updateForm.date) { setSlotRows([]); return }
    let active = true
    setLoadingSlots(true)
    authFetch(`${apiBase}/api/v1/admin/slots/?date=${encodeURIComponent(updateForm.date)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to load slots for this date.')
        return body as SlotsResponse
      })
      .then((result) => { if (active) setSlotRows(result.data.results.map((slot) => ({ start_time: toInputTime(slot.start_time), end_time: toInputTime(slot.end_time), status: slot.status, price: slot.price }))) })
      .catch((error: Error) => { if (active) { setSlotRows([]); showToast(error.message, 'error') } })
      .finally(() => { if (active) setLoadingSlots(false) })
    return () => { active = false }
  }, [mode, showToast, updateForm.date])

  const submitAdd = async (event: React.FormEvent) => {
    event.preventDefault(); setGenerating(true)
    try {
      const response = await authFetch(`${apiBase}/api/v1/admin/slots/generate/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to generate slots.')
      const result = body as GenerateSlotsResponse
      setAddCreated(true); showToast(result.message || `${result.data.created} slot(s) generated successfully.`, 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to generate slots.', 'error') } finally { setGenerating(false) }
  }

  const submitUpdate = async (event: React.FormEvent) => {
    event.preventDefault(); if (!slotRows.length) return
    setUpdating(true)
    try {
      const response = await authFetch(`${apiBase}/api/v1/admin/slots/bulk-update/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: updateForm.date, slots: slotRows.map((slot) => ({ ...slot, start_time: toApiTime(slot.start_time), end_time: toApiTime(slot.end_time) })) }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.success) throw new Error(body?.message || 'Unable to update slots.')
      const result = body as BulkUpdateResponse
      setSlotRows(result.data.slots.map((slot) => ({ start_time: toInputTime(slot.start_time), end_time: toInputTime(slot.end_time), status: slot.status, price: slot.price })))
      setUpdateCreated(true)
      showToast(result.message || `${result.data.updated_slots} slot(s) updated successfully.`, 'success')
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to update slots.', 'error') } finally { setUpdating(false) }
  }

  const updateSlot = (index: number, field: keyof SlotRow, value: string) => setSlotRows((rows) => rows.map((slot, rowIndex) => rowIndex === index ? { ...slot, [field]: value } : slot))

  return <div className="bulk-slots-page"><div className="page-heading"><div><p className="eyebrow">Slot management</p><h1>Bulk Slots</h1><p className="muted">Create new slots or update multiple slots for a date.</p></div></div><section className="bulk-card"><div className="bulk-tabs"><button className={mode === 'add' ? 'active' : ''} onClick={() => { setMode('add'); setAddCreated(false) }}><Plus size={15} />Add bulk slots</button><button className={mode === 'update' ? 'active' : ''} onClick={() => { setMode('update'); setUpdateCreated(false) }}><Save size={15} />Update bulk slots</button></div>{mode === 'add' ? <form className="bulk-form" onSubmit={submitAdd}><div className="bulk-intro"><div className="bulk-icon"><CalendarRange size={21} /></div><div><h2>Add slots in bulk</h2><p>Create slots across a range of dates.</p></div></div><div className="modal-data-grid"><label className="field"><span>Start date</span><input type="date" value={addForm.start_date} onChange={(event) => { setAddCreated(false); setAddForm({ ...addForm, start_date: event.target.value }) }} required /></label><label className="field"><span>End date</span><input type="date" min={addForm.start_date} value={addForm.end_date} onChange={(event) => { setAddCreated(false); setAddForm({ ...addForm, end_date: event.target.value }) }} required /></label></div><div className="modal-actions"><button className="primary-button" type="submit" disabled={generating}>{generating ? 'Generating...' : addCreated ? <><Check size={16} />Slots created</> : <><Plus size={16} />Create bulk slots</>}</button></div></form> : <form className="bulk-form" onSubmit={submitUpdate}><div className="bulk-intro"><div className="bulk-icon"><Save size={21} /></div><div><h2>Update bulk slots</h2><p>Update the slot details for a selected date.</p></div></div><label className="field"><span>Date</span><input type="date" value={updateForm.date} onChange={(event) => { setUpdateCreated(false); setUpdateForm({ date: event.target.value }) }} required /></label><div className="slot-array-heading"><div><h3>Slots for selected date</h3><p className="slot-array-helper">Existing slots for {updateForm.date || 'the selected date'} are loaded below. Update their values as needed.</p></div></div>{loadingSlots ? <div className="empty-availability"><LoaderCircle className="spin" size={22} /><p>Loading slots...</p></div> : <div className="slot-array">{slotRows.map((slot, index) => <div className="slot-array-row" key={`${slot.start_time}-${index}`}><span className="slot-row-number">{index + 1}</span><label className="field"><span>Start</span><input type="time" value={slot.start_time} onChange={(event) => updateSlot(index, 'start_time', event.target.value)} required /></label><label className="field"><span>End</span><input type="time" value={slot.end_time} onChange={(event) => updateSlot(index, 'end_time', event.target.value)} required /></label><label className="field"><span>Status</span><select value={slot.status} onChange={(event) => updateSlot(index, 'status', event.target.value)}><option value="AVAILABLE">AVAILABLE</option><option value="BLOCKED">BLOCKED</option></select></label><label className="field"><span>Price</span><input type="number" min="0" step="0.01" value={slot.price} onChange={(event) => updateSlot(index, 'price', event.target.value)} required /></label><button type="button" className="remove-slot-row" onClick={() => { setUpdateCreated(false); setSlotRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index)) }} title="Exclude slot from bulk update" aria-label="Exclude slot from bulk update"><X size={15} /></button></div>)}{updateForm.date && !slotRows.length && <div className="empty-availability"><p>No slots selected for this bulk update.</p></div>}</div>}<div className="modal-actions"><button className="primary-button" type="submit" disabled={updating || loadingSlots || !slotRows.length}>{updating ? 'Updating...' : updateCreated ? <><Check size={16} />Slots updated</> : <><Save size={16} />Update bulk slots</>}</button></div></form>}</section></div>
}
