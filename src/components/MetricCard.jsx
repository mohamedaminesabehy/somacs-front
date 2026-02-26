export default function MetricCard({ icon, title, value, subtitle, color = 'blue' }) {
  const Icon = icon
  const colorClasses = {
    blue: 'bg-blue-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
  }

  const iconBgClasses = {
    blue: 'bg-blue-100',
    orange: 'bg-orange-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    red: 'text-red-600',
  }

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 sm:p-6 border border-gray-100`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{value}</p>
          <p className="text-xs text-gray-600">{subtitle}</p>
        </div>
        <div className={`${iconBgClasses[color]} p-3 rounded-lg`}>
          <Icon className={`${iconColorClasses[color]}`} size={24} />
        </div>
      </div>
    </div>
  )
}
