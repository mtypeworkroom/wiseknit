import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import styles from './ColorPicker.module.css'

const PICKER_W = 200
const PICKER_H = 180

interface Props {
  value: string
  onChange: (color: string) => void
}

export default function ColorPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const swatchRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const openPicker = () => {
    if (!swatchRef.current) return
    const rect = swatchRef.current.getBoundingClientRect()
    const top = rect.bottom + 6 + PICKER_H > window.innerHeight
      ? rect.top - PICKER_H - 6
      : rect.bottom + 6
    const left = rect.left + PICKER_W > window.innerWidth
      ? rect.right - PICKER_W
      : rect.left
    setPos({ top, left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current && !swatchRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <>
      <button
        type="button"
        ref={swatchRef}
        className={styles.swatch}
        style={{ background: value }}
        onClick={() => open ? setOpen(false) : openPicker()}
        aria-label="Pick color"
      />
      {open && createPortal(
        <div
          ref={popoverRef}
          className={styles.popover}
          style={{ top: pos.top, left: pos.left }}
        >
          <HexColorPicker color={value} onChange={onChange} />
        </div>,
        document.body
      )}
    </>
  )
}
