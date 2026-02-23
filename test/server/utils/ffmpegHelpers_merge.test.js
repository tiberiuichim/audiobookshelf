const { expect } = require('chai')
const sinon = require('sinon')
const EventEmitter = require('events')
const fs = require('../../../server/libs/fsExtra')
const { mergeAudioFiles } = require('../../../server/utils/ffmpegHelpers')

describe('mergeAudioFiles', () => {
  let ffmpegStub
  let audioTracks
  let encodingOptions
  let itemCachePath
  let outputFilePath

  beforeEach(() => {
    ffmpegStub = new EventEmitter()
    ffmpegStub.input = sinon.stub().returnsThis()
    ffmpegStub.inputOptions = sinon.stub().returnsThis()
    ffmpegStub.outputOptions = sinon.stub().returnsThis()
    ffmpegStub.output = sinon.stub().returnsThis()
    ffmpegStub.run = sinon.stub().callsFake(() => {
      ffmpegStub.emit('end')
    })

    audioTracks = [
      {
        index: 0,
        ino: 'ino1',
        metadata: { path: '/path/to/track1.mp3', ext: '.mp3' },
        duration: 100
      },
      {
        index: 1,
        ino: 'ino2',
        metadata: { path: '/path/to/track2.mp3', ext: '.mp3' },
        duration: 120
      }
    ]

    encodingOptions = {
      codec: 'aac',
      bitrate: '128k',
      channels: 2
    }

    itemCachePath = '/path/to/cache'
    outputFilePath = '/path/to/output.m4b'

    sinon.stub(fs, 'writeFile').resolves()
    sinon.stub(fs, 'remove').resolves()
  })

  afterEach(() => {
    sinon.restore()
  })

  it('should use re-encoding by default (codec aac)', async () => {
    await mergeAudioFiles(audioTracks, 220, itemCachePath, outputFilePath, encodingOptions, null, ffmpegStub)

    const calls = ffmpegStub.outputOptions.getCalls()
    const allArgs = calls.flatMap(call => call.args[0])
    
    expect(allArgs).to.include('-acodec aac')
    expect(allArgs).to.include('-ac 2')
    expect(allArgs).to.include('-b:a 128k')
  })

  it('should use stream copy when codec is copy', async () => {
    encodingOptions.codec = 'copy'

    await mergeAudioFiles(audioTracks, 220, itemCachePath, outputFilePath, encodingOptions, null, ffmpegStub)

    // Should hit the 'else' block which uses '-c:a copy'
    expect(ffmpegStub.outputOptions.calledWith(['-c:a copy'])).to.be.true
    
    // Should NOT contain bitrate or channels or acodec
    const outputOptionsCalls = ffmpegStub.outputOptions.getCalls()
    outputOptionsCalls.forEach(call => {
      const args = call.args[0]
      if (Array.isArray(args)) {
        expect(args.some(arg => arg.includes('-b:a'))).to.be.false
        expect(args.some(arg => arg.includes('-ac '))).to.be.false // space to avoid matching '-acodec'
        expect(args.some(arg => arg.includes('-acodec'))).to.be.false
      }
    })
  })

  it('should handle single track with copy', async () => {
    encodingOptions.codec = 'copy'
    const singleTrack = [audioTracks[0]]

    await mergeAudioFiles(singleTrack, 100, itemCachePath, outputFilePath, encodingOptions, null, ffmpegStub)

    expect(ffmpegStub.outputOptions.calledWith(['-c:a copy'])).to.be.true
  })

  it('should handle single track m4b with copy', async () => {
    encodingOptions.codec = 'copy'
    const singleTrack = [
      {
        index: 0,
        ino: 'ino1',
        metadata: { path: '/path/to/track1.m4b', ext: '.m4b' },
        duration: 100
      }
    ]

    await mergeAudioFiles(singleTrack, 100, itemCachePath, outputFilePath, encodingOptions, null, ffmpegStub)

    // Code says: if (isOneTrack && firstTrackIsM4b) ffmpeg.outputOptions(['-c copy'])
    expect(ffmpegStub.outputOptions.calledWith(['-c copy'])).to.be.true
  })
})
