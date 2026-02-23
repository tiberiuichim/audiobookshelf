const fs = require('fs')
const path = require('path')
const prober = require('../server/utils/prober')

// Mocking some environment variables that might be needed
process.env.FFPROBE_PATH = process.env.FFPROBE_PATH || 'ffprobe'

async function organize(directory, dryRun = true) {
  if (!fs.existsSync(directory)) {
    console.error(`Error: Directory ${directory} does not exist.`)
    return
  }

  const files = fs.readdirSync(directory).filter(f => f.toLowerCase().endsWith('.mp3'))
  
  if (files.length === 0) {
    console.log(`No MP3 files found in ${directory}`)
    return
  }

  console.log(`Found ${files.length} MP3 files. Probing metadata...`)

  const groups = {}

  for (const file of files) {
    const filePath = path.join(directory, file)
    try {
      const probeData = await prober.probe(filePath)
      
      if (probeData.error) {
        console.error(`Error probing ${file}: ${probeData.error}`)
        continue
      }

      // album is often used for Audiobook title
      // artist is author
      const album = probeData.audioMetaTags?.tagAlbum || 'Unknown Album'
      const artist = probeData.audioMetaTags?.tagArtist || 'Unknown Author'
      
      const folderName = `${artist} - ${album}`.replace(/[<>:"/\\|?*]/g, '_') // Sanitize folder name
      
      if (!groups[folderName]) {
        groups[folderName] = []
      }
      groups[folderName].push(file)
    } catch (err) {
      console.error(`Failed to process ${file}:`, err)
    }
  }

  console.log('\nOrganization Plan:')
  for (const [folderName, folderFiles] of Object.entries(groups)) {
    console.log(`\nFolder: ${folderName} (${folderFiles.length} files)`)
    folderFiles.forEach(f => console.log(`  - ${f}`))
  }

  if (dryRun) {
    console.log('\n[DRY RUN] No changes were made. Run with --apply to reorganize files.')
    return
  }

  console.log('\nApplying changes...')
  for (const [folderName, folderFiles] of Object.entries(groups)) {
    const targetDir = path.join(directory, folderName)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    for (const file of folderFiles) {
      const oldPath = path.join(directory, file)
      const newPath = path.join(targetDir, file)
      try {
        fs.renameSync(oldPath, newPath)
        console.log(`Moved: ${file} -> ${folderName}/`)
      } catch (err) {
        console.error(`Error moving ${file}:`, err)
      }
    }
  }
  console.log('\nOrganization complete.')
}

const args = process.argv.slice(2)
const dir = args[0]
const apply = args.includes('--apply')

if (!dir) {
  console.log('Usage: node scripts/group_by_metadata.js <directory> [--apply]')
  process.exit(1)
}

organize(path.resolve(dir), !apply)
