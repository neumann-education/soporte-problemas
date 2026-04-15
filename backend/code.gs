const SPREADSHEET_ID = '1vCMOUU_tklbfpqeG0pLGctaWfD629zLFB1LfIrUITaA'
const ATTACHMENTS_FOLDER_ID = '1xWkdq0M1E6SfSurX25RToOdW8BHo5Gef'
const TICKETS_SHEET_NAME = 'Tickets'
const USERS_SHEET_NAME = 'Usuarios'

const DEFAULT_ADMIN = {
  name: 'Administrador',
  email: 'admin@empresa.com',
  password: 'admin123',
  role: 'Admin',
  cargo: 'Administrador',
}

const TICKET_HEADERS = [
  'Fecha de creación',
  'ID de ticket',
  'Nombre del solicitante',
  'ID del solicitante',
  'Área',
  'Ubicación',
  'Prioridad',
  'Estado',
  'Etiquetas',
  'Descripción',
  'Piso',
  'Salón',
  'ID de encargado',
  'Nombre de encargado',
  'Adjuntos',
  'Descripción de la solución',
  'Observaciones',
  'Fecha inicio',
  'Fecha entrega',
  'Email solicitante',
  'Email encargado',
  'Thread ID',
]

const USER_HEADERS = [
  'ID',
  'Nombre',
  'Correo',
  'Password',
  'Rol',
  'Cargo',
  'Activo',
  'Creado',
]

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : ''

  if (action === 'users') {
    const usersSheet = getUsersSheet()
    const headerRow = ensureHeaders(usersSheet, USER_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const usersLastRow = usersSheet.getLastRow()
    const rows =
      usersLastRow > 1
        ? usersSheet
            .getRange(2, 1, usersLastRow - 1, usersSheet.getLastColumn())
            .getValues()
        : []

    const users = rows.map((row) => ({
      id: getRowValue(row, headerMap, 'ID'),
      name: getRowValue(row, headerMap, 'Nombre'),
      email: getRowValue(row, headerMap, 'Correo'),
      password: getRowValue(row, headerMap, 'Password'),
      role: getRowValue(row, headerMap, 'Rol'),
      cargo: getRowValue(row, headerMap, 'Cargo'),
      active: getRowValue(row, headerMap, 'Activo') !== 'NO',
      createdAt: toIsoString(getRowValue(row, headerMap, 'Creado')),
    }))

    return jsonResponse({ success: true, users })
  }

  const sheet = getTicketSheet()
  const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
  const headerMap = buildHeaderMap(headerRow)
  const sheetLastRow = sheet.getLastRow()
  const rows =
    sheetLastRow > 1
      ? sheet
          .getRange(2, 1, sheetLastRow - 1, sheet.getLastColumn())
          .getValues()
      : []
  const tickets = rows.map((row) => ({
    createdAt: toIsoString(getRowValue(row, headerMap, 'Fecha de creación')),
    ticketId: getRowValue(row, headerMap, 'ID de ticket'),
    applicantName: getRowValue(row, headerMap, 'Nombre del solicitante'),
    applicantId: getRowValue(row, headerMap, 'ID del solicitante'),
    area: getRowValue(row, headerMap, 'Área'),
    location: getRowValue(row, headerMap, 'Ubicación'),
    priority: getRowValue(row, headerMap, 'Prioridad'),
    status: getRowValue(row, headerMap, 'Estado'),
    tags: splitTags(getRowValue(row, headerMap, 'Etiquetas')),
    description: getRowValue(row, headerMap, 'Descripción'),
    floor: getRowValue(row, headerMap, 'Piso'),
    salon: getRowValue(row, headerMap, 'Salón'),
    encargadoId: getRowValue(row, headerMap, 'ID de encargado'),
    encargadoName: getRowValue(row, headerMap, 'Nombre de encargado'),
    attachments: splitTags(getRowValue(row, headerMap, 'Adjuntos')),
    solutionDescription: getRowValue(
      row,
      headerMap,
      'Descripción de la solución',
    ),
    solutionObservation: getRowValue(row, headerMap, 'Observaciones'),
    solutionStartAt: toIsoString(getRowValue(row, headerMap, 'Fecha inicio')),
    solutionEndAt: toIsoString(getRowValue(row, headerMap, 'Fecha entrega')),
    applicantEmail: getRowValue(row, headerMap, 'Email solicitante'),
    encargadoEmail: getRowValue(row, headerMap, 'Email encargado'),
    threadId: getRowValue(row, headerMap, 'Thread ID'),
  }))

  return jsonResponse({ success: true, tickets })
}

function doPost(e) {
  if (!e.postData || !e.postData.contents) {
    return jsonResponse({ success: false, error: 'No request body received.' })
  }

  let payload
  try {
    payload = JSON.parse(e.postData.contents)
  } catch (error) {
    return jsonResponse({
      success: false,
      error: 'Request body is not valid JSON.',
    })
  }

  const action = payload.action || 'create_ticket'

  if (action === 'login') {
    const usersSheet = getUsersSheet()
    const headerRow = ensureHeaders(usersSheet, USER_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const usersLastRow = usersSheet.getLastRow()
    const rows =
      usersLastRow > 1
        ? usersSheet
            .getRange(2, 1, usersLastRow - 1, usersSheet.getLastColumn())
            .getValues()
        : []

    const user = rows
      .map((row) => ({
        id: getRowValue(row, headerMap, 'ID'),
        name: getRowValue(row, headerMap, 'Nombre'),
        email: getRowValue(row, headerMap, 'Correo'),
        password: getRowValue(row, headerMap, 'Password'),
        role: getRowValue(row, headerMap, 'Rol'),
        cargo: getRowValue(row, headerMap, 'Cargo'),
        active: getRowValue(row, headerMap, 'Activo') !== 'NO',
      }))
      .find((item) => item.email === payload.email && item.active)

    if (!user) {
      return jsonResponse({ success: false, error: 'Credenciales inválidas.' })
    }

    if (!verifyPassword(payload.password, user.password)) {
      return jsonResponse({ success: false, error: 'Credenciales inválidas.' })
    }

    if (!isHashedPassword(user.password)) {
      const updateResult = updateUserById(usersSheet, headerMap, user.id, {
        Password: hashPassword(payload.password),
      })
      if (!updateResult) {
        return jsonResponse({
          success: false,
          error: 'No se pudo actualizar credenciales.',
        })
      }
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cargo: user.cargo,
      },
    })
  }

  if (action === 'create_user') {
    const requiredFields = ['name', 'email', 'password', 'role', 'cargo']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const usersSheet = getUsersSheet()
    const headerRow = ensureHeaders(usersSheet, USER_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const usersLastRow = usersSheet.getLastRow()
    const rows =
      usersLastRow > 1
        ? usersSheet
            .getRange(2, 1, usersLastRow - 1, usersSheet.getLastColumn())
            .getValues()
        : []
    const emailExists = rows.some(
      (row) => getRowValue(row, headerMap, 'Correo') === payload.email,
    )
    if (emailExists) {
      return jsonResponse({
        success: false,
        error: 'Ya existe un usuario con ese correo.',
      })
    }

    const now = new Date()
    const newUser = {
      id: Utilities.getUuid(),
      name: payload.name,
      email: payload.email,
      password: hashPassword(payload.password),
      role: payload.role,
      cargo: payload.cargo,
      active: payload.active !== false,
    }

    usersSheet.appendRow([
      newUser.id,
      newUser.name,
      newUser.email,
      newUser.password,
      newUser.role,
      newUser.cargo,
      newUser.active ? 'SI' : 'NO',
      now,
    ])

    return jsonResponse({ success: true, user: newUser })
  }

  if (action === 'update_user') {
    const requiredFields = ['id', 'name', 'email', 'role', 'cargo']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const usersSheet = getUsersSheet()
    const headerRow = ensureHeaders(usersSheet, USER_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const usersLastRow = usersSheet.getLastRow()
    const rows =
      usersLastRow > 1
        ? usersSheet
            .getRange(2, 1, usersLastRow - 1, usersSheet.getLastColumn())
            .getValues()
        : []

    const emailExists = rows.some((row) => {
      const rowId = getRowValue(row, headerMap, 'ID')
      const rowEmail = getRowValue(row, headerMap, 'Correo')
      return rowId !== payload.id && rowEmail === payload.email
    })
    if (emailExists) {
      return jsonResponse({
        success: false,
        error: 'Ya existe un usuario con ese correo.',
      })
    }

    const updates = {
      Nombre: payload.name,
      Correo: payload.email,
      Rol: payload.role,
      Cargo: payload.cargo,
      Activo:
        String(payload.active).toLowerCase() === 'false' ||
        String(payload.active).toLowerCase() === 'no'
          ? 'NO'
          : 'SI',
    }

    if (payload.password && String(payload.password).trim() !== '') {
      updates.Password = hashPassword(payload.password)
    }

    const updateResult = updateUserById(
      usersSheet,
      headerMap,
      payload.id,
      updates,
    )

    if (!updateResult) {
      return jsonResponse({ success: false, error: 'Usuario no encontrado.' })
    }

    return jsonResponse({ success: true })
  }

  if (action === 'start_attention') {
    const requiredFields = ['ticketId', 'encargadoId', 'encargadoName']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const sheet = getTicketSheet()
    const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const updateResult = updateTicketById(sheet, headerMap, payload.ticketId, {
      'Fecha inicio': new Date(),
      Estado: 'En progreso',
      'ID de encargado': payload.encargadoId,
      'Nombre de encargado': payload.encargadoName,
    })

    if (!updateResult) {
      return jsonResponse({ success: false, error: 'Ticket no encontrado.' })
    }

    sendTicketThreadEmail(sheet, headerMap, payload.ticketId, 'in_progress')

    return jsonResponse({ success: true })
  }

  if (action === 'register_solution') {
    const requiredFields = ['ticketId', 'solutionDescription']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const sheet = getTicketSheet()
    const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const updateResult = updateTicketById(sheet, headerMap, payload.ticketId, {
      'Descripción de la solución': payload.solutionDescription,
      Observaciones: payload.solutionObservation || '',
      Estado: 'Terminado',
      'Fecha entrega': new Date(),
      'ID de encargado': payload.encargadoId || '',
      'Nombre de encargado': payload.encargadoName || '',
    })

    if (!updateResult) {
      return jsonResponse({ success: false, error: 'Ticket no encontrado.' })
    }

    let plainBody = `El ticket ${payload.ticketId} ha sido marcado como Terminado.`
    let htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido marcado como <strong>Terminado</strong>.</p>`
    if (
      payload.solutionObservation &&
      String(payload.solutionObservation).trim()
    ) {
      const observation = String(payload.solutionObservation).trim()
      plainBody += ` Observación: ${observation}`
      htmlBody += `<p><strong>Observación:</strong> ${observation}</p>`
    }

    sendTicketThreadEmail(sheet, headerMap, payload.ticketId, 'solved')

    return jsonResponse({ success: true })
  }

  if (action === 'mark_observed') {
    const requiredFields = ['ticketId', 'encargadoId', 'encargadoName']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const sheet = getTicketSheet()
    const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const updateResult = updateTicketById(sheet, headerMap, payload.ticketId, {
      Estado: 'Observado',
      Observaciones: payload.solutionObservation || '',
      'ID de encargado': payload.encargadoId || '',
      'Nombre de encargado': payload.encargadoName || '',
    })

    if (!updateResult) {
      return jsonResponse({ success: false, error: 'Ticket no encontrado.' })
    }

    let plainBody = `El ticket ${payload.ticketId} ha sido marcado como Observado.`
    let htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido marcado como <strong>Observado</strong>.</p>`
    if (
      payload.solutionObservation &&
      String(payload.solutionObservation).trim()
    ) {
      const observation = String(payload.solutionObservation).trim()
      plainBody += ` Observación: ${observation}`
      htmlBody += `<p><strong>Observación:</strong> ${observation}</p>`
    }

    sendTicketThreadEmail(sheet, headerMap, payload.ticketId, 'observed')

    return jsonResponse({ success: true })
  }

  if (action === 'set_solution_status') {
    const requiredFields = ['ticketId', 'solutionStatus']
    const missing = requiredFields.filter(
      (field) => !payload[field] || String(payload[field]).trim() === '',
    )
    if (missing.length) {
      return jsonResponse({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      })
    }

    const sheet = getTicketSheet()
    const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
    const headerMap = buildHeaderMap(headerRow)
    const updateResult = updateTicketById(sheet, headerMap, payload.ticketId, {
      Estado: payload.solutionStatus,
      Observaciones: payload.solutionObservation || '',
    })

    if (!updateResult) {
      return jsonResponse({ success: false, error: 'Ticket no encontrado.' })
    }

    if (
      ['En progreso', 'Terminado', 'Observado'].includes(payload.solutionStatus)
    ) {
      let htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido actualizado a <strong>${payload.solutionStatus}</strong>.</p>`
      let plainBody = `El ticket ${payload.ticketId} ha sido actualizado a ${payload.solutionStatus}.`

      if (payload.solutionStatus === 'En progreso') {
        htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido marcado como <strong>En progreso</strong>.</p>`
      } else if (payload.solutionStatus === 'Terminado') {
        htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido marcado como <strong>Terminado</strong>.</p>`
      } else if (payload.solutionStatus === 'Observado') {
        htmlBody = `<p>Hola,</p><p>El ticket <strong>${payload.ticketId}</strong> ha sido marcado como <strong>Observado</strong>.</p>`
      }

      if (
        payload.solutionObservation &&
        String(payload.solutionObservation).trim()
      ) {
        const observation = String(payload.solutionObservation).trim()
        plainBody += ` Observación: ${observation}`
        htmlBody += `<p><strong>Observación:</strong> ${observation}</p>`
      }

      sendTicketThreadEmail(
        sheet,
        headerMap,
        payload.ticketId,
        payload.solutionStatus === 'En progreso'
          ? 'in_progress'
          : payload.solutionStatus === 'Terminado'
            ? 'solved'
            : 'observed',
      )
    }

    return jsonResponse({ success: true })
  }

  const requiredFields = [
    'applicantName',
    'applicantId',
    'applicantEmail',
    'area',
    'location',
    'priority',
    'description',
    'encargadoId',
    'encargadoName',
  ]
  const missing = requiredFields.filter(
    (field) => !payload[field] || String(payload[field]).trim() === '',
  )
  if (missing.length) {
    return jsonResponse({
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
    })
  }

  const sheet = getTicketSheet()
  const headerRow = ensureHeaders(sheet, TICKET_HEADERS)
  const headerMap = buildHeaderMap(headerRow)
  const ticketId = generateTicketId()
  const tags = Array.isArray(payload.tags) ? payload.tags.join(', ') : ''
  const now = new Date()

  const attachmentLinks = []
  if (Array.isArray(payload.attachments)) {
    const attachmentsFolder = DriveApp.getFolderById(ATTACHMENTS_FOLDER_ID)
    payload.attachments.forEach((attachment) => {
      if (attachment && attachment.content && attachment.name) {
        try {
          const blob = Utilities.newBlob(
            Utilities.base64Decode(attachment.content),
            attachment.type || 'application/octet-stream',
            attachment.name,
          )
          const file = attachmentsFolder.createFile(blob)
          attachmentLinks.push(file.getUrl())
        } catch (error) {
          // ignore create errors and continue with other attachments
        }
      }
    })
  }

  sheet.appendRow([
    now,
    ticketId,
    payload.applicantName,
    payload.applicantId,
    payload.area,
    payload.location,
    payload.priority,
    payload.status || 'Pendiente',
    tags,
    payload.description,
    payload.selectedFloor || '',
    payload.selectedSalon || '',
    payload.encargadoId || '',
    payload.encargadoName || '',
    attachmentLinks.join(', '),
    '',
    '',
    '',
    '',
    payload.applicantEmail || '',
    payload.encargadoEmail || '',
    '',
  ])

  sendTicketThreadEmail(sheet, headerMap, ticketId, 'creation')

  const subject = buildTicketSubject({
    ticketId,
    description: payload.description,
  })
  const thread = findGmailThreadSimplified(subject, [
    payload.applicantEmail,
    payload.encargadoEmail,
  ])
  if (thread) {
    updateTicketById(sheet, headerMap, ticketId, {
      'Thread ID': thread.getId(),
    })
  }

  return jsonResponse({
    success: true,
    ticketId,
    attachmentUrls: attachmentLinks,
  })
}

function getTicketSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(TICKETS_SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(TICKETS_SHEET_NAME)
    sheet.appendRow(TICKET_HEADERS)
  }
  return sheet
}

function getUsersSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(USERS_SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET_NAME)
    sheet.appendRow(USER_HEADERS)
  }
  return sheet
}

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)

  const ticketSheet = ss.getSheetByName(TICKETS_SHEET_NAME)
    ? ss.getSheetByName(TICKETS_SHEET_NAME)
    : ss.insertSheet(TICKETS_SHEET_NAME)
  ensureHeaders(ticketSheet, TICKET_HEADERS)

  const usersSheet = ss.getSheetByName(USERS_SHEET_NAME)
    ? ss.getSheetByName(USERS_SHEET_NAME)
    : ss.insertSheet(USERS_SHEET_NAME)
  const userHeaders = ensureHeaders(usersSheet, USER_HEADERS)

  const headerMap = buildHeaderMap(userHeaders)
  const lastRow = usersSheet.getLastRow()
  const rows =
    lastRow > 1
      ? usersSheet
          .getRange(2, 1, lastRow - 1, usersSheet.getLastColumn())
          .getValues()
      : []
  const hasAdmin = rows.some((row) => {
    const role = String(getRowValue(row, headerMap, 'Rol') || '').toLowerCase()
    const email = String(
      getRowValue(row, headerMap, 'Correo') || '',
    ).toLowerCase()
    return role === 'admin' || email === DEFAULT_ADMIN.email.toLowerCase()
  })

  if (!hasAdmin) {
    usersSheet.appendRow([
      Utilities.getUuid(),
      DEFAULT_ADMIN.name,
      DEFAULT_ADMIN.email,
      DEFAULT_ADMIN.password,
      DEFAULT_ADMIN.role,
      DEFAULT_ADMIN.cargo,
      'SI',
      new Date(),
    ])
  }
}

function ensureHeaders(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(requiredHeaders)
    return requiredHeaders
  }

  const lastCol = Math.max(sheet.getLastColumn(), requiredHeaders.length)
  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
  let updated = false

  requiredHeaders.forEach((header) => {
    if (!headerRow.includes(header)) {
      headerRow.push(header)
      updated = true
    }
  })

  if (updated) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow])
  }

  return headerRow
}

function buildHeaderMap(headerRow) {
  const map = {}
  headerRow.forEach((header, index) => {
    if (header) {
      map[header] = index
    }
  })
  return map
}

function getRowValue(row, headerMap, headerName) {
  const index = headerMap[headerName]
  if (index === undefined) return ''
  return row[index] ?? ''
}

function updateTicketById(sheet, headerMap, ticketId, updates) {
  const idIndex = headerMap['ID de ticket']
  if (idIndex === undefined) return false

  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return false

  const idValues = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues()
  const rowIndex = idValues.findIndex((row) => row[0] === ticketId)
  if (rowIndex === -1) return false

  const rowNumber = rowIndex + 2
  Object.keys(updates).forEach((header) => {
    const colIndex = headerMap[header]
    if (colIndex !== undefined) {
      sheet.getRange(rowNumber, colIndex + 1).setValue(updates[header])
    }
  })

  return true
}

function updateUserById(sheet, headerMap, userId, updates) {
  const idIndex = headerMap['ID']
  if (idIndex === undefined) return false

  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return false

  const idValues = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues()
  const rowIndex = idValues.findIndex((row) => row[0] === userId)
  if (rowIndex === -1) return false

  const rowNumber = rowIndex + 2
  Object.keys(updates).forEach((header) => {
    const colIndex = headerMap[header]
    if (colIndex !== undefined) {
      sheet.getRange(rowNumber, colIndex + 1).setValue(updates[header])
    }
  })

  return true
}

function getTicketRowById(sheet, headerMap, ticketId) {
  const idIndex = headerMap['ID de ticket']
  if (idIndex === undefined) return null

  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return null

  const rows = sheet
    .getRange(2, 1, lastRow - 1, sheet.getLastColumn())
    .getValues()

  const rowIndex = rows.findIndex((row) => row[idIndex] === ticketId)
  if (rowIndex === -1) return null

  const row = rows[rowIndex]
  return {
    rowNumber: rowIndex + 2,
    ticketId: String(getRowValue(row, headerMap, 'ID de ticket') || '').trim(),
    createdAt: String(
      getRowValue(row, headerMap, 'Fecha de creación') || '',
    ).trim(),
    applicantName: String(
      getRowValue(row, headerMap, 'Nombre del solicitante') || '',
    ).trim(),
    applicantEmail: String(
      getRowValue(row, headerMap, 'Email solicitante') || '',
    ).trim(),
    encargadoName: String(
      getRowValue(row, headerMap, 'Nombre de encargado') || '',
    ).trim(),
    encargadoEmail: String(
      getRowValue(row, headerMap, 'Email encargado') || '',
    ).trim(),
    area: String(getRowValue(row, headerMap, 'Área') || '').trim(),
    location: String(getRowValue(row, headerMap, 'Ubicación') || '').trim(),
    priority: String(getRowValue(row, headerMap, 'Prioridad') || '').trim(),
    status: String(getRowValue(row, headerMap, 'Estado') || '').trim(),
    description: String(
      getRowValue(row, headerMap, 'Descripción') || '',
    ).trim(),
    solutionDescription: String(
      getRowValue(row, headerMap, 'Descripción de la solución') || '',
    ).trim(),
    solutionObservation: String(
      getRowValue(row, headerMap, 'Observaciones') || '',
    ).trim(),
    solutionStartAt: String(
      getRowValue(row, headerMap, 'Fecha inicio') || '',
    ).trim(),
    solutionEndAt: String(
      getRowValue(row, headerMap, 'Fecha entrega') || '',
    ).trim(),
    threadId: String(getRowValue(row, headerMap, 'Thread ID') || '').trim(),
  }
}

function formatTicketDate(value) {
  if (!value) return '—'
  if (value instanceof Date) {
    return value.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)

  return parsed.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCreationEmailHtml(ticketRow) {
  return `
    <div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:18px 20px;background:#4f1c9d;color:#fff;">
          <p style="margin:0;font-size:12px;opacity:.8;letter-spacing:.08em;text-transform:uppercase;">
            Sistema de Calidad
          </p>
          <h2 style="margin:6px 0 0;font-size:18px;">
            Nuevo Ticket #${ticketRow.ticketId}
          </h2>
        </div>
        <div style="padding:20px;">
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
            <span style="background:#eef2ff;color:#3730a3;padding:6px 10px;border-radius:999px;font-size:12px;">
              Estado: ${ticketRow.status || 'Pendiente'}
            </span>
            <span style="background:#fef2f2;color:#991b1b;padding:6px 10px;border-radius:999px;font-size:12px;">
              Prioridad: ${ticketRow.priority || '—'}
            </span>
          </div>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">
            ${escapeHtml(ticketRow.description || 'Sin descripción')}
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Fecha de creación</td>
              <td style="padding:8px 0;">${formatTicketDate(ticketRow.createdAt)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Solicitante</td>
              <td style="padding:8px 0;">${ticketRow.applicantName || '—'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Encargado</td>
              <td style="padding:8px 0;">${ticketRow.encargadoName || 'Sin asignar'}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280;">Área</td>
              <td style="padding:8px 0;">${ticketRow.area || '—'}</td>
            </tr>
          </table>
          <div style="margin-top:18px;font-size:12px;color:#6b7280;">
            Este correo es una notificación automática del sistema de tickets.
          </div>
        </div>
      </div>
    </div>
  `
}

function getInProgressEmailHtml(ticketRow) {
  return `
    <div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:18px 20px;background:#1d4ed8;color:#fff;">
          <p style="margin:0;font-size:12px;opacity:.85;letter-spacing:.08em;text-transform:uppercase;">
            Sistema de Calidad
          </p>
          <h2 style="margin:6px 0 0;font-size:18px;">
            Ticket en Progreso #${ticketRow.ticketId}
          </h2>
        </div>
        <div style="padding:20px;">
          <div style="margin-bottom:16px;">
            <span style="background:#dbeafe;color:#1e3a8a;padding:6px 10px;border-radius:999px;font-size:12px;">
              En Progreso
            </span>
          </div>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">
            El encargado ha iniciado el seguimiento del ticket y se encuentra trabajando en la atención de la solicitud.
          </p>
          <div style="padding:14px;background:#f0f9ff;border-left:4px solid #1d4ed8;margin-bottom:16px;">
            <p style="margin:0;font-size:12px;color:#1e40af;font-weight:700;text-transform:uppercase;">
              Encargado responsable
            </p>
            <p style="margin:4px 0 0;font-size:14px;color:#111827;font-weight:600;">
              ${ticketRow.encargadoName || 'Sin asignar'}
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Solicitante</td>
              <td style="padding:6px 0;">${ticketRow.applicantName || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Área</td>
              <td style="padding:6px 0;">${ticketRow.area || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Prioridad</td>
              <td style="padding:6px 0;">${ticketRow.priority || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Fecha inicio</td>
              <td style="padding:6px 0;">${formatTicketDate(ticketRow.solutionStartAt)}</td>
            </tr>
          </table>
          <div style="padding:14px;background:#f9fafb;border-radius:10px;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:700;">
              Descripción del problema
            </p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#111827;">
              ${escapeHtml(ticketRow.description || 'Sin descripción')}
            </p>
          </div>
          <div style="margin-top:18px;font-size:12px;color:#6b7280;">
            El ticket se encuentra actualmente en seguimiento activo por el equipo de soporte.
          </div>
        </div>
      </div>
    </div>
  `
}

function getSolvedEmailHtml(ticketRow) {
  return `
    <div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:18px 20px;background:#16a34a;color:#fff;">
          <p style="margin:0;font-size:12px;opacity:.85;letter-spacing:.08em;text-transform:uppercase;">
            Sistema de Calidad
          </p>
          <h2 style="margin:6px 0 0;font-size:18px;">
            Ticket Resuelto #${ticketRow.ticketId}
          </h2>
        </div>
        <div style="padding:20px;">
          <div style="margin-bottom:14px;">
            <span style="background:#dcfce7;color:#166534;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">
              ✅ Resuelto
            </span>
          </div>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">
            El ticket ha sido atendido y cerrado por el equipo responsable.
          </p>
          <div style="padding:14px;background:#f0fdf4;border-left:4px solid #16a34a;margin-bottom:16px;">
            <p style="margin:0;font-size:12px;color:#166534;font-weight:700;text-transform:uppercase;">
              Atendido por
            </p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">
              ${ticketRow.encargadoName || '—'}
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Solicitante</td>
              <td style="padding:6px 0;">${ticketRow.applicantName || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Área</td>
              <td style="padding:6px 0;">${ticketRow.area || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Prioridad</td>
              <td style="padding:6px 0;">${ticketRow.priority || '—'}</td>
            </tr>
          </table>
          <div style="padding:14px;background:#f9fafb;border-radius:10px;margin-bottom:14px;">
            <p style="margin:0 0 6px;font-size:12px;color:#6b7280;font-weight:700;">
              Problema reportado
            </p>
            <p style="margin:0;font-size:13px;line-height:1.5;color:#111827;">
              ${escapeHtml(ticketRow.description || 'Sin descripción')}
            </p>
          </div>
          ${
            ticketRow.solutionDescription
              ? `
            <div style="padding:14px;background:#ecfeff;border-left:4px solid #06b6d4;margin-bottom:14px;">
              <p style="margin:0 0 6px;font-size:12px;color:#0e7490;font-weight:700;">
                Solución aplicada
              </p>
              <p style="margin:0;font-size:13px;color:#111827;">
                ${escapeHtml(ticketRow.solutionDescription)}
              </p>
            </div>
          `
              : ''
          }
          ${
            ticketRow.solutionObservation
              ? `
            <div style="padding:14px;background:#fef3c7;border-left:4px solid #f59e0b;margin-bottom:14px;">
              <p style="margin:0 0 6px;font-size:12px;color:#92400e;font-weight:700;">
                Observación adicional
              </p>
              <p style="margin:0;font-size:13px;color:#111827;">
                ${escapeHtml(ticketRow.solutionObservation)}
              </p>
            </div>
          `
              : ''
          }
          <div style="padding:14px;background:#f1f5f9;border-radius:10px;">
            <p style="margin:0;font-size:13px;color:#334155;">
              ✔ El ticket ha sido cerrado correctamente. Si el problema persiste, puedes generar uno nuevo o solicitar re-apertura.
            </p>
          </div>
          <div style="margin-top:18px;font-size:12px;color:#6b7280;">
            Este es el cierre oficial del ticket dentro del sistema de calidad.
          </div>
        </div>
      </div>
    </div>
  `
}

function getObservedEmailHtml(ticketRow) {
  return `
    <div style="background:#f6f7fb;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:18px 20px;background:#f59e0b;color:#111827;">
          <p style="margin:0;font-size:12px;opacity:.85;letter-spacing:.08em;text-transform:uppercase;">
            Sistema de Calidad
          </p>
          <h2 style="margin:6px 0 0;font-size:18px;">
            Ticket Observado #${ticketRow.ticketId}
          </h2>
        </div>
        <div style="padding:20px;">
          <div style="margin-bottom:14px;">
            <span style="background:#fef3c7;color:#92400e;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;">
              ⚠️ Observado
            </span>
          </div>
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151;">
            El ticket ha sido observado por el equipo responsable y requiere información adicional o corrección para continuar su atención.
          </p>
          <div style="padding:14px;background:#fffbeb;border-left:4px solid #f59e0b;margin-bottom:16px;">
            <p style="margin:0 0 6px;font-size:12px;color:#b45309;font-weight:700;text-transform:uppercase;">
              Observación del encargado
            </p>
            <p style="margin:0;font-size:13px;color:#111827;">
              ${escapeHtml(ticketRow.solutionObservation || 'Sin observaciones registradas')}
            </p>
          </div>
          <div style="padding:14px;background:#fff7ed;border-left:4px solid #fb923c;margin-bottom:16px;">
            <p style="margin:0;font-size:12px;color:#c2410c;font-weight:700;text-transform:uppercase;">
              Encargado responsable
            </p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827;">
              ${ticketRow.encargadoName || '—'}
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Solicitante</td>
              <td style="padding:6px 0;">${ticketRow.applicantName || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Área</td>
              <td style="padding:6px 0;">${ticketRow.area || '—'}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;">Prioridad</td>
              <td style="padding:6px 0;">${ticketRow.priority || '—'}</td>
            </tr>
          </table>
          <div style="padding:14px;background:#fff7ed;border-radius:10px;">
            <p style="margin:0;font-size:13px;color:#7c2d12;font-weight:600;">
              Acción requerida:
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#111827;line-height:1.5;">
              Revisa la observación y realiza las correcciones o envía la información solicitada para que el ticket pueda continuar su atención.
            </p>
          </div>
          <div style="margin-top:18px;font-size:12px;color:#6b7280;">
            El ticket permanecerá en estado "Observado" hasta recibir respuesta.
          </div>
        </div>
      </div>
    </div>
  `
}

function getTicketDetailsPlain(ticketRow) {
  let text =
    `Ticket: ${ticketRow.ticketId}\n` +
    `Estado: ${ticketRow.status || 'Pendiente'}\n` +
    `Prioridad: ${ticketRow.priority || '—'}\n` +
    `Descripción del Problema: ${ticketRow.description || 'Sin descripción'}\n`

  if (ticketRow.solutionObservation) {
    text += `Observaciones: ${ticketRow.solutionObservation}\n`
  }

  return text
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildTicketSubject(ticketRow, extra = {}) {
  const description = String(
    ticketRow.description || extra.description || '',
  ).trim()
  const shortDescription =
    description.length > 60 ? `${description.slice(0, 57)}...` : description
  const parts = [`Ticket ${ticketRow.ticketId}`]
  if (shortDescription) parts.push(shortDescription)
  return parts.join(' | ')
}

function findGmailThreadBySubjectAndRecipient(subject, recipient) {
  const escapedSubject = String(subject).replace(/"/g, '\\"')
  const query = `subject:"${escapedSubject}" to:${recipient}`
  const threads = GmailApp.search(query, 0, 1)
  return threads && threads.length > 0 ? threads[0] : null
}

function findGmailThreadSimplified(subject, recipients) {
  const escapedSubject = String(subject).replace(/"/g, '\\"')
  const validRecipients = Array.isArray(recipients)
    ? recipients.map((email) => String(email || '').trim()).filter(Boolean)
    : []

  // Busca por subject y al menos un recipient
  for (const recipient of validRecipients) {
    const query = `subject:"${escapedSubject}" to:${recipient}`
    const threads = GmailApp.search(query, 0, 1)
    if (threads && threads.length > 0) {
      return threads[0]
    }
  }
  return null
}

function sendTicketThreadEmail(sheet, headerMap, ticketId, action) {
  const ticketRow = getTicketRowById(sheet, headerMap, ticketId)

  if (!ticketRow) return false

  const recipients = Array.from(
    new Set(
      [ticketRow.applicantEmail, ticketRow.encargadoEmail]
        .filter(Boolean)
        .map((email) => String(email).trim()),
    ),
  ).join(',')

  if (!recipients) return false

  let htmlBody = ''
  let subject = ''
  let plainBody = ''

  switch (action) {
    case 'creation':
      htmlBody = getCreationEmailHtml(ticketRow)
      subject = buildTicketSubject(ticketRow)
      plainBody = `Tu ticket ha sido creado correctamente. Descripción: ${ticketRow.description || 'Sin descripción'}`
      break
    case 'in_progress':
      htmlBody = getInProgressEmailHtml(ticketRow)
      subject = buildTicketSubject(ticketRow)
      plainBody = `El ticket ${ticketId} ha sido marcado como En progreso.`
      break
    case 'solved':
      htmlBody = getSolvedEmailHtml(ticketRow)
      subject = buildTicketSubject(ticketRow)
      plainBody = `El ticket ${ticketId} ha sido marcado como Terminado.`
      if (ticketRow.solutionDescription) {
        plainBody += ` Solución: ${ticketRow.solutionDescription}`
      }
      if (ticketRow.solutionObservation) {
        plainBody += ` Observación: ${ticketRow.solutionObservation}`
      }
      break
    case 'observed':
      htmlBody = getObservedEmailHtml(ticketRow)
      subject = buildTicketSubject(ticketRow)
      plainBody = `El ticket ${ticketId} ha sido marcado como Observado.`
      if (ticketRow.solutionObservation) {
        plainBody += ` Observación: ${ticketRow.solutionObservation}`
      }
      break
    default:
      return false
  }

  let thread = null
  const threadId = String(ticketRow.threadId || '').trim()
  if (threadId) {
    try {
      thread = GmailApp.getThreadById(threadId)
    } catch (error) {
      thread = null
    }
  }

  try {
    if (thread) {
      thread.replyAll(plainBody, { htmlBody })
    } else {
      GmailApp.sendEmail(recipients, subject, plainBody, { htmlBody })
    }
    return true
  } catch (error) {
    return false
  }
}

function hashPassword(value) {
  const raw = String(value || '')
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw,
    Utilities.Charset.UTF_8,
  )
  const bytes = digest.map((byte) => {
    const unsigned = (byte + 256) % 256
    return unsigned.toString(16).padStart(2, '0')
  })
  return bytes.join('')
}

function verifyPassword(plain, stored) {
  if (!stored) return false
  const normalizedStored = String(stored)
  if (isHashedPassword(normalizedStored)) {
    return hashPassword(plain) === normalizedStored
  }
  return String(plain) === normalizedStored
}

function isHashedPassword(value) {
  const candidate = String(value || '')
  return /^[a-f0-9]{64}$/i.test(candidate)
}

function splitTags(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toIsoString(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function generateTicketId() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `TCK-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}
