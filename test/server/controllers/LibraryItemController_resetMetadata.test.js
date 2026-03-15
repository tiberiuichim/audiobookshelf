const { expect } = require('chai')
const { Sequelize } = require('sequelize')
const sinon = require('sinon')
const fs = require('../../../server/libs/fsExtra')

const Database = require('../../../server/Database')
const LibraryItemController = require('../../../server/controllers/LibraryItemController')
const LibraryItemScanner = require('../../../server/scanner/LibraryItemScanner')
const Logger = require('../../../server/Logger')

describe('LibraryItemController_resetMetadata', () => {
  let apiRouter = {
    auth: {
      checkAdmin: () => true
    }
  }

  beforeEach(async () => {
    global.ServerSettings = {
      MetadataPath: '/tmp/abs-metadata'
    }
    Database.sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    Database.sequelize.uppercaseFirst = (str) => (str ? `${str[0].toUpperCase()}${str.substr(1)}` : '')
    
    // Mocking triggers because in-memory sqlite doesn't support them if not defined in buildModels
    // Actually buildModels might not define them if they are not in the code.
    // Looking at Database.js, triggers are added during start() which we are not calling.
    
    await Database.buildModels()

    sinon.stub(Logger, 'info')
    sinon.stub(Logger, 'error')
    sinon.stub(LibraryItemScanner, 'scanLibraryItem').resolves({})
    sinon.stub(fs, 'pathExists').resolves(false)
    sinon.stub(fs, 'remove').resolves()
  })

  afterEach(async () => {
    sinon.restore()
    await Database.sequelize.sync({ force: true })
  })

  it('should clear all metadata fields and associations on resetMetadata', async () => {
    const newLibrary = await Database.libraryModel.create({ name: 'Test Library', mediaType: 'book' })
    const newLibraryFolder = await Database.libraryFolderModel.create({ path: '/test', libraryId: newLibrary.id })

    const newBook = await Database.bookModel.create({
      title: 'Wrong Title',
      subtitle: 'Wrong Subtitle',
      description: 'Wrong Description',
      publisher: 'Wrong Publisher',
      publishedYear: '2020',
      isbn: '123456',
      asin: 'B00000',
      language: 'en',
      explicit: true,
      genres: ['Genre1'],
      tags: ['Tag1'],
      narrators: ['Narrator1'],
      coverPath: '/some/path/cover.jpg',
      audioFiles: [],
      chapters: []
    })

    const newLibraryItem = await Database.libraryItemModel.create({
      mediaId: newBook.id,
      mediaType: 'book',
      libraryId: newLibrary.id,
      libraryFolderId: newLibraryFolder.id,
      path: '/test/item',
      relPath: 'item',
      libraryFiles: []
    })

    const author = await Database.authorModel.create({ name: 'Author 1', libraryId: newLibrary.id })
    await Database.bookAuthorModel.create({ bookId: newBook.id, authorId: author.id })

    const series = await Database.seriesModel.create({ name: 'Series 1', libraryId: newLibrary.id })
    await Database.bookSeriesModel.create({ bookId: newBook.id, seriesId: series.id })

    // Reload expanded
    const libraryItem = await Database.libraryItemModel.getExpandedById(newLibraryItem.id)
    
    expect(libraryItem.media.genres).to.have.lengthOf(1)
    expect(libraryItem.media.authors).to.have.lengthOf(1)
    expect(libraryItem.media.series).to.have.lengthOf(1)

    const fakeReq = {
      libraryItem,
      user: { username: 'admin', canUpdate: true },
      body: {}
    }
    const fakeRes = {
      json: sinon.spy(),
      sendStatus: sinon.spy()
    }

    await LibraryItemController.resetMetadata.bind(apiRouter)(fakeReq, fakeRes)

    // Verify scan was called
    expect(LibraryItemScanner.scanLibraryItem.calledOnce).to.be.true

    // Reload book from DB
    const updatedBook = await Database.bookModel.findByPk(newBook.id)
    expect(updatedBook.title).to.be.null
    expect(updatedBook.genres).to.be.empty
    expect(updatedBook.tags).to.be.empty
    expect(updatedBook.narrators).to.be.empty
    expect(updatedBook.coverPath).to.be.null
    expect(updatedBook.description).to.be.null

    // Verify associations are gone
    const authorsCount = await Database.bookAuthorModel.count({ where: { bookId: newBook.id } })
    expect(authorsCount).to.equal(0)

    const seriesCount = await Database.bookSeriesModel.count({ where: { bookId: newBook.id } })
    expect(seriesCount).to.equal(0)
  })

  it('should clear all metadata fields on resetMetadata for podcast', async () => {
    const newLibrary = await Database.libraryModel.create({ name: 'Test Podcast Library', mediaType: 'podcast' })
    const newLibraryFolder = await Database.libraryFolderModel.create({ path: '/test-podcast', libraryId: newLibrary.id })

    const newPodcast = await Database.podcastModel.create({
      title: 'Wrong Podcast Title',
      author: 'Wrong Podcast Author',
      description: 'Wrong Podcast Description',
      releaseDate: '2020-01-01',
      genres: ['Genre1'],
      tags: ['Tag1'],
      explicit: true,
      coverPath: '/some/path/cover.jpg'
    })

    const newLibraryItem = await Database.libraryItemModel.create({
      mediaId: newPodcast.id,
      mediaType: 'podcast',
      libraryId: newLibrary.id,
      libraryFolderId: newLibraryFolder.id,
      path: '/test/podcast-item',
      relPath: 'podcast-item',
      libraryFiles: []
    })

    // Reload expanded
    const libraryItem = await Database.libraryItemModel.getExpandedById(newLibraryItem.id)

    const fakeReq = {
      libraryItem,
      user: { username: 'admin', canUpdate: true },
      body: {}
    }
    const fakeRes = {
      json: sinon.spy(),
      sendStatus: sinon.spy()
    }

    await LibraryItemController.resetMetadata.bind(apiRouter)(fakeReq, fakeRes)

    // Verify scan was called
    expect(LibraryItemScanner.scanLibraryItem.calledOnce).to.be.true

    // Reload podcast from DB
    const updatedPodcast = await Database.podcastModel.findByPk(newPodcast.id)
    expect(updatedPodcast.title).to.be.null
    expect(updatedPodcast.author).to.be.null
    expect(updatedPodcast.genres).to.be.empty
    expect(updatedPodcast.tags).to.be.empty
    expect(updatedPodcast.coverPath).to.be.null
    expect(updatedPodcast.description).to.be.null
  })
})
