import fs from 'fs';
import path from 'path';

interface VisitorRecord {
  deviceId: string;
  name: string;
  role: string;
  userAgent: string;
  ip?: string;
  lastActive: string;
  firstVisit: string;
  totalVisits: number;
  lastPageVisited?: string;
}

interface AnalyticsData {
  totalPageViews: number;
  visitors: Record<string, VisitorRecord>;
}

const DATA_FILE = path.join(__dirname, '../../data/real_visitor_analytics.json');

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadAnalyticsFromFile(): AnalyticsData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.totalPageViews === 'number' && parsed.visitors) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[Analytics Service] Error reading analytics file:', e);
  }
  return {
    totalPageViews: 0,
    visitors: {}
  };
}

function saveAnalyticsToFile(data: AnalyticsData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[Analytics Service] Error writing analytics file:', e);
  }
}

let currentAnalytics: AnalyticsData = loadAnalyticsFromFile();

export function trackRealVisitor(payload: {
  deviceId: string;
  name?: string;
  role?: string;
  page?: string;
  userAgent?: string;
  ip?: string;
}): { totalPageViews: number; totalUniqueVisitors: number } {
  const deviceId = payload.deviceId || 'DEV-ANONYMOUS-GUEST';
  const now = new Date().toISOString();

  currentAnalytics.totalPageViews += 1;

  if (currentAnalytics.visitors[deviceId]) {
    const existing = currentAnalytics.visitors[deviceId];
    existing.lastActive = now;
    existing.totalVisits += 1;
    if (payload.name && payload.name !== 'زائر متصفح') existing.name = payload.name;
    if (payload.role) existing.role = payload.role;
    if (payload.page) existing.lastPageVisited = payload.page;
    if (payload.userAgent) existing.userAgent = payload.userAgent;
    if (payload.ip) existing.ip = payload.ip;
  } else {
    currentAnalytics.visitors[deviceId] = {
      deviceId: deviceId,
      name: payload.name || 'زائر متصفح (Guest User)',
      role: payload.role || 'متصفح صيدلاني / زائر',
      userAgent: payload.userAgent || 'Unknown Device',
      ip: payload.ip || 'Local/Client IP',
      lastActive: now,
      firstVisit: now,
      totalVisits: 1,
      lastPageVisited: payload.page || '/'
    };
  }

  saveAnalyticsToFile(currentAnalytics);

  return {
    totalPageViews: currentAnalytics.totalPageViews,
    totalUniqueVisitors: Object.keys(currentAnalytics.visitors).length
  };
}

export function getRealAdminStats(): any {
  const visitorList = Object.values(currentAnalytics.visitors).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  );

  return {
    totalVisits: currentAnalytics.totalPageViews,
    totalVisitors: visitorList.length,
    visitors: visitorList,
    masterDrugsCount: 15000,
    interactionsCount: 15000,
    comparisonsCount: 15000,
    alternativesCount: 15000,
    scheduledDrugsCount: 224
  };
}

export function clearRealAnalytics(): boolean {
  currentAnalytics = { totalPageViews: 0, visitors: {} };
  saveAnalyticsToFile(currentAnalytics);
  return true;
}
