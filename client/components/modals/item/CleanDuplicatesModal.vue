<template>
  <modals-modal v-model="show" name="cleanDuplicates" :width="750" :height="'unset'">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3">
        <p class="text-xl text-white font-semibold tracking-wide">Clean Duplicate Media Files</p>
      </div>
    </template>

    <div ref="container" class="w-full rounded-lg bg-bg box-shadow-md flex flex-col" style="max-height: 80vh; height: 620px;">
      <!-- Scrollable content area -->
      <div v-if="show" class="flex-grow overflow-y-auto overflow-x-hidden py-5 px-6">
        <p class="text-gray-300 text-sm mb-6 leading-relaxed">
          The following groups of duplicate files were detected in this book. Review the files that will be deleted and those that will stay, then click <strong>Delete selected duplicates</strong> to clean them up.
        </p>

        <div v-if="loading || loadingItem" class="w-full py-12 flex flex-col items-center justify-center space-y-4">
          <ui-loading />
          <p class="text-gray-400 text-sm animate-pulse">
            {{ loading ? 'Deleting selected files and updating book...' : 'Loading book details...' }}
          </p>
        </div>

        <div v-else-if="!duplicateGroups.length" class="w-full py-8 text-center text-gray-400">
          <span class="material-symbols text-5xl mb-2 text-success">check_circle</span>
          <p class="text-base font-medium">No duplicate media files found in this book!</p>
        </div>

        <div v-else class="space-y-6">
          <!-- Overview Dashboard Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <!-- Left Column: Selection Controls -->
            <div class="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center space-x-2 mb-3 text-info">
                  <span class="material-symbols text-xl">checklist</span>
                  <span class="text-xs uppercase tracking-wider font-bold">Selection Controls</span>
                </div>
                <p class="text-xs text-gray-400 mb-4 leading-relaxed">
                  Quickly toggle which duplicate files are selected for deletion.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2 mt-auto">
                <button @click.stop.prevent="selectAll" class="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-gray-200 cursor-pointer font-medium active:scale-95">
                  <span class="material-symbols text-sm">select_all</span>
                  <span>Select All</span>
                </button>
                <button @click.stop.prevent="deselectAll" class="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-gray-200 cursor-pointer font-medium active:scale-95">
                  <span class="material-symbols text-sm">deselect</span>
                  <span>Clear All</span>
                </button>
                <button @click.stop.prevent="invertSelection" class="col-span-2 bg-info/20 border border-info/30 hover:bg-info/30 hover:border-info/40 transition-all duration-200 text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-info cursor-pointer font-semibold active:scale-95">
                  <span class="material-symbols text-sm">swap_horiz</span>
                  <span>Invert Choice</span>
                </button>
              </div>
            </div>

            <!-- Right Column: Cleaning -->
            <div class="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex flex-col justify-between">
              <div>
                <div class="flex items-center space-x-2 mb-3 text-rose-400">
                  <span class="material-symbols text-xl">delete_sweep</span>
                  <span class="text-xs uppercase tracking-wider font-bold">Duplicates to Remove</span>
                </div>
                <div class="text-xs text-gray-300 space-y-2">
                  <p class="flex justify-between items-center">
                    <span>Selected for Deletion:</span>
                    <strong class="text-rose-400 font-bold text-sm bg-rose-500/15 px-2 py-0.5 rounded">{{ selectedInos.length }} / {{ allGroupFiles.length }} files</strong>
                  </p>
                  <p class="flex justify-between items-center">
                    <span>Potential Space Saved:</span>
                    <strong class="text-emerald-400 font-bold text-sm bg-emerald-500/15 px-2 py-0.5 rounded">{{ $bytesPretty(spaceSavings) }}</strong>
                  </p>
                </div>
              </div>
              <div class="mt-3 text-[10px] text-gray-400 italic">
                * Deselect files in the detailed list below to customize.
              </div>
            </div>
          </div>

          <!-- Detailed list of duplicates -->
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
              <!-- Files to Keep: collapsed summary if many files -->
              <template v-if="group.keep.length > 3 && !expandedKeepGroups[groupIdx]">
                <div class="px-4 py-3 bg-emerald-500/5 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="material-symbols text-emerald-400 text-xl">folder_open</span>
                    <div>
                      <p class="text-sm font-medium text-gray-100">
                        {{ group.keep.length }} files — {{ group.keep[0]?.metadata?.ext?.toUpperCase().replace('.', '') }} format
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">
                        Total: {{ $bytesPretty(group.keep.reduce((sum, f) => sum + (f.metadata.size || 0), 0)) }}
                        <span class="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider ml-2">Recommended</span>
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2 flex-shrink-0">
                    <button @click.stop="toggleExpandKeep(groupIdx)" class="text-xs text-gray-400 hover:text-gray-200 underline transition-colors">
                      Show all {{ group.keep.length }} files
                    </button>
                    <span class="px-2.5 py-1 text-xxs font-bold text-success bg-success/20 rounded-full border border-success/30">STAY</span>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- Files to Keep (Stay) -->
                <div v-for="file in group.keep" :key="'keep-' + file.ino" class="px-4 py-3 flex items-center justify-between hover:bg-rose-500/10 duration-200" :class="selectedInos.includes(file.ino) ? 'bg-rose-500/5' : 'bg-emerald-500/5 hover:bg-emerald-500/10'">
                  <div class="flex items-center space-x-3 min-w-0 pr-4">
                    <div class="flex items-center justify-center flex-shrink-0">
                      <input type="checkbox" :id="'check-' + file.ino" v-model="selectedInos" :value="file.ino" class="h-4 w-4 rounded border-white/20 bg-black-600 text-rose-500 focus:ring-rose-500" />
                    </div>
                    <label :for="'check-' + file.ino" class="min-w-0 cursor-pointer">
                      <p class="text-sm font-medium text-gray-100 truncate" :class="selectedInos.includes(file.ino) ? 'line-through text-gray-400' : ''" :title="file.metadata.filename">{{ file.metadata.filename }}</p>
                      <p class="text-xs text-gray-400 mt-0.5 flex items-center space-x-2">
                        <span>{{ $bytesPretty(file.metadata.size) }}</span>
                        <span class="text-white/20">•</span>
                        <span>{{ file.metadata.ext.toUpperCase().replace('.', '') }}</span>
                        <span v-if="file.audioFile && file.audioFile.duration" class="text-white/20">•</span>
                        <span v-if="file.audioFile && file.audioFile.duration">{{ $elapsedPretty(file.audioFile.duration) }}</span>
                        <span class="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider">Recommended</span>
                      </p>
                    </label>
                  </div>
                  <div class="flex items-center space-x-2 flex-shrink-0">
                    <button v-if="group.keep.length > 3 && expandedKeepGroups[groupIdx]" @click.stop="toggleExpandKeep(groupIdx)" class="text-xs text-gray-500 hover:text-gray-300 transition-colors mr-1">Collapse</button>
                    <span class="px-2.5 py-1 text-xxs font-bold text-rose-400 bg-rose-500/20 rounded-full border border-rose-500/30" v-if="selectedInos.includes(file.ino)">
                      DELETE
                    </span>
                    <span class="px-2.5 py-1 text-xxs font-bold text-success bg-success/20 rounded-full border border-success/30" v-else>
                      STAY
                    </span>
                  </div>
                </div>
              </template>

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
        </div>
      </div>

      <!-- Sticky actions footer -->
      <div v-if="show && !loading && !loadingItem && duplicateGroups.length" class="flex-shrink-0 bg-white/2 border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
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
      <div v-else-if="show && !loading && !loadingItem" class="flex-shrink-0 bg-white/2 border-t border-white/5 px-6 py-4 flex items-center justify-end backdrop-blur-md">
        <ui-btn @click="close">Close</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      selectedInos: [],
      loading: false,
      loadingItem: false,
      expandedLibraryItem: null,
      expandedKeepGroups: {}
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
    resolvedLibraryItem() {
      return this.expandedLibraryItem || this.libraryItem
    },
    files() {
      return this.resolvedLibraryItem?.libraryFiles || []
    },
    audioFiles() {
      if (this.resolvedLibraryItem?.mediaType === 'podcast') {
        return this.resolvedLibraryItem?.media?.episodes?.map((ep) => ep.audioFile)?.filter((af) => af) || []
      }
      return this.resolvedLibraryItem?.media?.audioFiles || []
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
      if (!this.resolvedLibraryItem) return []
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

        // Sub-group by cleaned filename to distinguish different parts of identical size
        const nameGroups = {}
        group.forEach((file) => {
          const name = this.cleanFilename(file.metadata.filename)
          if (!nameGroups[name]) nameGroups[name] = []
          nameGroups[name].push(file)
        })

        Object.values(nameGroups).forEach((subGroup) => {
          if (subGroup.length < 2) return

          // Sort to determine which one to keep
          const sorted = [...subGroup].sort((a, b) => {
            const aCopy = /copy|\(\d+\)/i.test(a.metadata.filename)
            const bCopy = /copy|\(\d+\)/i.test(b.metadata.filename)
            if (aCopy && !bCopy) return 1
            if (!aCopy && bCopy) return -1
            return a.metadata.filename.length - b.metadata.filename.length
          })

          groups.push({
            type: 'exact-size',
            name: `Exact duplicates (Same size & name: ${this.$bytesPretty(subGroup[0].metadata.size)})`,
            keep: [sorted[0]],
            delete: sorted.slice(1)
          })
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
          // Determine which side is the "consolidated" format:
          // - If 1 m4b + many split files: m4b is the whole book, split are chapters → keep m4b
          // - If many m4bs + few split files: m4bs are per-chapter splits, split file(s) are whole-book → keep m4b chapters
          // In both cases we keep the m4b side and suggest deleting the split (non-m4b) side.
          const m4bIsChapterSplit = filteredM4bFiles.length > filteredSplitFiles.length
          const groupLabel = m4bIsChapterSplit
            ? `M4B chapter files vs ${filteredSplitFiles.length === 1 ? 'whole-book' : ''} ${filteredSplitFiles[0]?.metadata?.ext?.toUpperCase().replace('.', '') || 'audio'} file(s) — keeping chapter M4Bs, removing other format`
            : `Consolidated M4B vs ${filteredSplitFiles.length} split file(s) — keeping consolidated format`

          groups.push({
            type: 'format-consolidated',
            name: groupLabel,
            keep: filteredM4bFiles,
            delete: filteredSplitFiles
          })
        }
      }

      // 3. Same Duration & Name duplicates
      const groupedInos = new Set()
      for (let i = 0; i < audioFiles.length; i++) {
        const fileA = audioFiles[i]
        if (groupedInos.has(fileA.ino)) continue

        const durationA = fileA.audioFile?.duration
        if (!durationA) continue

        const cleanNameA = this.cleanFilename(fileA.metadata.filename)
        const group = [fileA]

        for (let j = i + 1; j < audioFiles.length; j++) {
          const fileB = audioFiles[j]
          if (groupedInos.has(fileB.ino)) continue

          const durationB = fileB.audioFile?.duration
          if (!durationB) continue

          const cleanNameB = this.cleanFilename(fileB.metadata.filename)
          const nameMatch = cleanNameA === cleanNameB
          const durationMatch = Math.abs(durationA - durationB) < 1.5

          if (nameMatch && durationMatch) {
            group.push(fileB)
          }
        }

        if (group.length >= 2) {
          group.forEach((f) => groupedInos.add(f.ino))

          // Exclude if already grouped
          const alreadyGroupedInos = new Set()
          groups.forEach((g) => {
            g.keep.forEach((f) => alreadyGroupedInos.add(f.ino))
            g.delete.forEach((f) => alreadyGroupedInos.add(f.ino))
          })

          const filteredGroup = group.filter((f) => !alreadyGroupedInos.has(f.ino))
          if (filteredGroup.length >= 2) {
            // Prefer keeping higher size (higher quality)
            const sorted = [...filteredGroup].sort((a, b) => b.metadata.size - a.metadata.size)

            groups.push({
              type: 'same-duration',
              name: `Same track, different quality (${this.$elapsedPretty(group[0].audioFile.duration)})`,
              keep: [sorted[0]],
              delete: sorted.slice(1)
            })
          }
        }
      }

      return groups
    },
    spaceSavings() {
      let savings = 0
      this.allGroupFiles.forEach((f) => {
        if (this.selectedInos.includes(f.ino)) {
          savings += f.metadata.size || 0
        }
      })
      return savings
    },
    allKeepFiles() {
      const files = []
      this.duplicateGroups.forEach((g) => {
        g.keep.forEach((f) => {
          if (!files.some((existing) => existing.ino === f.ino)) {
            files.push(f)
          }
        })
      })
      return files
    },
    allDeleteFiles() {
      const files = []
      this.duplicateGroups.forEach((g) => {
        g.delete.forEach((f) => {
          if (!files.some((existing) => existing.ino === f.ino)) {
            files.push(f)
          }
        })
      })
      return files
    },
    allGroupFiles() {
      const files = []
      this.duplicateGroups.forEach((g) => {
        g.keep.forEach((f) => {
          if (!files.some((existing) => existing.ino === f.ino)) {
            files.push(f)
          }
        })
        g.delete.forEach((f) => {
          if (!files.some((existing) => existing.ino === f.ino)) {
            files.push(f)
          }
        })
      })
      return files
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.fetchExpandedItem()
        window.addEventListener('keydown', this.handleGlobalKeyDown)
      } else {
        this.expandedLibraryItem = null
        this.selectedInos = []
        this.expandedKeepGroups = {}
        window.removeEventListener('keydown', this.handleGlobalKeyDown)
      }
    },
    duplicateGroups: {
      immediate: true,
      handler(newGroups) {
        if (newGroups && newGroups.length) {
          const inos = []
          newGroups.forEach((g) => {
            g.delete.forEach((f) => {
              inos.push(f.ino)
            })
          })
          this.selectedInos = inos
        }
      }
    }
  },
  methods: {
    toggleExpandKeep(groupIdx) {
      this.$set(this.expandedKeepGroups, groupIdx, !this.expandedKeepGroups[groupIdx])
    },
    selectAll() {
      this.selectedInos = this.allGroupFiles.map((f) => f.ino)
    },
    deselectAll() {
      this.selectedInos = []
    },
    invertSelection() {
      const currentSelected = new Set(this.selectedInos)
      const newSelected = []
      this.allGroupFiles.forEach((f) => {
        if (!currentSelected.has(f.ino)) {
          newSelected.push(f.ino)
        }
      })
      this.selectedInos = newSelected
    },
    cleanFilename(filename) {
      if (!filename) return ''
      const lastDot = filename.lastIndexOf('.')
      if (lastDot === -1) return filename.toLowerCase()
      let base = filename.substring(0, lastDot)
      base = base.replace(/copy|\(\d+\)|-\s*copy/gi, '').trim()
      return base.toLowerCase()
    },
    async fetchExpandedItem() {
      if (!this.libraryItem || !this.libraryItem.id) return

      if (this.libraryItem.libraryFiles && this.libraryItem.libraryFiles.length) {
        this.expandedLibraryItem = null
        return
      }

      this.loadingItem = true
      try {
        const axios = this.$axios || this.$nuxt.$axios
        const data = await axios.$get(`/api/items/${this.libraryItem.id}?expanded=1`)
        if (data) {
          this.expandedLibraryItem = data
        }
      } catch (error) {
        console.error('Failed to fetch expanded library item', error)
        this.$toast.error('Failed to load library item details')
      } finally {
        this.loadingItem = false
      }
    },
    close() {
      this.show = false
    },
    handleGlobalKeyDown(e) {
      if (e.key === 'Escape') {
        this.close()
        e.preventDefault()
        e.stopPropagation()
      }
    },
    async confirmDelete() {
      if (!this.selectedInos.length) return
      this.loading = true
      try {
        // Delete selected inodes one by one
        for (const ino of this.selectedInos) {
          await this.$axios.$delete(`/api/items/${this.resolvedLibraryItem.id}/file/${ino}`)
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
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleGlobalKeyDown)
  }
}
</script>
