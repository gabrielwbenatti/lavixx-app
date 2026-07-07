import { api } from '@/lib/api'
import type { ReportSummaryResponse } from '@/types/report'

/** GET /reports/summary — fechamento por período (datas yyyy-MM-dd). */
export async function getReportSummary(
  from: string,
  to: string,
): Promise<ReportSummaryResponse> {
  const { data } = await api.get<ReportSummaryResponse>('/reports/summary', {
    params: { from, to },
  })
  return data
}
