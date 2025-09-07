export function getEnvVar(name: string, fallback?: string) {
  const v = process.env[name]
  if (v && v.length > 0) return v
  return fallback
}

