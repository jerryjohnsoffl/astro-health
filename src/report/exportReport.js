import { conditions } from '../data/conditions.js'
import { measurements } from '../data/measurements.js'
import { getVitalsSnapshot } from '../overview/vitalsSnapshot.js'

const CSV_HEADERS = ['Section', 'Item', 'Value', 'Unit', 'Recorded at', 'Notes']

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
  if (/^[\s]*[=+\-@]/.test(text)) {
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

function toPdfText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '?')
}

function escapePdfText(value) {
  return toPdfText(value).replace(/[\\()]/g, '\\$&')
}

function wrapPdfLine(value, maxLength = 90) {
  const words = toPdfText(value)
    .split(/\s+/)
    .flatMap((word) => {
      if (word.length <= maxLength) return [word]
      const chunks = []
      for (let index = 0; index < word.length; index += maxLength) {
        chunks.push(word.slice(index, index + maxLength))
      }
      return chunks
    })
  const lines = []
  let line = ''
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function pdfTextWidth(value, fontSize) {
  const narrowCharacters = new Set(" ilI.,:;'!|")
  return [...toPdfText(value)].reduce((width, character) => {
    let characterWidth = 0.556
    if (character === ' ') characterWidth = 0.278
    else if (character === 'M') characterWidth = 0.833
    else if (character === 'W') characterWidth = 0.944
    else if (character === 'm') characterWidth = 0.833
    else if (character === 'w') characterWidth = 0.722
    else if (narrowCharacters.has(character)) characterWidth = 0.25
    else if (/[A-Z]/.test(character)) characterWidth = 0.667
    else if (/[a-z]/.test(character)) characterWidth = 0.52
    return width + characterWidth * fontSize
  }, 0)
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

export function createPdfReport(rows) {
  const generatedAt = getReportValue(rows, 'Report', 'Generated at', new Date().toISOString())
  const { date, time } = formatPdfTimestamp(generatedAt)
  const name = getReportValue(rows, 'Crew profile', 'Display name', 'Not set')
  const crewId = getReportValue(rows, 'Crew profile', 'Crew ID', 'Not set')
  const environment = getReportValue(rows, 'Mission context', 'Environment', 'Not set')
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

  function addRule(y, color = '0.82 0.87 0.9 RG') {
    pageCommands.push(`${color} 0.6 w 50 ${y.toFixed(2)} m 562 ${y.toFixed(2)} l S`)
  }

  function addPageHeader() {
    pageCommands = []
    pages.push(pageCommands)
    // Title — left side
    addText('MEDICAL HEALTH REPORT', 50, 750, 'F2', 17, '0.05 0.25 0.4 rg')
    // Right-align name & crew ID; keep them well above the left-side date block
    const nameText = `Name: ${name}`
    const crewIdText = `Crew ID: ${crewId}`
    addText(nameText, 562 - pdfTextWidth(nameText, 10), 750, 'F1', 10)
    addText(crewIdText, 562 - pdfTextWidth(crewIdText, 10), 736, 'F1', 10)
    // Left-side date / time block — moved down so it doesn't crowd the title
    addText(`Date: ${date}`, 50, 718, 'F1', 10)
    addText(`Time: ${time}`, 50, 704, 'F1', 10)
    addText(`Mission: ${environment} | Units: ${units}`, 50, 688, 'F1', 9, '0.3 g')
    addText('Decision-support information only; not a medical diagnosis.', 50, 674, 'F1', 8, '0.35 g')
    addRule(662)
    cursorY = 644
  }

  function addSectionHeading(title) {
    // Extra top-of-section breathing room
    cursorY -= 6
    addText(title.toUpperCase(), 50, cursorY, 'F2', 10, '0.05 0.25 0.4 rg')
    cursorY -= 12
    addRule(cursorY, '0.88 0.91 0.93 RG')
    cursorY -= 16
  }

  function startPageWithSection(title) {
    addPageHeader()
    addSectionHeading(title)
  }

  addPageHeader()
  if (sections.length === 0) {
    addText('No health entries are available.', 50, cursorY, 'F1', 10)
  }

  for (const section of sections) {
    // Raise page-break threshold so a full section heading + at least one row always fits
    if (cursorY < 150) addPageHeader()
    addSectionHeading(section.title)

    for (const row of section.rows) {
      // Narrower label column (36) + narrower value column (40) keeps a clear centre gutter
      const labelLines = wrapPdfLine(row.item, 36)
      const value = [row.value, row.unit].filter((part) => part !== '').join(' ') || 'Not recorded'
      const valueLines = wrapPdfLine(value, 40)
      const details = [
        row.recordedAt ? `Recorded: ${row.recordedAt}` : '',
        row.notes,
      ].filter(Boolean).join(' | ')
      const detailLines = details ? wrapPdfLine(details, 100) : []
      const lineCount = Math.max(labelLines.length, valueLines.length)
      const LINE_H = 14   // slightly more generous line height (was 13)
      const textHeight = lineCount * LINE_H
      // 4 px gap + detail lines (11 px each) + 14 px bottom padding
      const rowHeight = textHeight + (detailLines.length ? detailLines.length * 11 + 4 : 0) + 14

      if (cursorY - rowHeight < 70) {
        startPageWithSection(section.title)
      }

      for (let index = 0; index < lineCount; index += 1) {
        const lineY = cursorY - index * LINE_H
        if (labelLines[index]) addText(labelLines[index], 50, lineY, 'F1', 9)
        if (valueLines[index]) {
          const valueX = 562 - pdfTextWidth(valueLines[index], 9)
          addText(valueLines[index], valueX, lineY, 'F1', 9)
        }
      }

      // Detail lines start directly after main text rows (no extra leading gap)
      let detailY = cursorY - textHeight - 2
      for (const detailLine of detailLines) {
        addText(detailLine, 50, detailY, 'F1', 7, '0.35 g')
        detailY -= 11
      }
      cursorY -= rowHeight
      // Separator sits 6 px above next row's start, well clear of text above and below
      addRule(cursorY + 6)
    }
  }

  pages.forEach((commands, pageIndex) => {
    const pageText = `Page ${pageIndex + 1} of ${pages.length}`
    // Right-align the page number so it never overflows on large reports
    const pageNumX = (562 - pdfTextWidth(pageText, 8)).toFixed(2)
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
  const blob = new Blob([content], {
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
