let query = await base.getTable("Variables").selectRecordsAsync({
    fields: ['Name', 'Value'],
})
const SF_API_URL = query.records.filter(record => record.name === 'FEEDBACK_API_URL')[0].getCellValue('Value')

const table = base.getTable("Items for review / reviewed");
let record = await input.recordAsync('Sync row to Feedback', table)
const data = {
    "Claim checked (or Headline if no main claim)": record.getCellValue('Claim checked (or Headline if no main claim)'),
    "airtableId": record.id,
    "lastModified": record.getCellValue('Last modified time')
}

let response = await fetch(`${SF_API_URL}/webhooks/claim`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json',
    },
})

console.log(await response.json())
console.log(response.status)

const current_time = new Date().toISOString()
if (response.status === 200 || response.status === 201) {
    await table.updateRecordAsync(record, {
        'Synced time input': current_time
    })
} else {
    await table.updateRecordAsync(record, {
        'Synced time input': 'Error'
    })
}
