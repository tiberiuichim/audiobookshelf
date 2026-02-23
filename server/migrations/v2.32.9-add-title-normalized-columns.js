const util = require('util')
const { getNormalizedTitle } = require('../utils')

/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a suquelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.32.9'
const migrationName = `${migrationVersion}-add-title-normalized-columns`
const loggerPrefix = `[${migrationVersion} migration]`

async function up({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  // 1. Add columns
  await addColumn(queryInterface, logger, 'libraryItems', 'titleNormalized', { type: queryInterface.sequelize.Sequelize.STRING, allowNull: true })
  await addColumn(queryInterface, logger, 'books', 'titleNormalized', { type: queryInterface.sequelize.Sequelize.STRING, allowNull: true })
  await addColumn(queryInterface, logger, 'podcasts', 'titleNormalized', { type: queryInterface.sequelize.Sequelize.STRING, allowNull: true })

  // 2. Backfill data for books synchronously
  logger.info(`${loggerPrefix} Backfilling titleNormalized for books`)
  const books = await queryInterface.sequelize.query('SELECT id, title FROM books', { type: queryInterface.sequelize.QueryTypes.SELECT })
  for (const book of books) {
    if (book.title) {
      const titleNormalized = getNormalizedTitle(book.title)
      await queryInterface.sequelize.query('UPDATE books SET titleNormalized = :titleNormalized WHERE id = :id', {
        replacements: { titleNormalized, id: book.id }
      })
    }
  }

  // Backfill data for podcasts
  logger.info(`${loggerPrefix} Backfilling titleNormalized for podcasts`)
  const podcasts = await queryInterface.sequelize.query('SELECT id, title FROM podcasts', { type: queryInterface.sequelize.QueryTypes.SELECT })
  for (const podcast of podcasts) {
    if (podcast.title) {
      const titleNormalized = getNormalizedTitle(podcast.title)
      await queryInterface.sequelize.query('UPDATE podcasts SET titleNormalized = :titleNormalized WHERE id = :id', {
        replacements: { titleNormalized, id: podcast.id }
      })
    }
  }

  // 3. Copy from books/podcasts to libraryItems
  await copyColumn(queryInterface, logger, 'books', 'titleNormalized', 'id', 'libraryItems', 'titleNormalized', 'mediaId')
  await copyColumn(queryInterface, logger, 'podcasts', 'titleNormalized', 'id', 'libraryItems', 'titleNormalized', 'mediaId')

  // 4. Add triggers
  await addTrigger(queryInterface, logger, 'books', 'titleNormalized', 'id', 'libraryItems', 'titleNormalized', 'mediaId')
  await addTrigger(queryInterface, logger, 'podcasts', 'titleNormalized', 'id', 'libraryItems', 'titleNormalized', 'mediaId')

  // 5. Add index on libraryItems
  await addIndex(queryInterface, logger, 'libraryItems', ['libraryId', 'mediaType', { name: 'titleNormalized', collate: 'NOCASE' }])

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

async function down({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  await removeIndex(queryInterface, logger, 'libraryItems', ['libraryId', 'mediaType', 'titleNormalized'])
  
  await removeTrigger(queryInterface, logger, 'libraryItems', 'titleNormalized', 'books')
  await removeTrigger(queryInterface, logger, 'libraryItems', 'titleNormalized', 'podcasts')

  await removeColumn(queryInterface, logger, 'libraryItems', 'titleNormalized')
  await removeColumn(queryInterface, logger, 'books', 'titleNormalized')
  await removeColumn(queryInterface, logger, 'podcasts', 'titleNormalized')

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

async function addIndex(queryInterface, logger, tableName, columns) {
  const columnString = columns.map((column) => util.inspect(column)).join(', ')
  const indexName = convertToSnakeCase(`${tableName}_${columns.map((column) => (typeof column === 'string' ? column : column.name)).join('_')}`)
  try {
    logger.info(`${loggerPrefix} adding index on [${columnString}] to table ${tableName}. index name: ${indexName}"`)
    await queryInterface.addIndex(tableName, columns)
    logger.info(`${loggerPrefix} added index on [${columnString}] to table ${tableName}. index name: ${indexName}"`)
  } catch (error) {
    if (error.name === 'SequelizeDatabaseError' && error.message.includes('already exists')) {
      logger.info(`${loggerPrefix} index [${columnString}] for table "${tableName}" already exists`)
    } else {
      throw error
    }
  }
}

async function removeIndex(queryInterface, logger, tableName, columns) {
  logger.info(`${loggerPrefix} removing index [${columns.join(', ')}] from table "${tableName}"`)
  try {
    await queryInterface.removeIndex(tableName, columns)
    logger.info(`${loggerPrefix} removed index [${columns.join(', ')}] from table "${tableName}"`)
  } catch (error) {}
}

async function addColumn(queryInterface, logger, table, column, options) {
  logger.info(`${loggerPrefix} adding column "${column}" to table "${table}"`)
  const tableDescription = await queryInterface.describeTable(table)
  if (!tableDescription[column]) {
    await queryInterface.addColumn(table, column, options)
    logger.info(`${loggerPrefix} added column "${column}" to table "${table}"`)
  } else {
    logger.info(`${loggerPrefix} column "${column}" already exists in table "${table}"`)
  }
}

async function removeColumn(queryInterface, logger, table, column) {
  logger.info(`${loggerPrefix} removing column "${column}" from table "${table}"`)
  await queryInterface.removeColumn(table, column)
  logger.info(`${loggerPrefix} removed column "${column}" from table "${table}"`)
}

async function copyColumn(queryInterface, logger, sourceTable, sourceColumn, sourceIdColumn, targetTable, targetColumn, targetIdColumn) {
  logger.info(`${loggerPrefix} copying column "${sourceColumn}" from table "${sourceTable}" to table "${targetTable}"`)
  await queryInterface.sequelize.query(`
    UPDATE ${targetTable}
    SET ${targetColumn} = ${sourceTable}.${sourceColumn}
    FROM ${sourceTable}
    WHERE ${targetTable}.${targetIdColumn} = ${sourceTable}.${sourceIdColumn}
  `)
  logger.info(`${loggerPrefix} copied column "${sourceColumn}" from table "${sourceTable}" to table "${targetTable}"`)
}

async function addTrigger(queryInterface, logger, sourceTable, sourceColumn, sourceIdColumn, targetTable, targetColumn, targetIdColumn) {
  logger.info(`${loggerPrefix} adding trigger to update ${targetTable}.${targetColumn} when ${sourceTable}.${sourceColumn} is updated`)
  const triggerName = convertToSnakeCase(`update_${targetTable}_${targetColumn}_from_${sourceTable}`)

  await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${triggerName}`)

  await queryInterface.sequelize.query(`
    CREATE TRIGGER ${triggerName}
      AFTER UPDATE OF ${sourceColumn} ON ${sourceTable}
      FOR EACH ROW
      BEGIN
        UPDATE ${targetTable}
          SET ${targetColumn} = NEW.${sourceColumn}
        WHERE ${targetTable}.${targetIdColumn} = NEW.${sourceIdColumn};
      END;
  `)
  logger.info(`${loggerPrefix} added trigger.`)
}

async function removeTrigger(queryInterface, logger, targetTable, targetColumn, sourceTable) {
  logger.info(`${loggerPrefix} removing trigger`)
  const triggerName = convertToSnakeCase(`update_${targetTable}_${targetColumn}_from_${sourceTable}`)
  await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS ${triggerName}`)
}

function convertToSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

module.exports = { up, down }
