export type RouteKey =
  | 'bandeja'
  | 'detalle'
  | 'login'
  | 'mi-ticket'
  | 'nuevo-ticket'
  | 'usuarios'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  cargo: string
}

export const getAllowedRoutes = (role: string): RouteKey[] => {
  const normalizedRole = role.trim().toLowerCase()

  if (normalizedRole === 'admin') {
    return ['bandeja', 'detalle', 'mi-ticket', 'nuevo-ticket', 'usuarios']
  }

  if (normalizedRole === 'soporte informatico') {
    return ['bandeja', 'detalle', 'mi-ticket', 'nuevo-ticket']
  }

  if (normalizedRole === 'solicitante') {
    return ['mi-ticket', 'nuevo-ticket', 'detalle']
  }

  return ['bandeja']
}

export const getDefaultRoute = (role: string): RouteKey => {
  const allowedRoutes = getAllowedRoutes(role)
  return allowedRoutes[0] || 'bandeja'
}
