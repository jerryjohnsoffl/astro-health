import bodySvg from '../../assets/body.svg'
import skeletonSvg from '../../assets/skeleton.svg'
import cardioSvg from '../../assets/cardio.svg'
import neuroSvg from '../../assets/neuro.svg'
import renalSvg from '../../assets/renal.svg'

const layers = [
  { id: 'body', src: bodySvg, label: 'Body' },
  { id: 'skeleton', src: skeletonSvg, label: 'Skeleton' },
  { id: 'cardio', src: cardioSvg, label: 'Cardio' },
  { id: 'neuro', src: neuroSvg, label: 'Neuro' },
  { id: 'renal', src: renalSvg, label: 'Renal' },
]

export default function BodyMap() {
  return (
    <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_center,_rgba(21,88,160,0.28),_rgba(7,17,32,0.9)_55%,_rgba(2,6,18,0.96))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(72,152,255,0.12),transparent_55%)]" />
      <div className="relative h-[480px] w-[330px]">
        {layers.map((layer, index) => (
          <img
            key={layer.id}
            src={layer.src}
            alt={layer.label}
            className="absolute inset-0 h-full w-full object-contain"
            style={{
              opacity: layer.id === 'body' ? 1 : 0.8,
              filter: layer.id === 'body'
                ? 'drop-shadow(0 0 18px rgba(88, 194, 255, 0.42))'
                : 'drop-shadow(0 0 12px rgba(81, 208, 255, 0.28))',
              mixBlendMode: 'screen',
              transform: index === 0 ? 'scale(1.02)' : `scale(${1 + index * 0.004})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
