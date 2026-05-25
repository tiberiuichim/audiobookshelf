/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a sequelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.35.1'
const migrationName = `${migrationVersion}-add-has-duplicate-media-column`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * Adds hasDuplicateMedia column to libraryItems table.
 * 
 * @param {MigrationOptions} options
 */
async function up({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  const tableDescription = await queryInterface.describeTable('libraryItems')
  if (!tableDescription['hasDuplicateMedia']) {
    await queryInterface.addColumn('libraryItems', 'hasDuplicateMedia', {
      type: queryInterface.sequelize.Sequelize.BOOLEAN,
      defaultValue: false
    })
    logger.info(`${loggerPrefix} added column "hasDuplicateMedia" to table "libraryItems"`)
  } else {
    logger.info(`${loggerPrefix} column "hasDuplicateMedia" already exists in table "libraryItems"`)
  }

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

async function down({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  await queryInterface.removeColumn('libraryItems', 'hasDuplicateMedia')
  logger.info(`${loggerPrefix} removed column "hasDuplicateMedia" from table "libraryItems"`)

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
