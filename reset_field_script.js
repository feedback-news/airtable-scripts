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

const fieldToReset = 'Synced time input'
const resetValue = null


const resetSyncStatus = async (tables, fieldToReset, resetValue) => {
    let tablesToReset = tables.map(table => base.getTable(table))
    let records = {}

    await Promise.all(tablesToReset.map(async (table) => {
        let query = await table.selectRecordsAsync()
        records[table.name] = []
        query.records.forEach((record, index) => {
            if (record.getCellValue(fieldToReset) !== null) {
                let updated = {id: record.id, fields: {[fieldToReset]: resetValue}}
                records[table.name].push(updated)
            }
        })
    }))



    await Promise.all(tablesToReset.map(async (table) => {
        let nb_rows_updated = 0
        console.log('Number of rows to update for table : ', table.name, ' - ', records[table.name].length)
        for (let i=0;i<records[table.name].length;i+=30) {
            await base.getTable(table.name).updateRecordsAsync(records[table.name].slice(i, i+30))
            nb_rows_updated  = nb_rows_updated + records[table.name].slice(i, i+30).length
        }
        console.log('Number of rows updated for table : ', table.name, ' - ', nb_rows_updated)
    }))

    return records
}


let choices = tables.concat(['All', 'Cancel'])

let tableChoice = input.buttonsAsync(
    'Which table do you want to reset?',
    choices
)

const res = await tableChoice

if (res == 'All') {
    console.log(await resetSyncStatus(tables, fieldToReset, resetValue))
} else if (res == 'Cancel') {
    console.log('Action cancelled')
} else {
    console.log(await resetSyncStatus([res], fieldToReset, resetValue))
}
