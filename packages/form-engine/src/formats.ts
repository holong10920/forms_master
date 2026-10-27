/** Bounded, locale-independent validators mirrored by the Go backend. */
export const formatPatterns: Readonly<Record<string, RegExp>> = {
  formatEmail:
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/u,
  formatPhoneJP: /^0[0-9]{9,10}$/u,
  formatPostalJP: /^[0-9]{7}$/u,
  formatKatakana: /^[\u30a1-\u30fa\u30fc\u3000 ]+$/u,
};
export function validFormat(name: string, value: unknown): boolean {
  if (typeof value !== "string") return false;
  if (name !== "formatDate") return formatPatterns[name]?.test(value) ?? false;
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const days = [
    31,
    y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= (days[m - 1] ?? 0);
}
