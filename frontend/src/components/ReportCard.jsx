import { FILE_URL } from '../api'

function formatDate(mysqlDate) {
  const date = new Date(mysqlDate.replace(' ', 'T'))
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ReportCard({ report }) {
  const title = [report.brand, report.category].filter(Boolean).join(' ')
  const badgeClass = 'badge ' + report.status.toLowerCase().replace(' ', '-')

  return (
    <div className="report-card">
      {report.photo_url ? (
        <img
          className="thumb"
          src={`${FILE_URL}/${report.photo_url}`}
          alt={title}
        />
      ) : (
        <div className="thumb placeholder">{report.category.charAt(0)}</div>
      )}

      <div className="report-info">
        <strong>{title}</strong>
        <span className="date">Date: {formatDate(report.created_at)}</span>
      </div>

      <span className={badgeClass}>{report.status}</span>
    </div>
  )
}

export default ReportCard