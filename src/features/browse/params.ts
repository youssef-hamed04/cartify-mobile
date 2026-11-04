// useLocalSearchParams can return string | string[]; take the first non-empty value
export const first = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s ? s : undefined;
};
