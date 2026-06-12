import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProjectChart, IntervalStep, ReminderSound } from '../../types'
import { TrashIcon, SaveIcon } from '../icons'
import styles from './ShapingStepsModal.module.css'

interface Props {
  chart: ProjectChart
  onSave: (steps: IntervalStep[]) => void
  onClose: () => void
}

type StepDraft = {
  name: string
  text: string
  startRow: string    // raw string so the input is freely editable; parsed to number on commit
  repeatEvery: string
  repeatCount: string
  position: 'start' | 'middle' | 'end'
  stsStart: string
  sound: ReminderSound
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const BLANK_DRAFT: StepDraft = {
  name: '',
  text: '',
  startRow: '1',
  repeatEvery: '2',
  repeatCount: '8',
  position: 'start',
  stsStart: '',
  sound: 'chime',
}

const SOUND_LABELS: Record<ReminderSound, string> = {
  'chime+speak': '🔔+🗣',
  chime: '🔔',
  speak: '🗣',
  mute: '🔕',
}

function SoundPicker({ value, onChange }: { value: ReminderSound; onChange: (s: ReminderSound) => void }) {
  return (
    <div className={styles.soundRow}>
      {(['chime+speak', 'chime', 'speak', 'mute'] as ReminderSound[]).map(s => (
        <button key={s} type="button"
          className={`${styles.soundBtn} ${value === s ? styles.soundBtnActive : ''}`}
          title={s}
          onClick={() => onChange(s)}
        >
          {SOUND_LABELS[s]}
        </button>
      ))}
    </div>
  )
}

function StepFormPanel({
  draft,
  onUpdate,
  onConfirm,
  onCancel,
  confirmLabel = 'Done',
}: {
  draft: StepDraft
  onUpdate: (p: Partial<StepDraft>) => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
}) {
  return (
    <div className={styles.stepForm}>
      <div className={styles.formFieldRow}>
        <label className={styles.formLabel}>
          Name
          <input className={styles.formInput} type="text" value={draft.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="e.g. Buttonhole (optional)"
          />
        </label>
      </div>
      <div className={styles.formFieldRow}>
        <label className={styles.formLabel}>
          Instruction
          <input className={styles.formInput} type="text" value={draft.text}
            onChange={e => onUpdate({ text: e.target.value })}
            placeholder="e.g. K1, M1L at beg of row"
          />
        </label>
      </div>
      <div className={styles.formNumRow}>
        <label className={styles.formLabelSm}>
          Start (total)
          <input className={styles.formInputSm} type="text" inputMode="numeric" pattern="[0-9]*"
            value={draft.startRow}
            onChange={e => onUpdate({ startRow: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </label>
        <label className={styles.formLabelSm}>
          Every
          <input className={styles.formInputSm} type="text" inputMode="numeric" pattern="[0-9]*"
            value={draft.repeatEvery}
            onChange={e => onUpdate({ repeatEvery: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </label>
        <label className={styles.formLabelSm}>
          Repeats
          <input className={styles.formInputSm} type="text" inputMode="numeric" pattern="[0-9]*"
            value={draft.repeatCount}
            onChange={e => onUpdate({ repeatCount: e.target.value.replace(/[^0-9]/g, '') })}
          />
        </label>
      </div>
      {draft.position === 'middle' && (
        <div className={styles.formFieldRow}>
          <label className={styles.formLabel}>
            At stitch / marker
            <input className={styles.formInput} type="text" value={draft.stsStart}
              onChange={e => onUpdate({ stsStart: e.target.value })}
              placeholder="e.g. 12 or marker 1"
            />
          </label>
        </div>
      )}
      <div className={styles.formInlineRow}>
        <span className={styles.formInlineLabel}>Sound</span>
        <SoundPicker value={draft.sound} onChange={s => onUpdate({ sound: s })} />
      </div>
      <div className={styles.formActions}>
        <button className={styles.formCancelBtn} type="button" onClick={onCancel}>Cancel</button>
        <button className={styles.formConfirmBtn} type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  )
}

export default function ShapingStepsModal({ chart, onSave, onClose }: Props) {
  const [steps, setSteps] = useState<IntervalStep[]>(chart.intervalSteps ?? [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<StepDraft>(BLANK_DRAFT)
  const [addingNew, setAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState<StepDraft>(BLANK_DRAFT)

  const startSteps = steps.filter(s => s.position === 'start').sort((a, b) => a.order - b.order)
  const middleSteps = steps.filter(s => s.position === 'middle').sort((a, b) => a.order - b.order)
  const endSteps = steps.filter(s => s.position === 'end').sort((a, b) => a.order - b.order)

  const startEdit = (step: IntervalStep) => {
    setEditingId(step.id)
    setEditDraft({
      name: step.name,
      text: step.text,
      startRow: String(step.startRow),
      repeatEvery: String(step.repeatEvery),
      repeatCount: String(step.repeatCount),
      position: step.position,
      stsStart: step.stsStart ?? '',
      sound: step.sound,
    })
    setAddingNew(false)
  }

  const commitEdit = () => {
    if (!editingId || !editDraft.text.trim()) return
    const startRow = Math.max(1, parseInt(editDraft.startRow) || 1)
    const repeatEvery = Math.max(1, parseInt(editDraft.repeatEvery) || 1)
    const repeatCount = Math.max(1, parseInt(editDraft.repeatCount) || 1)
    setSteps(prev => prev.map(s => {
      if (s.id !== editingId) return s
      const newOrder = editDraft.position !== s.position
        ? prev.filter(x => x.position === editDraft.position && x.id !== s.id).length
        : s.order
      return {
        ...s,
        text: editDraft.text.trim(),
        name: editDraft.name.trim() || editDraft.text.trim().slice(0, 40),
        startRow, repeatEvery, repeatCount,
        position: editDraft.position,
        stsStart: editDraft.position === 'middle' && editDraft.stsStart ? editDraft.stsStart : undefined,
        sound: editDraft.sound,
        order: newOrder,
      }
    }))
    setEditingId(null)
  }

  const deleteStep = (id: string) => {
    setSteps(prev => {
      const deleted = prev.find(s => s.id === id)
      if (!deleted) return prev
      return prev
        .filter(s => s.id !== id)
        .map(s => s.position === deleted.position && s.order > deleted.order ? { ...s, order: s.order - 1 } : s)
    })
    if (editingId === id) setEditingId(null)
  }

  const moveStep = (id: string, dir: -1 | 1) => {
    setSteps(prev => {
      const step = prev.find(s => s.id === id)
      if (!step) return prev
      const positionList = prev.filter(s => s.position === step.position).sort((a, b) => a.order - b.order)
      const idx = positionList.findIndex(s => s.id === id)
      const targetIdx = idx + dir
      if (targetIdx < 0 || targetIdx >= positionList.length) return prev
      const target = positionList[targetIdx]
      return prev.map(s => {
        if (s.id === id) return { ...s, order: target.order }
        if (s.id === target.id) return { ...s, order: step.order }
        return s
      })
    })
  }

  const commitAdd = () => {
    if (!newDraft.text.trim()) return
    const text = newDraft.text.trim()
    const name = newDraft.name.trim() || text.slice(0, 40)
    const startRow = Math.max(1, parseInt(newDraft.startRow) || 1)
    const repeatEvery = Math.max(1, parseInt(newDraft.repeatEvery) || 1)
    const repeatCount = Math.max(1, parseInt(newDraft.repeatCount) || 1)
    const positionCount = steps.filter(s => s.position === newDraft.position).length
    setSteps(prev => [...prev, {
      id: genId(),
      name,
      text,
      startRow, repeatEvery, repeatCount,
      position: newDraft.position,
      stsStart: newDraft.position === 'middle' && newDraft.stsStart ? newDraft.stsStart : undefined,
      order: positionCount,
      sound: newDraft.sound,
    }])
    setAddingNew(false)
    setNewDraft(BLANK_DRAFT)
  }

  const renderStepRow = (step: IntervalStep, positionList: IntervalStep[]) => {
    const idx = positionList.findIndex(s => s.id === step.id)
    const isEditing = editingId === step.id

    return (
      <div key={step.id} className={styles.stepCard}>
        {isEditing ? (
          <StepFormPanel
            draft={editDraft}
            onUpdate={p => setEditDraft(d => ({ ...d, ...p }))}
            onConfirm={commitEdit}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div className={styles.stepSummary}>
            <div className={styles.stepInfo}>
              <span className={styles.stepName}>{step.name}</span>
              <span className={styles.stepInstruction}>{step.text}</span>
              <span className={styles.stepPattern}>
                total row {step.startRow} · every {step.repeatEvery} · ×{step.repeatCount}
                {step.position === 'middle' && step.stsStart ? ` · at ${step.stsStart}` : ''}
              </span>
            </div>
            <div className={styles.stepBtns}>
              <button className={styles.moveBtn} disabled={idx === 0} onClick={() => moveStep(step.id, -1)} aria-label="Move up">▲</button>
              <button className={styles.moveBtn} disabled={idx === positionList.length - 1} onClick={() => moveStep(step.id, 1)} aria-label="Move down">▼</button>
              <button className={styles.editBtn} onClick={() => startEdit(step)} aria-label="Edit">✎</button>
              <button className={styles.deleteBtn} onClick={() => deleteStep(step.id)} aria-label="Delete">
                <TrashIcon size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>Interval Steps</div>
            <div className={styles.subtitle}>{chart.name}</div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.saveBtn} onClick={() => onSave(steps)} aria-label="Save">
              <SaveIcon size={16}/>
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className={styles.body}>
          {(['start', 'middle', 'end'] as const).map((position, i) => {
            const label = position === 'start' ? 'Start of row' : position === 'middle' ? 'Middle of row' : 'End of row'
            const positionSteps = position === 'start' ? startSteps : position === 'middle' ? middleSteps : endSteps
            const isAdding = addingNew && newDraft.position === position
            return (
              <div key={position} className={styles.sectionGroup} style={i > 0 ? { marginTop: 16 } : undefined}>
                <div className={styles.groupHeaderRow}>
                  <span className={styles.groupHeader}>{label}</span>
                  <button
                    className={styles.groupAddBtn}
                    onClick={() => { setAddingNew(true); setEditingId(null); setNewDraft({ ...BLANK_DRAFT, position }) }}
                    aria-label={`Add step to ${label}`}
                  >+</button>
                </div>
                {positionSteps.length === 0 && !isAdding && (
                  <div className={styles.groupEmpty}>No steps — tap + to add</div>
                )}
                {positionSteps.map(s => renderStepRow(s, positionSteps))}
                {isAdding && (
                  <div className={styles.addCard}>
                    <StepFormPanel
                      draft={newDraft}
                      onUpdate={p => setNewDraft(d => ({ ...d, ...p }))}
                      onConfirm={commitAdd}
                      onCancel={() => { setAddingNew(false); setNewDraft(BLANK_DRAFT) }}
                      confirmLabel="Add"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>,
    document.body
  )
}
