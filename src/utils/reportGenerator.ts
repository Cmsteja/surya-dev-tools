import { saveAs } from 'file-saver';
import { DiffResult, FieldChange } from '../types/diff';

/**
 * Downloads the diff result as a JSON file
 */
export function downloadJsonReport(result: DiffResult, filename = 'diff-report.json'): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, filename);
}

/**
 * Formats a value for HTML display
 */
function formatValue(value: unknown): string {
  if (value === undefined) return '<em>undefined</em>';
  if (value === null) return '<em>null</em>';
  if (typeof value === 'object') return `<code>${JSON.stringify(value)}</code>`;
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/**
 * Generates HTML for field changes
 */
function generateChangesHtml(changes: FieldChange[]): string {
  return changes
    .map((change) => {
      const typeClass =
        change.type === 'added'
          ? 'added'
          : change.type === 'removed'
            ? 'removed'
            : 'changed';
      const arrow = change.type === 'changed' ? '→' : '';
      const oldVal = change.type !== 'added' ? formatValue(change.oldValue) : '';
      const newVal = change.type !== 'removed' ? formatValue(change.newValue) : '';

      return `
        <div class="change ${typeClass}">
          <span class="path">${change.path}</span>:
          ${oldVal} ${arrow} ${newVal}
        </div>
      `;
    })
    .join('');
}

/**
 * Downloads the diff result as an HTML report
 */
export function downloadHtmlReport(result: DiffResult, filename = 'diff-report.html'): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JSON Diff Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; margin-bottom: 20px; }
    h2 { color: #555; margin: 20px 0 10px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    h3 { color: #666; margin: 15px 0 8px; }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 2em; font-weight: bold; }
    .stat-label { color: #666; font-size: 0.9em; }
    .stat.added .stat-value { color: #22c55e; }
    .stat.removed .stat-value { color: #ef4444; }
    .stat.modified .stat-value { color: #f59e0b; }
    .stat.unchanged .stat-value { color: #6b7280; }

    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .item {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .item-header {
      padding: 12px 15px;
      background: #f9fafb;
      font-weight: 500;
      border-bottom: 1px solid #e5e7eb;
    }
    .item-body { padding: 15px; }
    .item.added .item-header { background: #dcfce7; color: #166534; }
    .item.removed .item-header { background: #fee2e2; color: #991b1b; }
    .item.modified .item-header { background: #fef3c7; color: #92400e; }

    .change { padding: 8px 12px; margin: 5px 0; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    .change.added { background: #dcfce7; color: #166534; }
    .change.removed { background: #fee2e2; color: #991b1b; }
    .change.changed { background: #fef3c7; color: #92400e; }
    .path { font-weight: bold; }

    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
    pre { background: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 0.85em; }

    .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>JSON Diff Report</h1>
    <div class="meta">
      Match Key: <strong>${result.matchKey}</strong> |
      Generated: ${new Date().toLocaleString()}
    </div>

    <div class="summary">
      <div class="stat">
        <div class="stat-value">${result.summary.totalSource}</div>
        <div class="stat-label">Source Items</div>
      </div>
      <div class="stat">
        <div class="stat-value">${result.summary.totalTarget}</div>
        <div class="stat-label">Target Items</div>
      </div>
      <div class="stat added">
        <div class="stat-value">${result.summary.added}</div>
        <div class="stat-label">Added</div>
      </div>
      <div class="stat removed">
        <div class="stat-value">${result.summary.removed}</div>
        <div class="stat-label">Removed</div>
      </div>
      <div class="stat modified">
        <div class="stat-value">${result.summary.modified}</div>
        <div class="stat-label">Modified</div>
      </div>
      <div class="stat unchanged">
        <div class="stat-value">${result.summary.unchanged}</div>
        <div class="stat-label">Unchanged</div>
      </div>
    </div>

    ${
      result.added.length > 0
        ? `
    <div class="section">
      <h2>Added Items (${result.added.length})</h2>
      ${result.added
        .map(
          (item) => `
        <div class="item added">
          <div class="item-header">${result.matchKey}: ${item[result.matchKey]}</div>
          <div class="item-body"><pre>${JSON.stringify(item, null, 2)}</pre></div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    ${
      result.removed.length > 0
        ? `
    <div class="section">
      <h2>Removed Items (${result.removed.length})</h2>
      ${result.removed
        .map(
          (item) => `
        <div class="item removed">
          <div class="item-header">${result.matchKey}: ${item[result.matchKey]}</div>
          <div class="item-body"><pre>${JSON.stringify(item, null, 2)}</pre></div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    ${
      result.modified.length > 0
        ? `
    <div class="section">
      <h2>Modified Items (${result.modified.length})</h2>
      ${result.modified
        .map(
          (item) => `
        <div class="item modified">
          <div class="item-header">${result.matchKey}: ${item.keyValue} (${item.changes.length} change${item.changes.length !== 1 ? 's' : ''})</div>
          <div class="item-body">
            ${generateChangesHtml(item.changes)}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, filename);
}
