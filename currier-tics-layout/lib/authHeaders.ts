export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export const withAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const merged = new Headers(headers)
  const token = getAuthToken()

  if (token && !merged.has("Authorization")) {
    merged.set("Authorization", `Bearer ${token}`)
  }

  return merged
}