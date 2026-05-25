<template>
  <div class="w-full my-2">
    <div class="w-full bg-primary px-4 md:px-6 py-2 flex items-center cursor-pointer" @click.stop="clickBar">
      <p class="pr-2 md:pr-4">{{ $strings.HeaderLibraryFiles }}</p>
      <div class="h-5 md:h-7 w-5 md:w-7 rounded-full bg-white/10 flex items-center justify-center">
        <span class="text-sm font-mono">{{ files.length }}</span>
      </div>
      <div class="grow" />
      <ui-btn v-if="userIsAdmin" small :color="showFullPath ? 'bg-gray-600' : 'bg-primary'" class="mr-2 hidden md:block" @click.stop="toggleFullPath">{{ $strings.ButtonFullPath }}</ui-btn>
      <ui-btn v-if="userCanDelete" small color="bg-primary" class="mr-2" @click.stop="showSplitBookModal = true">{{ $strings.ButtonSplitBook || 'Split Book' }}</ui-btn>
      <ui-btn v-if="userCanDelete && hasDuplicates" small color="bg-warning hover:bg-warning/80 duration-200" class="mr-2 flex items-center" @click.stop="clickCleanDuplicates">
        <span class="material-symbols text-sm mr-1">delete_sweep</span>
        Clean Duplicates
      </ui-btn>
      <div class="cursor-pointer h-10 w-10 rounded-full hover:bg-black-400 flex justify-center items-center duration-500" :class="showFiles ? 'transform rotate-180' : ''">
        <span class="material-symbols text-4xl">&#xe313;</span>
      </div>
    </div>
    <transition name="slide">
      <div class="w-full" v-if="showFiles">
        <table class="text-sm tracksTable">
          <tr>
            <th class="text-left px-4">{{ $strings.LabelPath }}</th>
            <th class="text-left w-24 min-w-24">{{ $strings.LabelSize }}</th>
            <th class="text-left px-4 w-24">{{ $strings.LabelType }}</th>
            <th v-if="userCanDelete || userCanDownload || (userIsAdmin && audioFiles.length && !inModal)" class="text-center w-16"></th>
          </tr>
          <template v-for="file in filesWithAudioFile">
            <tables-library-files-table-row :key="file.path" :libraryItemId="libraryItemId" :showFullPath="showFullPath" :file="file" :inModal="inModal" @showMore="showMore" />
          </template>
        </table>
      </div>
    </transition>

    <modals-audio-file-data-modal v-model="showAudioFileDataModal" :library-item-id="libraryItemId" :audio-file="selectedAudioFile" />
    <modals-item-split-book-modal v-model="showSplitBookModal" :library-item="libraryItem" />
  </div>
</template>

<script>
export default {
  props: {
    libraryItem: {
      type: Object,
      default: () => {}
    },
    expanded: Boolean, // start expanded
    inModal: Boolean
  },
  data() {
    return {
      showFiles: false,
      showFullPath: false,
      showAudioFileDataModal: false,
      showSplitBookModal: false,
      selectedAudioFile: null
    }
  },
  computed: {
    libraryItemId() {
      return this.libraryItem.id
    },
    userCanDownload() {
      return this.$store.getters['user/getUserCanDownload']
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    },
    userIsAdmin() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    files() {
      return this.libraryItem.libraryFiles || []
    },
    audioFiles() {
      if (this.libraryItem.mediaType === 'podcast') {
        return this.libraryItem.media?.episodes.map((ep) => ep.audioFile).filter((af) => af) || []
      }
      return this.libraryItem.media?.audioFiles || []
    },
    filesWithAudioFile() {
      return this.files.map((file) => {
        if (file.fileType === 'audio') {
          file.audioFile = this.audioFiles.find((af) => af.ino === file.ino)
        }
        return file
      })
    },
    hasDuplicates() {
      if (!this.libraryItem) return false
      
      // 1. Check Exact Size
      const sizeGroups = {}
      this.filesWithAudioFile.forEach((file) => {
        if (file.fileType !== 'audio' && file.fileType !== 'ebook') return
        const size = file.metadata.size
        if (!size) return
        if (!sizeGroups[size]) sizeGroups[size] = []
        sizeGroups[size].push(file)
      })
      if (Object.values(sizeGroups).some((g) => g.length >= 2)) return true

      // 2. Consolidated format vs Split files
      const audioFiles = this.filesWithAudioFile.filter((f) => f.fileType === 'audio')
      const m4bFiles = audioFiles.filter((f) => f.metadata.ext === '.m4b' || f.metadata.ext === '.m4a')
      const splitFiles = audioFiles.filter((f) => f.metadata.ext !== '.m4b' && f.metadata.ext !== '.m4a')
      if (m4bFiles.length > 0 && splitFiles.length > 0) return true

      // 3. Same Duration, Different Bitrate/Quality
      const durationGroups = {}
      audioFiles.forEach((file) => {
        const duration = file.audioFile?.duration
        if (!duration) return
        const roundedDuration = Math.round(duration)
        if (!durationGroups[roundedDuration]) durationGroups[roundedDuration] = []
        durationGroups[roundedDuration].push(file)
      })

      // Exclude exact-size duplicates to avoid double flags
      const sizeMatchedInos = new Set()
      Object.values(sizeGroups).forEach((g) => {
        if (g.length >= 2) {
          g.forEach((f) => sizeMatchedInos.add(f.ino))
        }
      })

      const hasDurationDupes = Object.values(durationGroups).some((g) => {
        const filtered = g.filter((f) => !sizeMatchedInos.has(f.ino))
        return filtered.length >= 2
      })
      if (hasDurationDupes) return true

      return false
    }
  },
  methods: {
    toggleFullPath() {
      this.showFullPath = !this.showFullPath
      localStorage.setItem('showFullPath', this.showFullPath ? 1 : 0)
    },
    clickBar() {
      this.showFiles = !this.showFiles
    },
    showMore(audioFile) {
      this.selectedAudioFile = audioFile
      this.showAudioFileDataModal = true
    },
    clickCleanDuplicates() {
      this.$store.commit('globals/setCleanDuplicatesModal', {
        libraryItem: this.libraryItem
      })
    }
  },
  mounted() {
    if (this.userIsAdmin) {
      this.showFullPath = !!Number(localStorage.getItem('showFullPath') || 0)
    }
    this.showFiles = this.expanded
  }
}
</script>
