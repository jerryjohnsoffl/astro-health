import { conditions } from '../data/conditions.js'
import { environments } from '../data/environments.js'
import { measurements } from '../data/measurements.js'
import { getVitalsSnapshot } from '../overview/vitalsSnapshot.js'

const CSV_HEADERS = ['Section', 'Item', 'Value', 'Unit', 'Recorded at', 'Notes']
const REPORT_TITLE = 'AstroHealth crew health report'

function createRow(section, item, value, unit = '', recordedAt = '', notes = '') {
  return {
    section,
    item,
    value: value ?? '',
    unit,
    recordedAt: recordedAt ?? '',
    notes: notes ?? '',
  }
}

export function createHealthReport(healthState, settings, generatedAt = new Date().toISOString()) {
  const rows = [
    createRow('Report', 'Generated at', generatedAt),
    createRow('Crew profile', 'Display name', settings.crewProfile.displayName || 'Not set'),
    createRow('Crew profile', 'Crew ID', settings.crewProfile.crewId || 'Not set'),
    createRow('Mission context', 'Environment', settings.environment),
    createRow('Mission context', 'Units', settings.units),
    createRow('Triage', 'Current level', healthState.triage.level),
  ]

  for (const vital of getVitalsSnapshot(healthState)) {
    rows.push(
      createRow(
        'Vitals snapshot',
        vital.label,
        vital.value === undefined ? 'Not recorded' : vital.value,
        vital.value === undefined ? '' : vital.unit,
        vital.recordedAt,
        vital.source,
      ),
    )
  }

  const definitionsById = new Map(measurements.map((definition) => [definition.id, definition]))
  for (const result of Object.values(healthState.measurements)) {
    const definition = definitionsById.get(result.measurementId)
    rows.push(
      createRow(
        'Saved measurements',
        definition?.name ?? result.measurementId,
        result.value,
        definition?.unit,
        result.recordedAt,
        `Status: ${result.status}`,
      ),
    )
  }

  const conditionNames = new Map(conditions.map((condition) => [condition.id, condition.name]))
  for (const symptomId of healthState.symptomIds) {
    rows.push(createRow('Symptoms', conditionNames.get(symptomId) ?? symptomId, 'Selected'))
  }

  const wellbeing = healthState.wellbeingCheckIn
  if (wellbeing) {
    for (const [label, value, unit] of [
      ['Sleep duration', wellbeing.sleepHours, 'h'],
      ['Sleep quality', wellbeing.sleepQuality, 'of 5'],
      ['Awakenings', wellbeing.awakenings, ''],
      ['Rested rating', wellbeing.rested, 'of 5'],
    ]) {
      rows.push(createRow('Wellbeing check-in', label, value, unit, wellbeing.recordedAt, 'Self-reported'))
    }
  }

  const assessment = healthState.cdssAssessment
  if (assessment) {
    for (const [name, value] of Object.entries(assessment.input.context)) {
      const definition = definitionsById.get(name)
      rows.push(
        createRow(
          'Self-check input',
          definition?.name ?? name,
          value,
          definition?.unit,
          assessment.recordedAt,
        ),
      )
    }
    for (const [symptomId, severity] of Object.entries(assessment.input.symptoms)) {
      rows.push(
        createRow(
          'Self-check input',
          conditionNames.get(symptomId) ?? symptomId,
          severity,
          'severity (0-3)',
          assessment.recordedAt,
        ),
      )
    }
    for (const prediction of assessment.predictions ?? []) {
      rows.push(
        createRow(
          'Self-check model results',
          prediction.name,
          `${(prediction.probability * 100).toFixed(1)}%`,
          '',
          assessment.recordedAt,
          prediction.description,
        ),
      )
    }
  }

  for (const reason of healthState.triage.reasons) {
    rows.push(
      createRow(
        'Triage detail',
        reason.id,
        reason.level,
        '',
        '',
        `${reason.source} · ${reason.status}`,
      ),
    )
  }

  for (const [modelId, analysis] of Object.entries(healthState.sensorAnalyses ?? {})) {
    if (!analysis) continue
    rows.push(
      createRow(
        'Sensor analysis',
        `${modelId.toUpperCase()} file`,
        analysis.fileName,
        '',
        analysis.recordedAt,
        'Raw samples are not included.',
      ),
    )
    for (const prediction of analysis.predictions ?? []) {
      rows.push(
        createRow(
          'Sensor analysis',
          `${modelId.toUpperCase()} result: ${prediction.name}`,
          `${(prediction.probability * 100).toFixed(1)}%`,
          '',
          analysis.recordedAt,
          prediction.description,
        ),
      )
    }
  }

  for (const [regionId, status] of Object.entries(healthState.regionStatuses)) {
    rows.push(createRow('Health map', regionId, status))
  }

  return rows
}

function csvCell(value) {
  let text = String(value ?? '')
  // Neutralise spreadsheet formulas, but leave plain numbers such as -5 or +3.2 untouched.
  const isPlainNumber = /^[+-]?\d+(\.\d+)?$/.test(text.trim())
  if ((!isPlainNumber && /^[\s]*[=+\-@]/.test(text)) || /^[\t\r]/.test(text)) {
    text = `'${text}`
  }
  return `"${text.replaceAll('"', '""')}"`
}

export function createCsvReport(rows) {
  return [
    CSV_HEADERS.map(csvCell).join(','),
    ...rows.map((row) =>
      [row.section, row.item, row.value, row.unit, row.recordedAt, row.notes]
        .map(csvCell)
        .join(','),
    ),
  ].join('\r\n')
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

// Real Helvetica / Helvetica-Bold advance widths (units per 1000 em) for ASCII 32-126.
const HELVETICA_WIDTHS = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]
const HELVETICA_BOLD_WIDTHS = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584]

const PAGE = { left: 50, right: 562, top: 750, bottomText: 55 }
const LINE_H = 13 // distance between wrapped 9 pt lines
const DETAIL_FIRST = 11 // first detail line sits this far below the last text line
const DETAIL_H = 10
const RULE_BELOW = 8 // last baseline -> separator rule
const RULE_ABOVE = 7 // separator rule -> top of next row's capitals
const CAP_HEIGHT = 6.5 // 9 pt Helvetica capital height

const EXPERIMENTAL_SECTIONS = new Set(['Sensor analysis', 'Self-check model results'])
const environmentNames = new Map(environments.map((environment) => [environment.id, environment.name]))

function toPdfText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '?')
}

function escapePdfText(value) {
  return toPdfText(value).replace(/[\\()]/g, '\\$&')
}

function pdfTextWidth(value, fontSize, bold = false) {
  const table = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS
  let units = 0
  for (const character of toPdfText(value)) {
    units += table[character.charCodeAt(0) - 32] ?? 556
  }
  return (units * fontSize) / 1000
}

function splitLongWord(word, fontSize, maxWidth) {
  const chunks = []
  let chunk = ''
  for (const character of word) {
    if (chunk && pdfTextWidth(chunk + character, fontSize) > maxWidth) {
      chunks.push(chunk)
      chunk = character
    } else {
      chunk += character
    }
  }
  if (chunk) chunks.push(chunk)
  return chunks
}

function wrapPdfLine(value, fontSize, maxWidth) {
  const words = toPdfText(value)
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => (pdfTextWidth(word, fontSize) <= maxWidth ? [word] : splitLongWord(word, fontSize, maxWidth)))
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && pdfTextWidth(`${line} ${word}`, fontSize) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function fitText(value, fontSize, maxWidth, bold = false) {
  let text = toPdfText(value)
  if (pdfTextWidth(text, fontSize, bold) <= maxWidth) return text
  while (text.length > 1 && pdfTextWidth(`${text}...`, fontSize, bold) > maxWidth) {
    text = text.slice(0, -1)
  }
  return `${text}...`
}

function getReportValue(rows, section, item, fallback = '') {
  return rows.find((row) => row.section === section && row.item === item)?.value || fallback
}

function formatPdfTimestamp(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    return { date: String(value || 'Not available'), time: 'Not available' }
  }
  return {
    date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  }
}

function formatRecordedAt(value) {
  const date = new Date(value)
  if (!value || !Number.isFinite(date.getTime())) return String(value ?? '')
  const { date: day, time } = formatPdfTimestamp(date)
  return `${day}, ${time}`
}

function describeRow(row) {
  let label = row.item
  let notes = row.notes
  const sensorResult = /^(.+ result): (.+)$/.exec(row.item)
  if (row.section === 'Sensor analysis' && sensorResult && row.notes) {
    label = `${sensorResult[1]}: ${row.notes} (${sensorResult[2]})`
    notes = ''
  }
  let value = [row.value, row.unit].filter((part) => part !== '').join(' ') || 'Not recorded'
  if (row.section === 'Triage' && row.item === 'Current level' && row.value === 'unknown') {
    value = 'Not assessed'
  }
  return { label, notes, value }
}

export function createPdfReport(rows) {
  const generatedAt = getReportValue(rows, 'Report', 'Generated at', new Date().toISOString())
  const { date, time } = formatPdfTimestamp(generatedAt)
  const name = getReportValue(rows, 'Crew profile', 'Display name', 'Not set')
  const crewId = getReportValue(rows, 'Crew profile', 'Crew ID', 'Not set')
  const environmentId = getReportValue(rows, 'Mission context', 'Environment', 'Not set')
  const environment = environmentNames.get(environmentId) ?? environmentId
  const units = getReportValue(rows, 'Mission context', 'Units', 'Not set')
  const bodyRows = rows.filter(
    (row) => row.section !== 'Report' && row.section !== 'Crew profile' && row.section !== 'Mission context',
  )
  const sections = []
  for (const row of bodyRows) {
    const section = sections.at(-1)
    if (!section || section.title !== row.section) {
      sections.push({ title: row.section, rows: [row] })
    } else {
      section.rows.push(row)
    }
  }

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  const pageObjectIds = []
  const pages = []
  let pageCommands
  let cursorY

  function addText(text, x, y, font = 'F1', size = 10, color = '0 g') {
    pageCommands.push(
      `${color}\nBT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`,
    )
  }

  function addRightText(text, y, font = 'F1', size = 10, color = '0 g') {
    addText(text, PAGE.right - pdfTextWidth(text, size, font === 'F2'), y, font, size, color)
  }

  function addRule(y, color = '0.82 0.87 0.9 RG') {
    pageCommands.push(`${color} 0.6 w ${PAGE.left} ${y.toFixed(2)} m ${PAGE.right} ${y.toFixed(2)} l S`)
  }

  function addPageHeader() {
    pageCommands = []
    pages.push(pageCommands)
    addText(REPORT_TITLE, PAGE.left, PAGE.top, 'F2', 16, '0.05 0.25 0.4 rg')
    addRightText(fitText(`Name: ${name}`, 10, 200), 750)
    addRightText(fitText(`Crew ID: ${crewId}`, 10, 200), 736)
    addText(`Date: ${date}`, PAGE.left, 718, 'F1', 10)
    addText(`Time: ${time}`, PAGE.left, 704, 'F1', 10)
    addText(fitText(`Mission: ${environment} | Units: ${units}`, 9, 512), PAGE.left, 688, 'F1', 9, '0.3 g')
    addText('Decision-support information only; not a medical diagnosis.', PAGE.left, 674, 'F1', 8, '0.35 g')
    addRule(662)
    cursorY = 644
  }

  function addSectionHeading(title, continued = false) {
    cursorY -= 4
    addText(`${title}${continued ? ' (continued)' : ''}`.toUpperCase(), PAGE.left, cursorY, 'F2', 10, '0.05 0.25 0.4 rg')
    cursorY -= 10
    addRule(cursorY, '0.88 0.91 0.93 RG')
    cursorY -= 8
    if (EXPERIMENTAL_SECTIONS.has(title)) {
      addText('Experimental model output for review; not a diagnosis.', PAGE.left, cursorY, 'F1', 7, '0.35 g')
      cursorY -= 6
    }
    cursorY -= RULE_ABOVE + CAP_HEIGHT - 0.5
  }

  addPageHeader()
  if (sections.length === 0) {
    addText('No health entries are available.', PAGE.left, cursorY, 'F1', 10)
  }

  for (const section of sections) {
    if (cursorY < 150) addPageHeader()
    addSectionHeading(section.title)

    for (const row of section.rows) {
      const { label, notes, value } = describeRow(row)
      const labelLines = wrapPdfLine(label, 9, 270)
      const valueLines = wrapPdfLine(value, 9, 220)
      const details = [row.recordedAt ? `Recorded: ${formatRecordedAt(row.recordedAt)}` : '', notes]
        .filter(Boolean)
        .join(' | ')
      const detailLines = details ? wrapPdfLine(details, 7, 512) : []
      const lineCount = Math.max(labelLines.length, valueLines.length)
      const lastTextOffset = (lineCount - 1) * LINE_H
      const lastBaselineOffset = detailLines.length
        ? lastTextOffset + DETAIL_FIRST + (detailLines.length - 1) * DETAIL_H
        : lastTextOffset
      const rowHeight = lastBaselineOffset + RULE_BELOW + RULE_ABOVE + CAP_HEIGHT

      if (cursorY - lastBaselineOffset - RULE_BELOW < PAGE.bottomText) {
        addPageHeader()
        addSectionHeading(section.title, true)
      }

      for (let index = 0; index < lineCount; index += 1) {
        const lineY = cursorY - index * LINE_H
        if (labelLines[index]) addText(labelLines[index], PAGE.left, lineY, 'F1', 9)
        if (valueLines[index]) addRightText(valueLines[index], lineY, 'F1', 9)
      }
      let detailY = cursorY - lastTextOffset - DETAIL_FIRST
      for (const detailLine of detailLines) {
        addText(detailLine, PAGE.left, detailY, 'F1', 7, '0.35 g')
        detailY -= DETAIL_H
      }

      // Separator sits RULE_BELOW under this row's last baseline and RULE_ABOVE over the next row.
      addRule(cursorY - lastBaselineOffset - RULE_BELOW)
      cursorY -= rowHeight
    }
  }

  pages.forEach((commands, pageIndex) => {
    const pageText = `Page ${pageIndex + 1} of ${pages.length}`
    const pageNumX = (PAGE.right - pdfTextWidth(pageText, 8)).toFixed(2)
    commands.push(
      '0.45 g\nBT /F1 8 Tf 50 35 Td (Health information for review only) Tj ET',
      `0.45 g\nBT /F1 8 Tf ${pageNumX} 35 Td (${escapePdfText(pageText)}) Tj ET`,
    )
  })

  pages.forEach((page) => {
    const pageObjectId = objects.length + 1
    const contentObjectId = pageObjectId + 1
    pageObjectIds.push(`${pageObjectId} 0 R`)
    const commands = page.join('\n')
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`,
    )
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.join(' ')}] /Count ${pageObjectIds.length} >>`
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export function downloadReport(rows, format, date = new Date()) {
  if (format !== 'csv' && format !== 'pdf') {
    throw new TypeError('Report format must be "csv" or "pdf".')
  }

  const content = format === 'csv' ? createCsvReport(rows) : createPdfReport(rows)
  // A UTF-8 byte-order mark lets Excel read accented characters in the CSV correctly.
  const blob = new Blob(format === 'csv' ? ['\uFEFF', content] : [content], {
    type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/pdf',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `astrohealth-report-${date.toISOString().slice(0, 10)}.${format}`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}