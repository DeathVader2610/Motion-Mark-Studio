import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
export async function AnalyticsPanel() {
  await requireAdmin(true);
  const [days, pages] = await Promise.all([
    query<{ day: string; views: number; visits: number }>(
      `SELECT to_char(d,'YYYY-MM-DD') AS "day",count(v.event_id)::int views,count(DISTINCT v.visitor_hash)::int visits FROM generate_series(current_date-29,current_date,'1 day') d LEFT JOIN site_visits v ON v.day=d::date GROUP BY d ORDER BY d`,
    ),
    query<{ path: string; views: number }>(
      "SELECT path,count(*)::int views FROM site_visits WHERE day>=current_date-29 GROUP BY path ORDER BY views DESC LIMIT 10",
    ),
  ]);
  const total = days.reduce((s, d) => s + d.views, 0),
    visits = days.reduce((s, d) => s + d.visits, 0),
    max = Math.max(1, ...days.map((d) => d.views));
  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FOUNDER OFFICE ONLY</p>
          <h2>Your studio, seen.</h2>
          <p>
            Real activity from visitors who allow anonymous measurement.
            Tracking starts when this version is live; no historical figures are
            invented.
          </p>
        </div>
        <span className="pill">Last 30 days · UTC</span>
      </div>
      <div className="metric-grid">
        <Metric
          label="Page views"
          value={total}
          detail="Public website pages"
        />
        <Metric
          label="Visits"
          value={visits}
          detail="Browser-tab sessions, counted per day"
        />
        <Metric
          label="Views today"
          value={days.at(-1)?.views || 0}
          detail="Since midnight UTC"
        />
      </div>
      <section className="dash-panel">
        <div className="panel-heading">
          <h3>Daily page views</h3>
          <span className="eyebrow">30-DAY VIEW</span>
        </div>
        <div
          className="analytics-bars"
          role="img"
          aria-label={`Daily page views over the last 30 days. Total ${total}. A data table follows.`}
        >
          {days.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.views} views`}
              style={{ height: `${Math.max(2, (d.views / max) * 100)}%` }}
            />
          ))}
        </div>
        <div className="chart-axis">
          <span>{days[0]?.day}</span>
          <span>{days.at(-1)?.day}</span>
        </div>
        <details>
          <summary>View daily numbers</summary>
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Views</th>
                  <th>Visits</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.day}>
                    <td>{d.day}</td>
                    <td>{d.views}</td>
                    <td>{d.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="dash-panel">
        <h3>Most viewed pages</h3>
        {pages.length ? (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.path}>
                  <td>{p.path}</td>
                  <td>{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No measured visits yet. The chart will grow as visitors opt in.</p>
        )}
      </section>
      <p className="form-help">
        Visits are not a count of unique people. Returning in another tab or day
        can count again. Ad blockers, declined consent and failed requests can
        reduce totals. No raw IP addresses, emails or query strings are stored
        in visit records. Records are retained for up to 90 days.
      </p>
    </>
  );
}
export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </strong>
      <small>{detail}</small>
      <span aria-hidden="true">↗</span>
    </article>
  );
}
