<template>
  <modals-modal ref="modal" v-model="show" name="move-to-library" :width="400" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ $strings.LabelMoveToLibrary }}</p>
      </div>
    </template>
    <div class="px-6 py-8 w-full text-sm rounded-lg bg-bg shadow-lg border border-black-300 overflow-y-auto overflow-x-hidden" style="max-height: 80vh">
      <template v-if="libraryItem">
        <div class="w-full mb-4">
          <p class="text-gray-300 mb-2">{{ $strings.LabelMovingItem }}:</p>
          <p class="text-lg font-semibold text-white">{{ itemTitle }}</p>
        </div>

        <template v-if="targetLibraries.length">
          <div class="w-full mb-4">
            <label class="px-1 text-sm font-semibold block mb-1">{{ $strings.LabelSelectTargetLibrary }}</label>
            <ui-dropdown v-model="selectedLibraryId" :items="libraryOptions" />
          </div>

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
        <ui-btn v-if="targetLibraries.length" color="success" :disabled="!selectedLibraryId" small @click="moveItem">{{ $strings.ButtonMove }}</ui-btn>
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
    libraryItem() {
      return this.$store.state.selectedLibraryItem
    },
    itemTitle() {
      return this.libraryItem?.media?.title || this.libraryItem?.media?.metadata?.title || ''
    },
    currentLibraryId() {
      return this.libraryItem?.libraryId
    },
    currentMediaType() {
      // Get media type from the current library
      const currentLibrary = this.$store.state.libraries.libraries.find((l) => l.id === this.currentLibraryId)
      return currentLibrary?.mediaType || 'book'
    },
    targetLibraries() {
      // Filter libraries to only show compatible ones (same media type, different library)
      return this.$store.state.libraries.libraries.filter((l) => l.mediaType === this.currentMediaType && l.id !== this.currentLibraryId)
    },
    libraryOptions() {
      return this.targetLibraries.map((lib) => ({
        text: lib.name,
        value: lib.id
      }))
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
    async moveItem() {
      if (!this.selectedLibraryId) return

      const payload = {
        targetLibraryId: this.selectedLibraryId
      }

      if (this.selectedFolderId && this.selectedLibraryFolders.length > 1) {
        payload.targetFolderId = this.selectedFolderId
      }

      this.processing = true
      try {
        const response = await this.$axios.$post(`/api/items/${this.libraryItem.id}/move`, payload)
        if (response.success) {
          this.$toast.success(this.$strings.ToastItemMoved)
          this.show = false
        }
      } catch (error) {
        console.error('Failed to move item', error)
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
  mounted() {}
}
</script>
