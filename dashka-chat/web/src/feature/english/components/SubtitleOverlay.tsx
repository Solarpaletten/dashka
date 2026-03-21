import React from 'react'

interface Props {
  sourceText?: string
  translatedText?: string
  visible?: boolean
}

const SubtitleOverlay: React.FC<Props> = ({
  sourceText,
  translatedText,
  visible = true,
}) => {
  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center pb-10 px-6">
      <div className="max-w-5xl w-full text-center">
        {sourceText && (
          <div className="mb-2 text-white text-2xl md:text-3xl font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {sourceText}
          </div>
        )}
        {translatedText && (
          <div className="text-yellow-300 text-2xl md:text-3xl font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            {translatedText}
          </div>
        )}
      </div>
    </div>
  )
}

export default SubtitleOverlay