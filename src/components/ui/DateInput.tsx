import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { DayPicker, type Matcher } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toDateInput } from '@/lib/datetime'
import { Input } from './Input'

type NativeProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max'
>

interface DateInputProps extends NativeProps {
  /** 'yyyy-MM-dd' (ou 'yyyy-MM-ddTHH:mm' com `withTime`); '' quando vazio. */
  value: string
  onChange: (value: string) => void
  /** Inclui hora (mesmo formato de <input type="datetime-local">). */
  withTime?: boolean
  /** Limites do calendário, no mesmo formato de `value`. */
  min?: string
  max?: string
  invalid?: boolean
}

const POPOVER_WIDTH = 296
const POPOVER_HEIGHT = 390

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Aplica a máscara dd/mm/aaaa [hh:mm] sobre os dígitos digitados. */
function mask(raw: string, withTime: boolean): string {
  const d = raw.replace(/\D/g, '').slice(0, withTime ? 12 : 8)
  let out = d.slice(0, 2)
  if (d.length > 2) out += '/' + d.slice(2, 4)
  if (d.length > 4) out += '/' + d.slice(4, 8)
  if (d.length > 8) out += ' ' + d.slice(8, 10)
  if (d.length > 10) out += ':' + d.slice(10, 12)
  return out
}

/** Valor ISO local ('yyyy-MM-dd[THH:mm]') → texto exibido ('dd/MM/yyyy[ HH:mm]'). */
function toDisplay(value: string, withTime: boolean): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!m) return ''
  const date = `${m[3]}/${m[2]}/${m[1]}`
  return withTime ? `${date} ${m[4] ?? '00'}:${m[5] ?? '00'}` : date
}

function isValidDate(y: number, m: number, d: number): boolean {
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/** Hora (HH:mm) de um valor existente ou, na falta, a hora atual. */
function timeOf(value: string): string {
  const m = /T(\d{2}:\d{2})/.exec(value)
  if (m) return m[1]
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * Converte o texto digitado em valor ISO local. Retorna null se inválido/incompleto.
 * `lenient` (no blur) aceita ano com 2 dígitos e, com hora, só a data (mantém a hora anterior).
 */
function parse(text: string, withTime: boolean, lenient: boolean, current: string): string | null {
  const digits = text.replace(/\D/g, '')
  let day: number, month: number, year: number
  if (digits.length >= 8) {
    ;[day, month, year] = [+digits.slice(0, 2), +digits.slice(2, 4), +digits.slice(4, 8)]
  } else if (lenient && digits.length === 6) {
    ;[day, month, year] = [+digits.slice(0, 2), +digits.slice(2, 4), 2000 + +digits.slice(4, 6)]
  } else {
    return null
  }
  if (year < 1900 || !isValidDate(year, month, day)) return null
  const date = `${year}-${pad(month)}-${pad(day)}`
  if (!withTime) return date

  const timeDigits = digits.length >= 8 ? digits.slice(8) : ''
  if (timeDigits.length === 4) {
    const [h, mi] = [+timeDigits.slice(0, 2), +timeDigits.slice(2, 4)]
    if (h > 23 || mi > 59) return null
    return `${date}T${pad(h)}:${pad(mi)}`
  }
  if (lenient && timeDigits.length === 0) return `${date}T${timeOf(current)}`
  return null
}

/** 'yyyy-MM-dd...' → Date local (meia-noite). */
function toDate(value: string | undefined): Date | undefined {
  const m = value && /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : undefined
}

/**
 * Campo de data (ou data + hora) com digitação livre — máscara dd/mm/aaaa [hh:mm] —
 * e calendário em popover. Recebe e devolve os mesmos formatos dos inputs nativos
 * (`yyyy-MM-dd` / `yyyy-MM-ddTHH:mm`), então substitui `type="date"`/`"datetime-local"` direto.
 */
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    { value, onChange, withTime = false, min, max, invalid, className, disabled, onBlur, onKeyDown, ...props },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const [text, setText] = useState(() => toDisplay(value, withTime))
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

    // Valor alterado por fora (reset do form, presets de período...): reflete no texto.
    const [prevValue, setPrevValue] = useState(value)
    if (value !== prevValue) {
      setPrevValue(value)
      if (parse(text, withTime, false, value) !== value) setText(toDisplay(value, withTime))
    }

    const emit = (next: string) => {
      if (next !== value) onChange(next)
    }

    const handleChange = (raw: string) => {
      const masked = mask(raw, withTime)
      setText(masked)
      if (masked === '') return emit('')
      const parsed = parse(masked, withTime, false, value)
      if (parsed) emit(parsed)
    }

    /** No blur/Enter: completa o que der (ano curto, hora) ou volta ao último valor válido. */
    const commit = () => {
      if (text === '') return emit('')
      const parsed = parse(text, withTime, true, value)
      if (parsed) {
        emit(parsed)
        setText(toDisplay(parsed, withTime))
      } else {
        setText(toDisplay(value, withTime))
      }
    }

    const selectDay = (day: Date | undefined) => {
      if (!day) return
      const date = toDateInput(day)
      const next = withTime ? `${date}T${timeOf(value)}` : date
      emit(next)
      setText(toDisplay(next, withTime))
      setOpen(false)
      const input = inputRef.current
      if (input) {
        input.focus()
        // Com hora, já deixa a hora selecionada para digitar por cima.
        if (withTime) requestAnimationFrame(() => input.setSelectionRange(11, 16))
      }
    }

    const updatePosition = useCallback(() => {
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      const below = window.innerHeight - rect.bottom
      const top =
        below < POPOVER_HEIGHT && rect.top > below
          ? Math.max(8, rect.top - POPOVER_HEIGHT - 4)
          : rect.bottom + 4
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 8))
      setPos({ top, left })
    }, [])

    useLayoutEffect(() => {
      if (open) updatePosition()
    }, [open, updatePosition])

    useEffect(() => {
      if (!open) return
      const onPointer = (e: MouseEvent) => {
        const t = e.target as Node
        if (!wrapperRef.current?.contains(t) && !popoverRef.current?.contains(t)) setOpen(false)
      }
      document.addEventListener('mousedown', onPointer)
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        document.removeEventListener('mousedown', onPointer)
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }, [open, updatePosition])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e)
      if (e.key === 'Enter') commit()
      else if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        // Não deixa o Esc fechar o Dialog em volta.
        e.stopPropagation()
        setOpen(false)
      }
    }

    const selected = toDate(value)
    const minDate = toDate(min)
    const maxDate = toDate(max)
    const disabledDays: Matcher[] = []
    if (minDate) disabledDays.push({ before: minDate })
    if (maxDate) disabledDays.push({ after: maxDate })
    const today = new Date()

    return (
      <div ref={wrapperRef} className="relative">
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={withTime ? 'dd/mm/aaaa hh:mm' : 'dd/mm/aaaa'}
          {...props}
          value={text}
          disabled={disabled}
          invalid={invalid}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => {
            commit()
            onBlur?.(e)
          }}
          onKeyDown={handleKeyDown}
          className={cn('pr-9 tabular-nums', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Abrir calendário"
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-indigo-600 disabled:opacity-50 dark:hover:text-indigo-400"
        >
          <CalendarDays className="h-4 w-4" />
        </button>

        {open &&
          pos &&
          createPortal(
            <div
              ref={popoverRef}
              style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
              className="lavixx-calendar fixed z-[60] rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation()
                  setOpen(false)
                  inputRef.current?.focus()
                }
              }}
            >
              <DayPicker
                mode="single"
                locale={ptBR}
                selected={selected}
                onSelect={selectDay}
                defaultMonth={selected ?? today}
                disabled={disabledDays}
                captionLayout="dropdown"
                startMonth={new Date(2000, 0)}
                endMonth={new Date(today.getFullYear() + 5, 11)}
              />
              <div className="mt-2 flex justify-end border-t border-slate-100 pt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => selectDay(today)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                >
                  Hoje
                </button>
              </div>
            </div>,
            document.body,
          )}
      </div>
    )
  },
)
DateInput.displayName = 'DateInput'
