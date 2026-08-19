/**
 * Patches expo-app-blocker:
 * Android: getTodayUsageMinutes for daily usage → lock limits
 * iOS: DeviceActivity threshold monitoring + limit-hit reads
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../node_modules/expo-app-blocker');
const kotlinFile = path.join(
  root,
  'android/src/main/java/expo/modules/appblocker/ExpoAppBlockerModule.kt'
);
const tsFile = path.join(root, 'src/index.ts');
const swiftFile = path.join(root, 'ios/ExpoAppBlockerModule.swift');
const monitorFiles = [
  path.join(root, 'targets/DeviceActivityMonitor/DeviceActivityMonitor.swift'),
  path.join(__dirname, '../targets/DeviceActivityMonitor/DeviceActivityMonitor.swift'),
];

if (fs.existsSync(kotlinFile)) {
  const kotlinMarker = 'AsyncFunction("getTodayUsageMinutes")';
  let kotlin = fs.readFileSync(kotlinFile, 'utf8');

  if (!kotlin.includes(kotlinMarker)) {
    const insertBefore = '    AsyncFunction("getInstalledApps") {';
    const block = `    AsyncFunction("getTodayUsageMinutes") { packageNames: List<String> ->
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      if (mode != AppOpsManager.MODE_ALLOWED) {
        return@AsyncFunction emptyMap<String, Double>()
      }

      val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
      val cal = java.util.Calendar.getInstance()
      cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
      cal.set(java.util.Calendar.MINUTE, 0)
      cal.set(java.util.Calendar.SECOND, 0)
      cal.set(java.util.Calendar.MILLISECOND, 0)
      val start = cal.timeInMillis
      val end = System.currentTimeMillis()
      val wanted = packageNames.toSet()
      val stats = usm.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, start, end)
      val result = mutableMapOf<String, Double>()
      for (stat in stats) {
        if (stat.packageName in wanted) {
          val minutes = stat.totalTimeInForeground / 60000.0
          result[stat.packageName] = minutes
        }
      }
      result
    }

`;
    if (kotlin.includes(insertBefore)) {
      kotlin = kotlin.replace(insertBefore, block + insertBefore);
      fs.writeFileSync(kotlinFile, kotlin);
      console.log('Patched expo-app-blocker Kotlin: getTodayUsageMinutes');
    }
  }
}

if (fs.existsSync(tsFile)) {
  let ts = fs.readFileSync(tsFile, 'utf8');
  if (!ts.includes('export async function getTodayUsageMinutes')) {
    const insertBefore = 'export async function getInstalledApps(): Promise<AndroidBlockableApp[]> {';
    const block = `export async function getTodayUsageMinutes(
  packageNames: string[]
): Promise<Record<string, number>> {
  if (Platform.OS !== "android") return {};
  return NativeModule.getTodayUsageMinutes(packageNames);
}

`;
    ts = ts.replace(insertBefore, block + insertBefore);
    fs.writeFileSync(tsFile, ts);
    ts = fs.readFileSync(tsFile, 'utf8');
    console.log('Patched expo-app-blocker TS: getTodayUsageMinutes');
  }

  if (!ts.includes('export function getLimitHits')) {
    const insertAfter = `export function addPendingUnlockListener(
  handler: () => void
): { remove: () => void } | null {
  if (Platform.OS !== "ios") return null;
  const emitter = new EventEmitter(NativeModule);
  return (emitter as any).addListener("onPendingUnlockRequest", handler);
}`;
    const extra = `
export function getLimitHits(): { appId: string; at?: string }[] {
  if (Platform.OS !== "ios") return [];
  return NativeModule.getLimitHits?.() ?? [];
}

export function clearLimitHits(): void {
  if (Platform.OS !== "ios") return;
  NativeModule.clearLimitHits?.();
}

export async function startDailyLimitMonitoring(
  limits: { appId: string; token: string; minutes: number; type: string }[]
): Promise<void> {
  if (Platform.OS !== "ios") return;
  await NativeModule.startDailyLimitMonitoring(limits);
}
`;
    if (ts.includes(insertAfter)) {
      ts = ts.replace(insertAfter, insertAfter + extra);
      fs.writeFileSync(tsFile, ts);
      console.log('Patched expo-app-blocker TS: iOS limit hits');
    }
  }
}

if (fs.existsSync(swiftFile)) {
  let swift = fs.readFileSync(swiftFile, 'utf8');
  if (!swift.includes('Function("getLimitHits")')) {
    const insertAfter = `    Function("checkAndClearPendingUnlock") { () -> Bool in
      guard let defaults = self.sharedDefaults else { return false }
      let hasPending = defaults.bool(forKey: self.pendingUnlockKey)
      if hasPending {
        defaults.removeObject(forKey: self.pendingUnlockKey)
        defaults.synchronize()
      }
      return hasPending
    }`;
    const extra = `

    Function("getLimitHits") { () -> [[String: Any]] in
      guard let data = self.sharedDefaults?.array(forKey: "scroll.limitHits.v1") as? [[String: Any]] else {
        return []
      }
      return data
    }

    Function("clearLimitHits") {
      self.sharedDefaults?.removeObject(forKey: "scroll.limitHits.v1")
    }

    AsyncFunction("startDailyLimitMonitoring") { (limits: [[String: Any]], promise: Promise) in
      self.stateQueue.async {
        do {
          let activityName = DeviceActivityName("scroll.daily.limits")
          self.activityCenter.stopMonitoring([activityName])
          if limits.isEmpty {
            DispatchQueue.main.async { promise.resolve(nil) }
            return
          }

          let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0, second: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
            repeats: true
          )

          var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
          for item in limits {
            guard let appId = item["appId"] as? String,
                  let tokenString = item["token"] as? String,
                  let minutes = item["minutes"] as? Int, minutes > 0 else { continue }
            let type = (item["type"] as? String ?? "app").lowercased()
            let eventName = DeviceActivityEvent.Name(appId)
            if type == "category", let token = self.decodeCategoryToken(from: tokenString) {
              events[eventName] = DeviceActivityEvent(
                categories: [token],
                threshold: DateComponents(minute: minutes)
              )
            } else if let token = self.decodeApplicationToken(from: tokenString) {
              events[eventName] = DeviceActivityEvent(
                applications: [token],
                threshold: DateComponents(minute: minutes)
              )
            }
          }

          if events.isEmpty {
            DispatchQueue.main.async { promise.resolve(nil) }
            return
          }

          try self.activityCenter.startMonitoring(activityName, during: schedule, events: events)
          DispatchQueue.main.async { promise.resolve(nil) }
        } catch {
          DispatchQueue.main.async {
            promise.reject("MONITOR_ERROR", error.localizedDescription)
          }
        }
      }
    }`;
    if (swift.includes(insertAfter)) {
      swift = swift.replace(insertAfter, insertAfter + extra);
      fs.writeFileSync(swiftFile, swift);
      console.log('Patched expo-app-blocker Swift: iOS limit monitoring');
    }
  }
}

const monitorMarker = 'override func eventDidReachThreshold';
const monitorInsertAfter = `  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
  }`;
const monitorBlock = `
  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    super.eventDidReachThreshold(event, activity: activity)
    var hits = sharedDefaults?.array(forKey: "scroll.limitHits.v1") as? [[String: Any]] ?? []
    hits.append([
      "appId": event.rawValue,
      "at": ISO8601DateFormatter().string(from: Date())
    ])
    sharedDefaults?.set(hits, forKey: "scroll.limitHits.v1")
    reapplyBlockConfiguration()
  }`;

for (const file of monitorFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(monitorMarker)) continue;
  if (!content.includes(monitorInsertAfter)) continue;
  content = content.replace(monitorInsertAfter, monitorInsertAfter + monitorBlock);
  fs.writeFileSync(file, content);
  console.log('Patched DeviceActivityMonitor: eventDidReachThreshold', file);
}
