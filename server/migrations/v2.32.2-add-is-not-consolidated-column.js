/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a suquelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.32.2'
const migrationName = `${migrationVersion}-add-is-not-consolidated-column`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * Adds isNotConsolidated column to libraryItems table.
 * 
 * @param {MigrationOptions} options
 */
async function up({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  const tableDescription = await queryInterface.describeTable('libraryItems')
  if (!tableDescription['isNotConsolidated']) {
    await queryInterface.addColumn('libraryItems', 'isNotConsolidated', {
      type: queryInterface.sequelize.Sequelize.BOOLEAN,
      defaultValue: false
    })
    logger.info(`${loggerPrefix} added column "isNotConsolidated" to table "libraryItems"`)
  } else {
    logger.info(`${loggerPrefix} column "isNotConsolidated" already exists in table "libraryItems"`)
  }

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

async function down({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  await queryInterface.removeColumn('libraryItems', 'isNotConsolidated')
  logger.info(`${loggerPrefix} removed column "isNotConsolidated" from table "libraryItems"`)

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
