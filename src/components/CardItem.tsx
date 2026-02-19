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
      className="group relative block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300 p-3 md:p-6 h-full flex flex-col overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="flex flex-col gap-2 mb-2 md:mb-4">
        <h3 className="text-sm md:text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {card.title}
        </h3>
        {card.categories && (
          <span
            className="self-start inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wide uppercase"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {card.categories.name}
          </span>
        )}
      </div>

      <div className="flex-1 mb-2 md:mb-6">
        {card.summary ? (
          <div className="relative">
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-700/50 dark:to-blue-900/20 p-2 md:p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="mr-1">✨</span>
              {card.summary}
            </p>
          </div>
        ) : (
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
            {card.content}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 md:pt-4 border-t border-gray-50 dark:border-gray-700/50">
        <div className="flex flex-wrap gap-1">
          {card.card_tags.slice(0, 2).map(({ tags }) => (
            tags && (
              <span
                key={tags.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-medium bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                #{tags.name}
              </span>
            )
          ))}
        </div>
        <span className="text-[10px] md:text-xs font-medium text-gray-300 dark:text-gray-600 group-hover:text-blue-400 dark:group-hover:text-blue-500 transition-colors whitespace-nowrap ml-1">
          {format(new Date(card.created_at), 'MM/dd', { locale: zhCN })}
        </span>
      </div>
    </Link>
  )
}
