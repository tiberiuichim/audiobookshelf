/**
 * @typedef MigrationContext
 * @property {import('sequelize').QueryInterface} queryInterface - a sequelize QueryInterface object.
 * @property {import('../Logger')} logger - a Logger object.
 *
 * @typedef MigrationOptions
 * @property {MigrationContext} context - an object containing the migration context.
 */

const migrationVersion = '2.32.7'
const migrationName = `${migrationVersion}-add-cover-dimensions`
const loggerPrefix = `[${migrationVersion} migration]`

/**
 * Adds coverWidth and coverHeight columns to books and podcasts tables.
 * 
 * @param {MigrationOptions} options
 */
async function up({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} UPGRADE BEGIN: ${migrationName}`)

  const bookTable = await queryInterface.describeTable('books')
  if (!bookTable['coverWidth']) {
    await queryInterface.addColumn('books', 'coverWidth', {
      type: queryInterface.sequelize.Sequelize.INTEGER
    })
    await queryInterface.addColumn('books', 'coverHeight', {
      type: queryInterface.sequelize.Sequelize.INTEGER
    })
    logger.info(`${loggerPrefix} added cover dimensions columns to table "books"`)
  }

  const podcastTable = await queryInterface.describeTable('podcasts')
  if (!podcastTable['coverWidth']) {
    await queryInterface.addColumn('podcasts', 'coverWidth', {
      type: queryInterface.sequelize.Sequelize.INTEGER
    })
    await queryInterface.addColumn('podcasts', 'coverHeight', {
      type: queryInterface.sequelize.Sequelize.INTEGER
    })
    logger.info(`${loggerPrefix} added cover dimensions columns to table "podcasts"`)
  }

  // Populate dimensions for existing items
  const { getImageDimensions } = require('../utils/ffmpegHelpers')
  
  const books = await queryInterface.sequelize.query('SELECT id, coverPath FROM books WHERE coverPath IS NOT NULL', {
    type: queryInterface.sequelize.QueryTypes.SELECT
  })
  logger.info(`${loggerPrefix} Populating cover dimensions for ${books.length} books...`)
  for (const book of books) {
    const dims = await getImageDimensions(book.coverPath)
    if (dims) {
      await queryInterface.sequelize.query('UPDATE books SET coverWidth = ?, coverHeight = ? WHERE id = ?', {
        replacements: [dims.width, dims.height, book.id],
        type: queryInterface.sequelize.QueryTypes.UPDATE
      })
    }
  }

  const podcasts = await queryInterface.sequelize.query('SELECT id, coverPath FROM podcasts WHERE coverPath IS NOT NULL', {
    type: queryInterface.sequelize.QueryTypes.SELECT
  })
  logger.info(`${loggerPrefix} Populating cover dimensions for ${podcasts.length} podcasts...`)
  for (const podcast of podcasts) {
    const dims = await getImageDimensions(podcast.coverPath)
    if (dims) {
      await queryInterface.sequelize.query('UPDATE podcasts SET coverWidth = ?, coverHeight = ? WHERE id = ?', {
        replacements: [dims.width, dims.height, podcast.id],
        type: queryInterface.sequelize.QueryTypes.UPDATE
      })
    }
  }

  logger.info(`${loggerPrefix} UPGRADE END: ${migrationName}`)
}

async function down({ context: { queryInterface, logger } }) {
  logger.info(`${loggerPrefix} DOWNGRADE BEGIN: ${migrationName}`)

  await queryInterface.removeColumn('books', 'coverWidth')
  await queryInterface.removeColumn('books', 'coverHeight')
  await queryInterface.removeColumn('podcasts', 'coverWidth')
  await queryInterface.removeColumn('podcasts', 'coverHeight')

  logger.info(`${loggerPrefix} DOWNGRADE END: ${migrationName}`)
}

module.exports = { up, down }
