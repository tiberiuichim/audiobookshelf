<template>
  <modals-modal v-model="show" name="cleanDuplicates" :width="750" :height="'unset'">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3">
        <p class="text-xl text-white font-semibold tracking-wide">Clean Duplicate Media Files</p>
      </div>
    </template>

    <div ref="container" class="w-full rounded-lg bg-bg box-shadow-md overflow-y-auto overflow-x-hidden" style="max-height: 80vh">
      <div v-if="show" class="w-full h-full py-5 px-6">
        <p class="text-gray-300 text-sm mb-6 leading-relaxed">
          The following groups of duplicate files were detected in this book. Review the files that will be deleted and those that will stay, then click <strong>Delete selected duplicates</strong> to clean them up.
        </p>

        <div v-if="loading" class="w-full py-12 flex flex-col items-center justify-center space-y-4">
          <ui-loading />
          <p class="text-gray-400 text-sm animate-pulse">Deleting selected files and updating book...</p>
        </div>

        <div v-else-if="!duplicateGroups.length" class="w-full py-8 text-center text-gray-400">
          <span class="material-symbols text-5xl mb-2 text-success">check_circle</span>
          <p class="text-base font-medium">No duplicate media files found in this book!</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="(group, groupIdx) in duplicateGroups" :key="groupIdx" class="border border-white/10 rounded-lg overflow-hidden bg-primary/5 shadow-sm">
            <!-- Group Header -->
            <div class="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div class="flex items-center space-x-2">
                <span class="material-symbols text-warning text-xl" v-if="group.type === 'exact-size'">difference</span>
                <span class="material-symbols text-info text-xl" v-else-if="group.type === 'format-consolidated'">dynamic_feed</span>
                <span class="material-symbols text-success text-xl" v-else>avg_time</span>
                <p class="font-medium text-sm text-gray-200">{{ group.name }}</p>
              </div>
              <span class="text-xxs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                {{ group.type }}
              </span>
            </div>

            <!-- Group Files -->
            <div class="divide-y divide-white/5">
              <!-- Files to Keep (Stay) -->
              <div v-for="file in group.keep" :key="'keep-' + file.ino" class="px-4 py-3 flex items-center justify-between bg-emerald-500/5 hover:bg-emerald-500/10 duration-200">
                <div class="flex items-center space-x-3 min-w-0 pr-4">
                  <span class="material-symbols text-success text-lg flex-shrink-0">check_circle</span>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-100 truncate" :title="file.metadata.filename">{{ file.metadata.filename }}</p>
                    <p class="text-xs text-gray-400 mt-0.5 flex items-center space-x-2">
                      <span>{{ $bytesPretty(file.metadata.size) }}</span>
                      <span class="text-white/20">•</span>
                      <span>{{ file.metadata.ext.toUpperCase().replace('.', '') }}</span>
                      <span v-if="file.audioFile && file.audioFile.duration" class="text-white/20">•</span>
                      <span v-if="file.audioFile && file.audioFile.duration">{{ $elapsedPretty(file.audioFile.duration) }}</span>
                    </p>
                  </div>
                </div>
                <span class="flex-shrink-0 px-2.5 py-1 text-xxs font-bold text-success bg-success/20 rounded-full border border-success/30">
                  STAY
                </span>
              </div>

              <!-- Files to Delete -->
              <div v-for="file in group.delete" :key="'delete-' + file.ino" class="px-4 py-3 flex items-center justify-between hover:bg-rose-500/10 duration-200" :class="selectedInos.includes(file.ino) ? 'bg-rose-500/5' : 'bg-transparent'">
                <div class="flex items-center space-x-3 min-w-0 pr-4">
                  <div class="flex items-center justify-center flex-shrink-0">
                    <input type="checkbox" :id="'check-' + file.ino" v-model="selectedInos" :value="file.ino" class="h-4 w-4 rounded border-white/20 bg-black-600 text-rose-500 focus:ring-rose-500" />
                  </div>
                  <label :for="'check-' + file.ino" class="min-w-0 cursor-pointer">
                    <p class="text-sm font-medium text-gray-200 truncate" :class="selectedInos.includes(file.ino) ? 'line-through text-gray-400' : ''" :title="file.metadata.filename">
                      {{ file.metadata.filename }}
                    </p>
                    <p class="text-xs text-gray-400 mt-0.5 flex items-center space-x-2">
                      <span>{{ $bytesPretty(file.metadata.size) }}</span>
                      <span class="text-white/20">•</span>
                      <span>{{ file.metadata.ext.toUpperCase().replace('.', '') }}</span>
                      <span v-if="file.audioFile && file.audioFile.duration" class="text-white/20">•</span>
                      <span v-if="file.audioFile && file.audioFile.duration">{{ $elapsedPretty(file.audioFile.duration) }}</span>
                    </p>
                  </label>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0">
                  <span class="px-2.5 py-1 text-xxs font-bold text-rose-400 bg-rose-500/20 rounded-full border border-rose-500/30" v-if="selectedInos.includes(file.ino)">
                    DELETE
                  </span>
                  <span class="px-2.5 py-1 text-xxs font-bold text-gray-400 bg-white/5 rounded-full border border-white/10" v-else>
                    STAY
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Space savings info & Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
            <div class="flex items-center space-x-2 text-sm text-gray-300">
              <span class="material-symbols text-info text-lg">info</span>
              <p>
                Potential Space Savings: <strong class="text-success font-semibold">{{ $bytesPretty(spaceSavings) }}</strong>
              </p>
            </div>
            <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <ui-btn @click="close" :disabled="loading">{{ $strings.ButtonCancel || 'Cancel' }}</ui-btn>
              <ui-btn color="bg-rose-600 hover:bg-rose-500 duration-200" :disabled="loading || !selectedInos.length" @click="confirmDelete">
                <span class="material-symbols text-sm mr-1">delete</span>
                Delete Selected Duplicates ({{ selectedInos.length }})
              </ui-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      selectedInos: [],
      loading: false
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showCleanDuplicatesModal
      },
      set(val) {
        this.$store.commit('globals/setShowCleanDuplicatesModal', val)
      }
    },
    options() {
      return this.$store.state.globals.cleanDuplicatesOptions || {}
    },
    libraryItem() {
      return this.options.libraryItem || null
    },
    files() {
      return this.libraryItem?.libraryFiles || []
    },
    audioFiles() {
      if (this.libraryItem?.mediaType === 'podcast') {
        return this.libraryItem?.media?.episodes?.map((ep) => ep.audioFile)?.filter((af) => af) || []
      }
      return this.libraryItem?.media?.audioFiles || []
    },
    filesWithAudioFile() {
      return this.files.map((file) => {
        const fileCopy = { ...file }
        if (fileCopy.fileType === 'audio') {
          fileCopy.audioFile = this.audioFiles.find((af) => af.ino === fileCopy.ino)
        }
        return fileCopy
      })
    },
    duplicateGroups() {
      if (!this.libraryItem) return []
      const groups = []

      // 1. Group by Exact Size
      const sizeGroups = {}
      this.filesWithAudioFile.forEach((file) => {
        if (file.fileType !== 'audio' && file.fileType !== 'ebook') return
        const size = file.metadata.size
        if (!size) return
        if (!sizeGroups[size]) sizeGroups[size] = []
        sizeGroups[size].push(file)
      })

      const sizeKeys = Object.keys(sizeGroups)
      sizeKeys.forEach((size) => {
        const group = sizeGroups[size]
        if (group.length < 2) return

        // Sort to determine which one to keep
        const sorted = [...group].sort((a, b) => {
          const aCopy = /copy|\(\d+\)/i.test(a.metadata.filename)
          const bCopy = /copy|\(\d+\)/i.test(b.metadata.filename)
          if (aCopy && !bCopy) return 1
          if (!aCopy && bCopy) return -1
          return a.metadata.filename.length - b.metadata.filename.length
        })

        groups.push({
          type: 'exact-size',
          name: `Exact duplicates (Same size: ${this.$bytesPretty(group[0].metadata.size)})`,
          keep: [sorted[0]],
          delete: sorted.slice(1)
        })
      })

      // 2. Consolidated format vs Split files (MP3s vs M4B/M4A)
      const audioFiles = this.filesWithAudioFile.filter((f) => f.fileType === 'audio')
      const m4bFiles = audioFiles.filter((f) => f.metadata.ext === '.m4b' || f.metadata.ext === '.m4a')
      const splitFiles = audioFiles.filter((f) => f.metadata.ext !== '.m4b' && f.metadata.ext !== '.m4a')

      if (m4bFiles.length > 0 && splitFiles.length > 0) {
        // Exclude files already grouped in exact-size to avoid duplication
        const alreadyGroupedInos = new Set()
        groups.forEach((g) => {
          g.keep.forEach((f) => alreadyGroupedInos.add(f.ino))
          g.delete.forEach((f) => alreadyGroupedInos.add(f.ino))
        })

        const filteredSplitFiles = splitFiles.filter((f) => !alreadyGroupedInos.has(f.ino))
        const filteredM4bFiles = m4bFiles.filter((f) => !alreadyGroupedInos.has(f.ino))

        if (filteredM4bFiles.length > 0 && filteredSplitFiles.length > 0) {
          groups.push({
            type: 'format-consolidated',
            name: 'Consolidated format vs Split files (Recommended to keep consolidated)',
            keep: [filteredM4bFiles[0]],
            delete: filteredSplitFiles
          })
        }
      }

      // 3. Same Duration, Different Bitrate/Quality
      const durationGroups = {}
      audioFiles.forEach((file) => {
        const duration = file.audioFile?.duration
        if (!duration) return
        const roundedDuration = Math.round(duration)
        if (!durationGroups[roundedDuration]) durationGroups[roundedDuration] = []
        durationGroups[roundedDuration].push(file)
      })

      const durationKeys = Object.keys(durationGroups)
      durationKeys.forEach((dur) => {
        const group = durationGroups[dur]
        if (group.length < 2) return

        // Exclude if already grouped
        const alreadyGroupedInos = new Set()
        groups.forEach((g) => {
          g.keep.forEach((f) => alreadyGroupedInos.add(f.ino))
          g.delete.forEach((f) => alreadyGroupedInos.add(f.ino))
        })

        const filteredGroup = group.filter((f) => !alreadyGroupedInos.has(f.ino))
        if (filteredGroup.length < 2) return

        // Prefer keeping higher size (higher quality)
        const sorted = [...filteredGroup].sort((a, b) => b.metadata.size - a.metadata.size)

        groups.push({
          type: 'same-duration',
          name: `Same duration, different quality (${this.$elapsedPretty(group[0].audioFile.duration)})`,
          keep: [sorted[0]],
          delete: sorted.slice(1)
        })
      })

      return groups
    },
    spaceSavings() {
      let savings = 0
      this.duplicateGroups.forEach((g) => {
        g.delete.forEach((f) => {
          if (this.selectedInos.includes(f.ino)) {
            savings += f.metadata.size || 0
          }
        })
      })
      return savings
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.init()
      }
    }
  },
  methods: {
    init() {
      // Auto-select detected duplicates for deletion by default
      const inos = []
      this.duplicateGroups.forEach((g) => {
        g.delete.forEach((f) => {
          inos.push(f.ino)
        })
      })
      this.selectedInos = inos
      this.loading = false
    },
    close() {
      this.show = false
    },
    async confirmDelete() {
      if (!this.selectedInos.length) return
      this.loading = true
      try {
        // Delete selected inodes one by one
        for (const ino of this.selectedInos) {
          await this.$axios.$delete(`/api/items/${this.libraryItem.id}/file/${ino}`)
        }
        this.$toast.success('Successfully deleted duplicate files')
        this.close()
      } catch (error) {
        console.error('Failed to delete duplicates', error)
        this.$toast.error('Failed to delete one or more duplicate files')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
