/**
 * Xcode 26+ treats STPPaymentStatus NSUInteger vs NSInteger mismatch as error.
 * @see https://github.com/stripe/stripe-react-native/issues/2357
 */
const fs = require('fs');
const path = require('path');

const direct = path.join(
  __dirname,
  '../node_modules/@stripe/stripe-react-native/ios/StripeSwiftInterop.h'
);
const file = fs.existsSync(direct)
  ? direct
  : (() => {
      const pnpmRoot = path.join(__dirname, '../node_modules/.pnpm');
      if (!fs.existsSync(pnpmRoot)) return direct;
      for (const entry of fs.readdirSync(pnpmRoot)) {
        if (!entry.startsWith('@stripe+stripe-react-native@')) continue;
        const candidate = path.join(
          pnpmRoot,
          entry,
          'node_modules/@stripe/stripe-react-native/ios/StripeSwiftInterop.h'
        );
        if (fs.existsSync(candidate)) return candidate;
      }
      return direct;
    })();

if (!fs.existsSync(file)) {
  process.exit(0);
}

const text = fs.readFileSync(file, 'utf8');
const from = 'typedef NS_ENUM(NSUInteger, STPPaymentStatus);';
const to = 'typedef NS_ENUM(NSInteger, STPPaymentStatus);';

if (text.includes(from)) {
  fs.writeFileSync(file, text.replace(from, to));
  console.log('Patched @stripe/stripe-react-native for Xcode 26');
}
