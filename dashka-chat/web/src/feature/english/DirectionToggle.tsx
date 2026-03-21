// feature/german/DirectionToggle.tsx
// v1.2 — Direction toggle: RU→DE | DE→RU
// Self-contained, no external deps

import React from 'react'
import type { Direction } from '../../core/types/translator.types'
import { DIRECTION_CONFIG } from '../../core/types/translator.types'

interface Props {
  direction: Direction
  onToggle: () => void
  disabled?: boolean
}

const DirectionToggle: React.FC<Props> = ({ direction, onToggle, disabled }) => {
  const cfg     = DIRECTION_CONFIG[direction]
  const isRuEn = direction === 'RU_EN'

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-label={`Направление: ${cfg.label}. Нажмите для смены.`}
      className={`
        w-full flex items-center justify-between
        rounded-2xl px-5 py-3
        border transition-all duration-200 select-none
        ${disabled
          ? 'opacity-40 cursor-not-allowed border-white/10 bg-white/5'
          : 'cursor-pointer border-white/15 bg-white/5 hover:bg-white/10 active:scale-[0.98]'
        }
      `}
    >
      {/* Source lang */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <span className="text-xl">{cfg.flag_from}</span>
        <span className="text-white font-semibold text-sm tracking-wide">
          {cfg.source}
        </span>
      </div>

      {/* Toggle arrow with animation */}
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={`
            flex items-center justify-center w-8 h-8 rounded-full
            transition-all duration-300
            ${isRuEn
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-indigo-500/20 text-indigo-400'
            }
          `}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 transition-transform duration-300 ${isRuEn ? 'rotate-0' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
        <span className="text-[10px] text-white/30 font-mono tracking-widest">
          {isRuEn ? 'RU→EN' : 'EN→RU'}
        </span>
      </div>

      {/* Target lang */}
      <div className="flex items-center gap-2 justify-end min-w-[80px]">
        <span className="text-white font-semibold text-sm tracking-wide">
          {cfg.target}
        </span>
        <span className="text-xl">{cfg.flag_to}</span>
      </div>
    </button>
  )
}

export default DirectionToggle
