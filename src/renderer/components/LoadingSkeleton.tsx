export default function LoadingSkeleton() {
  return (
    <div className="overlay-panel w-full max-w-4xl mx-auto p-5">
      {/* 头部骨架 */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="skeleton w-2.5 h-2.5 rounded-full" />
        <div className="skeleton w-24 h-3" />
      </div>

      {/* 蓝方 5 人骨架 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="skeleton w-1 h-4 rounded-full" />
        <div className="skeleton w-20 h-3" />
      </div>
      <div className="grid grid-cols-5 gap-2.5 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`b${i}`} className="player-card p-3">
            <div className="flex items-start gap-2 mb-2">
              <div className="skeleton w-[34px] h-[34px] rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="skeleton w-16 h-3 mb-1.5" />
                <div className="skeleton w-14 h-4 rounded-md" />
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
              <div>
                <div className="skeleton w-6 h-2 mb-1" />
                <div className="skeleton w-8 h-4" />
              </div>
              <div className="text-right">
                <div className="skeleton w-6 h-2 mb-1" />
                <div className="skeleton w-10 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VS 分割线骨架 */}
      <div className="flex items-center gap-3 my-2 px-1">
        <div className="flex-1 h-px bg-white/[0.02]" />
        <div className="skeleton w-6 h-3" />
        <div className="flex-1 h-px bg-white/[0.02]" />
      </div>

      {/* 红方 5 人骨架 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="skeleton w-1 h-4 rounded-full" />
        <div className="skeleton w-20 h-3" />
      </div>
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`r${i}`} className="player-card p-3">
            <div className="flex items-start gap-2 mb-2">
              <div className="skeleton w-[34px] h-[34px] rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="skeleton w-16 h-3 mb-1.5" />
                <div className="skeleton w-14 h-4 rounded-md" />
              </div>
            </div>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
              <div>
                <div className="skeleton w-6 h-2 mb-1" />
                <div className="skeleton w-8 h-4" />
              </div>
              <div className="text-right">
                <div className="skeleton w-6 h-2 mb-1" />
                <div className="skeleton w-10 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
