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

  it('should clear only title/author fields and preserve other metadata on resetMetadata', async () => {
    const newLibrary = await Database.libraryModel.create({ name: 'Test Library', mediaType: 'book' })
    const newLibraryFolder = await Database.libraryFolderModel.create({ path: '/test', libraryId: newLibrary.id })

    const newBook = await Database.bookModel.create({
      title: 'Wrong Title',
      subtitle: 'My Subtitle',
      description: 'My Description',
      publisher: 'My Publisher',
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
    
    // Title should be cleared
    expect(updatedBook.title).to.be.null
    
    // Other metadata should be PRESERVED
    expect(updatedBook.genres).to.deep.equal(['Genre1'])
    expect(updatedBook.tags).to.deep.equal(['Tag1'])
    expect(updatedBook.narrators).to.deep.equal(['Narrator1'])
    expect(updatedBook.coverPath).to.equal('/some/path/cover.jpg')
    expect(updatedBook.description).to.equal('My Description')
    expect(updatedBook.publisher).to.equal('My Publisher')
    expect(updatedBook.publishedYear).to.equal('2020')
    expect(updatedBook.isbn).to.equal('123456')
    expect(updatedBook.asin).to.equal('B00000')
    expect(updatedBook.language).to.equal('en')
    expect(updatedBook.explicit).to.be.true
    expect(updatedBook.subtitle).to.equal('My Subtitle')

    // Author associations should be cleared
    const authorsCount = await Database.bookAuthorModel.count({ where: { bookId: newBook.id } })
    expect(authorsCount).to.equal(0)

    // Series associations should be PRESERVED
    const seriesCount = await Database.bookSeriesModel.count({ where: { bookId: newBook.id } })
    expect(seriesCount).to.equal(1)
  })

  it('should clear only title/author fields and preserve other metadata on resetMetadata for podcast', async () => {
    const newLibrary = await Database.libraryModel.create({ name: 'Test Podcast Library', mediaType: 'podcast' })
    const newLibraryFolder = await Database.libraryFolderModel.create({ path: '/test-podcast', libraryId: newLibrary.id })

    const newPodcast = await Database.podcastModel.create({
      title: 'Wrong Podcast Title',
      author: 'Wrong Podcast Author',
      description: 'My Podcast Description',
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
    
    // Title and author should be cleared
    expect(updatedPodcast.title).to.be.null
    expect(updatedPodcast.author).to.be.null
    
    // Other metadata should be PRESERVED
    expect(updatedPodcast.genres).to.deep.equal(['Genre1'])
    expect(updatedPodcast.tags).to.deep.equal(['Tag1'])
    expect(updatedPodcast.coverPath).to.equal('/some/path/cover.jpg')
    expect(updatedPodcast.description).to.equal('My Podcast Description')
    expect(updatedPodcast.releaseDate).to.equal('2020-01-01')
    expect(updatedPodcast.explicit).to.be.true
  })
})
