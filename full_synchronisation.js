// Get the query backend
let backend_query = await base.getTable("Variables").selectRecordsAsync({
    fields: ['Name', 'Value'],
})
const SF_API_URL = backend_query.records.filter(record => record.name === 'FEEDBACK_API_URL')[0].getCellValue('Value')

// Tables
const tables = [
    'Items for review / reviewed',
    'Reviews / Fact-checks',
    'Appearances',
    'Reviewers',
    'Authors',
    'Outlets',
    'Social Media influent.',
    'Editors'
]

function return_record_data(table, record) {
    if (table == 'Items for review / reviewed') {
        return {
            "Claim checked (or Headline if no main claim)": record.getCellValue('Claim checked (or Headline if no main claim)'),
            "airtableId": record.id,
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Reviews / Fact-checks') {
        return {
            "Review editor(s)": record.getCellValue('Review editor(s)').map(editor => editor.id),
            "Items reviewed": record.getCellValue('Items reviewed').map(claim => claim.id),
            "Review url": record.getCellValue('Review url'),
            "Date of publication": record.getCellValue('Date of publication'),
            "Post type": record.getCellValue('Post type').name,
            "Review headline": record.getCellValue('Review headline'),
            "airtableId": record.id,
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Appearances') {
        if (record.getCellValue('Item reviewed') == null) {
            console.log('No Item reviews for appearance with id : ', record.id)
            return null
        }
        return {
            "airtableId": record.id,
            "url": record.getCellValue('url'),
            "Item reviewed": record.getCellValue('Item reviewed').map(claim => claim.id),
            "Authors": record.getCellValue('Authors')?.map(author => author.id),
            "Outlet": record.getCellValue('Outlet')?.map(outlet => outlet.id),
            "Verified by": record.getCellValue('Verified by')?.map(testifier => testifier.id),
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Reviewers') {
        return {
            "First name": record.getCellValue('First name'),
            "Last name": record.getCellValue('Last name'),
            "Email": record.getCellValue('Email'),
            "airtableId": record.id,
            "index": record.getCellValue('index'),
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Authors') {
        return {
            "Name": record.getCellValue('Name'),
            "airtableId": record.id,
            "index": record.getCellValue('index'),
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Outlets') {
        return {
            "Name": record.getCellValue('Name'),
            "airtableId": record.id,
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Social Media influent.') {
        return {
            "url": record.getCellValue('url'),
            "Name": record.getCellValue('Name'),
            "airtableId": record.id,
            "lastModified": record.getCellValue('Last modified time')
        }
    }
    else if (table == 'Editors') {
        return {
            "Name": record.getCellValue('Name'),
            "airtableId": record.id,
            "index": record.getCellValue('index'),
            "lastModified": record.getCellValue('Last modified time')
        }
    }
}

function return_table_url(table) {
    if (table == 'Items for review / reviewed') {
        return `${SF_API_URL}/webhooks/claim`
    }
    else if (table == 'Reviews / Fact-checks') {
        return `${SF_API_URL}/webhooks/verdict`
    }
    else if (table == 'Appearances') {
        return `${SF_API_URL}/webhooks/link`
    }
    else if (table == 'Reviewers') {
        return `${SF_API_URL}/webhooks/reviewer`
    }
    else if (table == 'Authors') {
        return `${SF_API_URL}/webhooks/author`
    }
    else if (table == 'Outlets') {
        return `${SF_API_URL}/webhooks/outlet`
    }
    else if (table == 'Social Media influent.') {
        return `${SF_API_URL}/webhooks/social`
    }
    else if (table == 'Editors') {
        return `${SF_API_URL}/webhooks/editor`
    }
}

const syncTable = async (table) => {
    let chosen_table = base.getTable(table)
    let query = await chosen_table.selectRecordsAsync()
    let notSyncQuery = query.records.filter(record => record.getCellValueAsString('Sync status') != "🟢 Synced")
    console.log("Number of rows to synchronize : ", notSyncQuery.length)
    let nb_rows_to_sync = 0
    let nb_rows_synced = 0
    let nb_rows_error = 0
    let nb_query_to_pass = 0

    console.log('Synchronised rows for : ', table)

    for (let i=0;i<notSyncQuery.length;i+=1) {
        let record = notSyncQuery[i]
        nb_rows_to_sync = nb_rows_to_sync + 1

        let data = return_record_data(table, record)
        if (data == null) {
            nb_query_to_pass -= 1
            continue
        }
        let url = return_table_url(table)
        let response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const current_time = new Date().toISOString()
        if (response.status === 200 || response.status === 201) {
            await chosen_table.updateRecordAsync(record, {
                'Synced time input': current_time
            })
            nb_rows_synced = nb_rows_synced + 1
        } else {
            await chosen_table.updateRecordAsync(record, {
                'Synced time input': 'Error'
            })
            nb_rows_error = nb_rows_error + 1
        }
    }

    console.log('Number of rows synchronized : ', nb_rows_synced)
    console.log('Number of errors : ', nb_rows_error)
    console.log('Number of rows to pass : ', nb_query_to_pass)

    return query
}


let choices = tables.concat(['Cancel'])

let tableChoice = input.buttonsAsync(
    'Which table do you want to sync?',
    choices
)

const res = await tableChoice

if (res == 'Cancel') {
    console.log('Action cancelled')
} else {
    console.log(await syncTable(res))
}
