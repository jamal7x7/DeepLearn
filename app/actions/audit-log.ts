import { db } from '@/lib/db/drizzle';
import { auditLogs } from '@/lib/db/schema';
import { users } from '@/lib/db/schema';
import { desc, eq, count, and, ilike, gte, lte } from 'drizzle-orm';

interface AuditLogFilters {
  action?: string;
  user?: string;
  announcementId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch audit logs with pagination, user join, and filters.
 */
export async function fetchAuditLogs(filters: AuditLogFilters = {}) {
  const {
    action,
    user,
    announcementId,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = filters;
  const offset = (page - 1) * pageSize;
  const whereClauses = [];
  if (action) whereClauses.push(eq(auditLogs.action, action));
  if (user) whereClauses.push(ilike(users.name, `%${user}%`));
  if (announcementId) whereClauses.push(eq(auditLogs.announcementId, announcementId));
  if (dateFrom) whereClauses.push(gte(auditLogs.timestamp, new Date(dateFrom)));
  if (dateTo) whereClauses.push(lte(auditLogs.timestamp, new Date(dateTo)));
  const logs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    userId: auditLogs.userId,
    announcementId: auditLogs.announcementId,
    details: auditLogs.details,
    timestamp: auditLogs.timestamp,
    userName: users.name,
    userEmail: users.email,
  })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .where(whereClauses.length ? and(...whereClauses) : undefined)
    .orderBy(desc(auditLogs.timestamp))
    .limit(pageSize)
    .offset(offset);

  const total = await db.select({ count: count() }).from(auditLogs).where(whereClauses.length ? and(...whereClauses) : undefined);
  const countValue = total[0]?.count ?? 0;
  return { logs, count: Number(countValue) };
}

/**
 * Export audit logs as CSV (with filters).
 */
export async function exportAuditLogsCsv(filters: AuditLogFilters = {}) {
  const { logs } = await fetchAuditLogs({ ...filters, page: 1, pageSize: 10000 });
  const header = ['ID', 'Action', 'User', 'Announcement', 'Details', 'Timestamp'];
  const rows = logs.map(log => [
    log.id,
    log.action,
    log.userName || log.userEmail || log.userId,
    log.announcementId ?? '',
    log.details ?? '',
    log.timestamp ? new Date(log.timestamp).toISOString() : '',
  ]);
  const csv = [header, ...rows].map(row => row.map(String).map(s => '"' + s.replace(/"/g, '""') + '"').join(',')).join('\n');
  return csv;
}
