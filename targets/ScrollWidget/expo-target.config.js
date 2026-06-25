/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => {
  const appGroup = config.ios?.entitlements?.["com.apple.security.application-groups"]?.[0]
    || "group.expo.app-blocker";

  return {
    type: "widget",
    name: "ScrollWidget",
    deploymentTarget: "16.0",
    bundleIdentifier: ".ScrollWidget",
    frameworks: ["WidgetKit", "SwiftUI"],
    entitlements: {
      "com.apple.security.application-groups": [appGroup],
    },
  };
};
