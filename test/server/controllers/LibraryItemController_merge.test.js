const { expect } = require('chai')
const { Sequelize } = require('sequelize')
const sinon = require('sinon')
const fs = require('../../../server/libs/fsExtra')
const Path = require('path')

const Database = require('../../../server/Database')
const ApiRouter = require('../../../server/routers/ApiRouter')
const LibraryItemController = require('../../../server/controllers/LibraryItemController')
const ApiCacheManager = require('../../../server/managers/ApiCacheManager')
const Auth = require('../../../server/Auth')
const Logger = require('../../../server/Logger')
const LibraryItemScanner = require('../../../server/scanner/LibraryItemScanner')

describe('LibraryItemController Merge', () => {
  /** @type {ApiRouter} */
  let apiRouter

  beforeEach(async () => {
    global.ServerSettings = {}
    Database.sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    Database.sequelize.uppercaseFirst = (str) => (str ? `${str[0].toUpperCase()}${str.substr(1)}` : '')
    await Database.buildModels()

    apiRouter = new ApiRouter({
      auth: new Auth(),
      apiCacheManager: new ApiCacheManager()
    })

    sinon.stub(Logger, 'info')
    sinon.stub(Logger, 'error')
    sinon.stub(Logger, 'warn')
    
    // Mock fs-extra methods
    sinon.stub(fs, 'ensureDir').resolves()
    sinon.stub(fs, 'move').resolves()
    sinon.stub(fs, 'pathExists').resolves(false)
    sinon.stub(fs, 'readdir').resolves([])
    sinon.stub(fs, 'remove').resolves()
    sinon.stub(fs, 'rmdir').resolves()

    // Mock Scanner
    sinon.stub(LibraryItemScanner, 'scanLibraryItem').resolves()
  })

  afterEach(async () => {
    sinon.restore()
    // Clear all tables
    await Database.sequelize.sync({ force: true })
  })

  describe('batchMerge', () => {
    it('should merge two file-based items into a new folder', async () => {
      // Setup Library and Folder
      const library = await Database.libraryModel.create({ name: 'Book Lib', mediaType: 'book' })
      const libraryFolder = await Database.libraryFolderModel.create({ path: '/books', libraryId: library.id })
      
      // Item 1: File in root
      const book1 = await Database.bookModel.create({ title: 'Book 1', audioFiles: [] })
      const item1 = await Database.libraryItemModel.create({ 
          mediaId: book1.id, 
          mediaType: 'book', 
          libraryId: library.id, 
          libraryFolderId: libraryFolder.id,
          path: '/books/book1.mp3',
          relPath: 'book1.mp3',
          isFile: true
      })
      // Create Author
      const author = await Database.authorModel.create({ name: 'Author 1', libraryId: library.id })
      await Database.bookAuthorModel.create({ bookId: book1.id, authorId: author.id })
      
      await item1.save()

      // Item 2: File in root
      const book2 = await Database.bookModel.create({ title: 'Book 1 Part 2', audioFiles: [] })
      const item2 = await Database.libraryItemModel.create({ 
          mediaId: book2.id, 
          mediaType: 'book', 
          libraryId: library.id, 
          libraryFolderId: libraryFolder.id,
          path: '/books/book2.mp3',
          relPath: 'book2.mp3',
          isFile: true
      })
      item2.media = book2

      // Mock user
      const user = { canDelete: true, username: 'admin' }
      
      const req = {
          user,
          body: {
              libraryItemIds: [item1.id, item2.id]
          }
      }
      
      const res = {
          json: sinon.spy(),
          sendStatus: sinon.spy(),
          status: sinon.stub().returnsThis(),
          send: sinon.spy()
      }

      await LibraryItemController.batchMerge.bind(apiRouter)(req, res)

      // Verify response
      if (res.status.called) {
          console.log('Error status:', res.status.args[0])
          console.log('Error send:', res.send.args[0])
      }
      expect(res.json.calledOnce).to.be.true
      const result = res.json.args[0][0]
      expect(result.success).to.be.true
      expect(result.successIds).to.have.lengthOf(1) // Only item2 is "processed" (deleted), item1 is updated
      expect(result.successIds).to.include(item2.id)

      // Verify fs calls
      // Should create folder "Author 1 - Book 1"
      const expectedFolderPath = Path.join('/books', 'Author 1 - Book 1')
      expect(fs.ensureDir.calledWith(expectedFolderPath)).to.be.true
      
      // Should move item1
      expect(fs.move.calledWith('/books/book1.mp3', Path.join(expectedFolderPath, 'book1.mp3'))).to.be.true
      
      // Should move item2
      expect(fs.move.calledWith('/books/book2.mp3', Path.join(expectedFolderPath, 'book2.mp3'))).to.be.true
      
      // item1 should be updated (path change) - NOT checked here because scanLibraryItem is mocked and it handles the update
      // const updatedItem1 = await Database.libraryItemModel.findByPk(item1.id)
      // expect(updatedItem1.path).to.equal(Path.join(expectedFolderPath, 'book1.mp3'))
      
      // item2 should be deleted
      const updatedItem2 = await Database.libraryItemModel.findByPk(item2.id)
      expect(updatedItem2).to.be.null

      // Verify Scanner called
      expect(LibraryItemScanner.scanLibraryItem.called).to.be.true
      const scanArgs = LibraryItemScanner.scanLibraryItem.firstCall.args
      expect(scanArgs[0]).to.equal(item1.id)
      expect(scanArgs[1]).to.deep.equal({
          path: expectedFolderPath,
          relPath: 'Author 1 - Book 1',
          isFile: false
      })
    })
  })
})
