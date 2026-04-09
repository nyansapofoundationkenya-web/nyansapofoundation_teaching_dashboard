// components/Household/InfiniteScrollList.js
import { useEffect, useRef, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import HouseholdList from './HouseholdList'

export default function InfiniteScrollList({ 
  households, 
  loading, 
  hasMore, 
  onLoadMore 
}) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

  useEffect(() => {
    if (inView && hasMore && !loading) {
      onLoadMore()
    }
  }, [inView, hasMore, loading, onLoadMore])

  return (
    <div className="space-y-4">
      <HouseholdList households={households} loading={loading && households.length === 0} />
      
      {/* Sentinel element for infinite scroll */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-4 h-4 border-2 border-primary-2 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading more...</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Scroll for more</div>
          )}
        </div>
      )}
      
      {!hasMore && households.length > 0 && (
        <div className="text-center py-4 text-gray-400">
          ✓ Loaded all {households.length} households
        </div>
      )}
    </div>
  )
}