/**
 * Adds getTodayUsageMinutes to expo-app-blocker for Android usage → lock limits.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../node_modules/expo-app-blocker');
const kotlinFile = path.join(
  root,
  'android/src/main/java/expo/modules/appblocker/ExpoAppBlockerModule.kt'
);
const tsFile = path.join(root, 'src/index.ts');

if (!fs.existsSync(kotlinFile)) {
  process.exit(0);
}

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

if (fs.existsSync(tsFile)) {
  let ts = fs.readFileSync(tsFile, 'utf8');
  const marker = 'export async function getTodayUsageMinutes';
  if (!ts.includes(marker)) {
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
    console.log('Patched expo-app-blocker TS: getTodayUsageMinutes');
  }
}
