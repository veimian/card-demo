import { Link } from 'react-router-dom'
import { CardWithDetails } from '../types/app'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface CardItemProps {
  card: CardWithDetails
}

export default function CardItem({ card }: CardItemProps) {
  const categoryColor = card.categories?.color || '#2563eb'

  return (
    <Link
      to={`/card/${card.id}`}
      className="group relative block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 p-6 h-full flex flex-col overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {card.title}
        </h3>
        {card.categories && (
          <span
            className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {card.categories.name}
          </span>
        )}
      </div>

      <div className="flex-1 mb-6">
        {card.summary ? (
          <div className="relative">
            <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 rounded-xl border border-gray-100">
              <span className="mr-1">✨</span>
              {card.summary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 line-clamp-4 leading-relaxed">
            {card.content}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <div className="flex flex-wrap gap-1.5">
          {card.card_tags.slice(0, 3).map(({ tags }) => (
            tags && (
              <span
                key={tags.id}
                className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-gray-50 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
              >
                #{tags.name}
              </span>
            )
          ))}
          {card.card_tags.length > 3 && (
            <span className="inline-flex items-center px-1.5 py-1 rounded-md text-[10px] font-medium text-gray-400">
              +{card.card_tags.length - 3}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-gray-300 group-hover:text-blue-400 transition-colors whitespace-nowrap ml-2">
          {format(new Date(card.created_at), 'MM月dd日', { locale: zhCN })}
        </span>
      </div>
    </Link>
  )
}
