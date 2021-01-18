let query = await base.getTable("Variables").selectRecordsAsync({
    fields: ['Name', 'Value'],
})
const SF_API_URL = query.records.filter(record => record.name === 'FEEDBACK_API_URL')[0].getCellValue('Value')

let table = base.getTable("Social Media influent.");
let record = await input.recordAsync('Sync row to Feedback', table)
const data = {
    "url": record.getCellValue('url'),
    "Name": record.getCellValue('Name'),
    "airtableId": record.id,
    "lastModified": record.getCellValue('Last modified time')
}

let response = await fetch(`${SF_API_URL}/webhooks/social`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json',
    },
})

console.log(await response.json())
console.log(response.status)

if (response.status === 200 || response.status === 201) {
    const current_time = new Date().toISOString()
    await table.updateRecordAsync(record, {
        'Synced time input': current_time
    })
} else {
    await table.updateRecordAsync(record, {
        'Synced time input': 'Error'
    })
}
