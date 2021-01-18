let query = await base.getTable("Variables").selectRecordsAsync({
    fields: ['Name', 'Value'],
})
const SF_API_URL = query.records.filter(record => record.name === 'FEEDBACK_API_URL')[0].getCellValue('Value')

let table = base.getTable("Reviews / Fact-checks");
let record = await input.recordAsync('Sync row to Feedback', table)
const data = {
    "Review editor(s)": record.getCellValue('Review editor(s)').map(editor => editor.id),
    "Items reviewed": record.getCellValue('Items reviewed').map(claim => claim.id),
    "Review url": record.getCellValue('Review url'),
    "Date of publication": record.getCellValue('Date of publication'),
    "Post type": record.getCellValue('Post type').name,
    "Review headline": record.getCellValue('Review headline'),
    "airtableId": record.id,
    "lastModified": record.getCellValue('Last modified time')
}

let response = await fetch(`${SF_API_URL}/webhooks/verdict`, {
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
