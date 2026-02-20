<template>
  <modals-modal ref="modal" v-model="show" name="move-to-library" :width="500" :height="'unset'" :processing="processing" @submit="moveItems">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ $strings.LabelMoveToLibrary }}</p>
      </div>
    </template>
    <div class="px-6 py-8 w-full text-sm rounded-lg bg-bg shadow-lg border border-black-300 overflow-y-auto overflow-x-hidden" style="max-height: 80vh">
      <template v-if="hasItems">
        <div class="w-full mb-4">
          <p class="text-gray-300 mb-2">{{ isBatchMode ? $strings.LabelMovingItems : $strings.LabelMovingItem }}:</p>
          <p v-if="isBatchMode" class="text-lg font-semibold text-white">{{ $getString('MessageItemsSelected', [selectedItems.length]) }}</p>
          <p v-else class="text-lg font-semibold text-white">{{ itemTitle }}</p>
        </div>

        <template v-if="targetLibraries.length">
          <!-- Library shortcut buttons -->
          <div class="w-full mb-4">
            <label class="px-1 text-sm font-semibold block mb-2">{{ $strings.LabelSelectTargetLibrary }}</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="lib in libraryShortcuts"
                :key="lib.id"
                class="library-shortcut-btn"
                :class="{ 'active': selectedLibraryId === lib.id }"
                @click="selectLibrary(lib)"
              >
                <span>{{ lib.before }}</span><span class="shortcut-char">{{ lib.shortcutChar }}</span><span>{{ lib.after }}</span>
              </button>
            </div>
          </div>

          <!-- Folder picker (only when selected library has multiple folders) -->
          <div v-if="selectedLibraryFolders.length > 1" class="w-full mb-4">
            <label class="px-1 text-sm font-semibold block mb-1">{{ $strings.LabelSelectTargetFolder }}</label>
            <ui-dropdown v-model="selectedFolderId" :items="folderOptions" />
          </div>
        </template>

        <template v-else>
          <div class="w-full py-4">
            <p class="text-warning text-center">{{ $strings.MessageNoCompatibleLibraries }}</p>
          </div>
        </template>
      </template>

      <div class="flex items-center pt-4">
        <div class="grow" />
        <ui-btn v-if="targetLibraries.length && hasItems" color="success" :disabled="!selectedLibraryId" small @click="moveItems">{{ $strings.ButtonMove }}</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {
      processing: false,
      selectedLibraryId: null,
      selectedFolderId: null
    }
  },
  watch: {
    show: {
      handler(newVal) {
        if (newVal) {
          this.init()
          window.addEventListener('keydown', this.keydownHandler)
        } else {
          window.removeEventListener('keydown', this.keydownHandler)
        }
      }
    },
    selectedLibraryId() {
      // Reset folder selection when library changes
      if (this.selectedLibraryFolders.length) {
        this.selectedFolderId = this.selectedLibraryFolders[0].id
      } else {
        this.selectedFolderId = null
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showMoveToLibraryModal
      },
      set(val) {
        this.$store.commit('globals/setShowMoveToLibraryModal', val)
      }
    },
    // Single item mode (from context menu on a single item)
    libraryItem() {
      return this.$store.state.selectedLibraryItem
    },
    // Batch mode (from batch selection)
    selectedItems() {
      return this.$store.state.globals.selectedMediaItems || []
    },
    isBatchMode() {
      // Use batch mode if we have multiple selected items OR no single item selected
      return this.selectedItems.length > 0 && !this.libraryItem
    },
    hasItems() {
      return this.isBatchMode ? this.selectedItems.length > 0 : !!this.libraryItem
    },
    itemTitle() {
      return this.libraryItem?.media?.title || this.libraryItem?.media?.metadata?.title || ''
    },
    currentLibraryId() {
      if (this.isBatchMode && this.selectedItems.length > 0) {
        return this.selectedItems[0].libraryId
      }
      return this.libraryItem?.libraryId || this.$store.state.libraries.currentLibraryId
    },
    currentMediaType() {
      if (this.isBatchMode && this.selectedItems.length > 0) {
        return this.selectedItems[0].mediaType
      }
      return this.libraryItem?.mediaType || 'book'
    },
    targetLibraries() {
      // Filter libraries to only show compatible ones (same media type, different library)
      return this.$store.state.libraries.libraries.filter((l) => l.mediaType === this.currentMediaType && l.id !== this.currentLibraryId)
    },
    libraryShortcuts() {
      const used = new Set()
      return this.targetLibraries.map((lib) => {
        const name = lib.name
        let shortcutIndex = -1
        for (let i = 0; i < name.length; i++) {
          const letter = name[i].toLowerCase()
          if (/[a-z]/.test(letter) && !used.has(letter)) {
            used.add(letter)
            shortcutIndex = i
            break
          }
        }
        if (shortcutIndex === -1) {
          return { id: lib.id, name, before: name, shortcutChar: '', after: '', shortcutKey: null, folders: lib.folders || [] }
        }
        return {
          id: lib.id,
          name,
          before: name.slice(0, shortcutIndex),
          shortcutChar: name[shortcutIndex],
          after: name.slice(shortcutIndex + 1),
          shortcutKey: name[shortcutIndex].toLowerCase(),
          folders: lib.folders || []
        }
      })
    },
    selectedLibrary() {
      return this.targetLibraries.find((l) => l.id === this.selectedLibraryId)
    },
    selectedLibraryFolders() {
      return this.selectedLibrary?.folders || []
    },
    folderOptions() {
      return this.selectedLibraryFolders.map((folder) => ({
        text: folder.fullPath,
        value: folder.id
      }))
    }
  },
  methods: {
    keydownHandler(e) {
      // Ignore events when a form element inside the modal is focused (e.g., folder dropdown)
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return

      const key = e.key.toLowerCase()
      const match = this.libraryShortcuts.find((lib) => lib.shortcutKey === key)
      if (match) {
        e.preventDefault()
        this.selectLibrary(match)
      }
    },
    selectLibrary(lib) {
      this.selectedLibraryId = lib.id
      // Auto-trigger move if only one folder
      const folders = lib.folders || this.selectedLibraryFolders
      if (folders.length <= 1) {
        this.$nextTick(() => this.moveItems())
      }
    },
    async moveItems() {
      if (!this.selectedLibraryId) return

      const payload = {
        targetLibraryId: this.selectedLibraryId
      }

      if (this.selectedFolderId && this.selectedLibraryFolders.length > 1) {
        payload.targetFolderId = this.selectedFolderId
      }

      this.processing = true
      try {
        if (this.isBatchMode) {
          // Batch move
          payload.libraryItemIds = this.selectedItems.map((i) => i.id)
          const response = await this.$axios.$post('/api/items/batch/move', payload)
          if (response.successCount > 0) {
            this.$toast.success(this.$getString('ToastItemsMoved', [response.successCount]))
          }
          if (response.failCount > 0) {
            this.$toast.warning(this.$getString('ToastItemsMoveFailed', [response.failCount]))
          }
          // Clear selection after batch move
          this.$store.commit('globals/resetSelectedMediaItems')
        } else {
          // Single item move
          const response = await this.$axios.$post(`/api/items/${this.libraryItem.id}/move`, payload)
          if (response.success) {
            this.$toast.success(this.$strings.ToastItemMoved)
            this.$store.commit('setSelectedLibraryItem', null)
          }
        }
        this.show = false
      } catch (error) {
        console.error('Failed to move item(s)', error)
        const errorMsg = error.response?.data || this.$strings.ToastItemMoveFailed
        this.$toast.error(errorMsg)
      } finally {
        this.processing = false
      }
    },
    init() {
      this.selectedLibraryId = null
      this.selectedFolderId = null
      // Pre-select first available library if any
      if (this.targetLibraries.length) {
        this.selectedLibraryId = this.targetLibraries[0].id
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.keydownHandler)
  }
}
</script>

<style scoped>
.library-shortcut-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.4rem 0.9rem;
  border-radius: 0.375rem;
  border: 1px solid #4b5563;
  background-color: #1f2937;
  color: #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.library-shortcut-btn:hover {
  background-color: #374151;
  border-color: #6b7280;
  color: #f9fafb;
}
.library-shortcut-btn.active {
  background-color: #1e3a5f;
  border-color: #3b82f6;
  color: #93c5fd;
}
.shortcut-char {
  text-decoration: underline;
  color: #60a5fa;
  font-weight: 600;
}
.library-shortcut-btn.active .shortcut-char {
  color: #bfdbfe;
}
</style>
