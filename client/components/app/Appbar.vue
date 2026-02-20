<template>
  <div class="w-full h-16 bg-primary relative">
    <div id="appbar" role="toolbar" aria-label="Appbar" class="absolute top-0 bottom-0 left-0 w-full h-full px-2 md:px-6 py-1 z-60">
      <div class="flex h-full items-center">
        <nuxt-link to="/">
          <img src="~static/icon.svg" :alt="$strings.ButtonHome" class="w-8 min-w-8 h-8 mr-2 sm:w-10 sm:min-w-10 sm:h-10 sm:mr-4" />
        </nuxt-link>

        <nuxt-link to="/">
          <h1 class="text-xl mr-6 hidden lg:block hover:underline">audiobookshelf</h1>
        </nuxt-link>

        <ui-libraries-dropdown class="mr-2" />

        <controls-global-search v-if="currentLibrary" class="mr-1 sm:mr-0" />
        <div class="grow" />

        <ui-tooltip v-if="isChromecastInitialized && !isHttps" direction="bottom" text="Casting requires a secure connection" class="flex items-center">
          <span class="material-symbols text-2xl text-warning/50"> cast </span>
        </ui-tooltip>
        <div v-if="isChromecastInitialized" class="w-6 min-w-6 h-6 ml-2 mr-1 sm:mx-2 cursor-pointer">
          <google-cast-launcher></google-cast-launcher>
        </div>

        <widgets-notification-widget class="hidden md:block" />

        <nuxt-link v-if="currentLibrary" to="/config/stats" class="hover:text-gray-200 cursor-pointer w-8 h-8 hidden sm:flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.HeaderYourStats" direction="bottom" class="flex items-center">
            <span class="material-symbols text-2xl" aria-label="User Stats" role="button">&#xe01d;</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link v-if="userCanUpload && currentLibrary" to="/upload" class="hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.ButtonUpload" direction="bottom" class="flex items-center">
            <span class="material-symbols text-2xl" aria-label="Upload Media" role="button">&#xf09b;</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link v-if="userIsAdminOrUp && currentLibrary" :to="`/config/libraries?edit=${currentLibrary.id}`" class="hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.HeaderUpdateLibrary" direction="bottom" class="flex items-center">
            <span class="material-symbols text-2xl" aria-label="Edit Library" role="button">&#xe3c9;</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link v-if="userIsAdminOrUp" to="/config" class="hover:text-gray-200 cursor-pointer w-8 h-8 flex items-center justify-center mx-1">
          <ui-tooltip :text="$strings.HeaderSettings" direction="bottom" class="flex items-center">
            <span class="material-symbols text-2xl" aria-label="System Settings" role="button">&#xe8b8;</span>
          </ui-tooltip>
        </nuxt-link>

        <nuxt-link to="/account" class="relative w-9 h-9 md:w-32 bg-fg border border-gray-500 rounded-sm shadow-xs ml-1.5 sm:ml-3 md:ml-5 md:pl-3 md:pr-10 py-2 text-left sm:text-sm cursor-pointer hover:bg-bg/40" aria-haspopup="listbox" aria-expanded="true">
          <span class="items-center hidden md:flex">
            <span class="block truncate">{{ username }}</span>
          </span>
          <span class="h-full md:ml-3 md:absolute inset-y-0 md:right-0 flex items-center justify-center md:pr-2 pointer-events-none">
            <span class="material-symbols text-xl text-gray-100">&#xe7fd;</span>
          </span>
        </nuxt-link>
      </div>
      <div v-show="numMediaItemsSelected" class="absolute top-0 left-0 w-full h-full px-4 bg-primary flex items-center">
        <h1 class="text-lg md:text-2xl px-4">{{ $getString('MessageItemsSelected', [numMediaItemsSelected]) }}</h1>
        <div class="grow" />
        <ui-btn v-if="!isPodcastLibrary && selectedMediaItemsArePlayable" color="bg-success" :padding-x="4" small class="flex items-center h-9 mr-2" @click="playSelectedItems">
          <span class="material-symbols fill text-2xl -ml-2 pr-1 text-white">play_arrow</span>
          {{ $strings.ButtonPlay }}
        </ui-btn>
        <ui-tooltip v-if="isBookLibrary" :text="selectedIsFinished ? $strings.MessageMarkAsNotFinished : $strings.MessageMarkAsFinished" direction="bottom">
          <ui-read-icon-btn :disabled="processingBatch" :is-read="selectedIsFinished" @click="toggleBatchRead" class="mx-1.5" />
        </ui-tooltip>
        <ui-tooltip v-if="userCanUpdate && isBookLibrary" :text="$strings.LabelAddToCollection" direction="bottom">
          <ui-icon-btn :disabled="processingBatch" icon="collections_bookmark" @click="batchAddToCollectionClick" class="mx-1.5" />
        </ui-tooltip>
        <template v-if="userCanUpdate">
          <ui-tooltip :text="$strings.LabelEdit" direction="bottom">
            <ui-icon-btn :disabled="processingBatch" icon="edit" bg-color="bg-warning" class="mx-1.5" @click="batchEditClick" />
          </ui-tooltip>
        </template>
        <ui-tooltip v-if="userCanDelete" :text="$strings.ButtonRemove" direction="bottom">
          <ui-icon-btn :disabled="processingBatch" icon="delete" bg-color="bg-error" class="mx-1.5" @click="batchDeleteClick" />
        </ui-tooltip>

        <ui-context-menu-dropdown v-if="contextMenuItems.length && !processingBatch" :items="contextMenuItems" class="ml-1" @action="contextMenuAction" />

        <ui-tooltip :text="$strings.LabelDeselectAll" direction="bottom" class="flex items-center">
          <span class="material-symbols text-3xl px-4 hover:text-gray-100 cursor-pointer" :class="processingBatch ? 'text-gray-400' : ''" @click="cancelSelectionMode">close</span>
        </ui-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      totalEntities: 0
    }
  },
  computed: {
    currentLibrary() {
      return this.$store.getters['libraries/getCurrentLibrary']
    },
    libraryName() {
      return this.currentLibrary ? this.currentLibrary.name : 'unknown'
    },
    libraryMediaType() {
      return this.currentLibrary ? this.currentLibrary.mediaType : null
    },
    isPodcastLibrary() {
      return this.libraryMediaType === 'podcast'
    },
    isBookLibrary() {
      return this.libraryMediaType === 'book'
    },
    isHome() {
      return this.$route.name === 'library-library'
    },
    user() {
      return this.$store.state.user.user
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    username() {
      return this.user ? this.user.username : 'err'
    },
    numMediaItemsSelected() {
      return this.selectedMediaItems.length
    },
    selectedMediaItems() {
      return this.$store.state.globals.selectedMediaItems || []
    },
    isItemPage() {
      return this.$route.name === 'item-id'
    },
    isBookshelfPage() {
      const bookshelfRoutes = ['library-library-bookshelf', 'library-library-series', 'library-library-collections', 'library-library-playlists', 'library-library-authors', 'library-library']
      return bookshelfRoutes.includes(this.$route.name)
    },
    selectedMediaItemsArePlayable() {
      return !this.selectedMediaItems.some((i) => !i.hasTracks)
    },
    userMediaProgress() {
      return this.$store.state.user.user.mediaProgress || []
    },
    userCanUpdate() {
      return this.$store.getters['user/getUserCanUpdate']
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    },
    userCanUpload() {
      return this.$store.getters['user/getUserCanUpload']
    },
    selectedIsFinished() {
      // Find an item that is not finished, if none then all items finished
      return !this.selectedMediaItems.find((item) => {
        const itemProgress = this.userMediaProgress.find((lip) => lip.libraryItemId === item.id)
        return !itemProgress || !itemProgress.isFinished
      })
    },
    processingBatch() {
      return this.$store.state.processingBatch
    },
    isChromecastEnabled() {
      return this.$store.getters['getServerSetting']('chromecastEnabled')
    },
    isChromecastInitialized() {
      return this.$store.state.globals.isChromecastInitialized
    },
    isHttps() {
      return location.protocol === 'https:' || process.env.NODE_ENV === 'development'
    },
    contextMenuItems() {
      if (!this.userIsAdminOrUp) return []

      const options = [
        {
          text: this.$strings.ButtonQuickMatch,
          action: 'quick-match'
        }
      ]

      if (!this.isPodcastLibrary && this.selectedMediaItemsArePlayable) {
        options.push({
          text: this.$strings.ButtonQuickEmbedMetadata,
          action: 'quick-embed'
        })
      }

      options.push({
        text: this.$strings.ButtonReScan,
        action: 'rescan'
      })

      options.push({
        text: 'Reset Metadata',
        action: 'reset-metadata'
      })

      // The limit of 50 is introduced because of the URL length. Each id has 36 chars, so 36 * 40 = 1440
      // + 40 , separators = 1480 chars + base path 280 chars = 1760 chars. This keeps the URL under 2000 chars even with longer domains
      if (this.selectedMediaItems.length <= 40) {
        options.push({
          text: this.$strings.LabelDownload,
          action: 'download'
        })
      }

      // Move to library option - only show if user has delete permission (same as delete)
      if (this.userCanDelete) {
        options.push({
          text: this.$strings.LabelMoveToLibrary,
          action: 'move-to-library'
        })

        // Merge option - only for books and if multiple selected
        if (this.isBookLibrary && this.selectedMediaItems.length > 1) {
          options.push({
            text: this.$strings.LabelMerge,
            action: 'merge'
          })
        }

        if (this.isBookLibrary) {
          options.push({
            text: 'Consolidate',
            action: 'consolidate'
          })
        }
      }

      return options
    }
  },
  methods: {
    requestBatchQuickEmbed() {
      const payload = {
        message: this.$strings.MessageConfirmQuickEmbed,
        callback: (confirmed) => {
          if (confirmed) {
            this.$axios
              .$post(`/api/tools/batch/embed-metadata`, {
                libraryItemIds: this.selectedMediaItems.map((i) => i.id)
              })
              .then(() => {
                console.log('Audio metadata embed started')
                this.cancelSelectionMode()
              })
              .catch((error) => {
                console.error('Audio metadata embed failed', error)
                const errorMsg = error.response.data || 'Failed to embed metadata'
                this.$toast.error(errorMsg)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    contextMenuAction({ action }) {
      if (action === 'quick-embed') {
        this.requestBatchQuickEmbed()
      } else if (action === 'quick-match') {
        this.batchAutoMatchClick()
      } else if (action === 'rescan') {
        this.batchRescan()
      } else if (action === 'download') {
        this.batchDownload()
      } else if (action === 'move-to-library') {
        this.batchMoveToLibrary()
      } else if (action === 'merge') {
        this.batchMerge()
      } else if (action === 'consolidate') {
        this.batchConsolidate()
      } else if (action === 'reset-metadata') {
        this.batchResetMetadata()
      }
    },
    batchConsolidate() {
      const payload = {
        message: this.$getString('MessageConfirmConsolidate', [this.$getString('MessageItemsSelected', [this.numMediaItemsSelected]), 'Author - Title']),
        checkboxLabel: 'Merge contents on conflict',
        checkboxType: 'checkbox',
        callback: (confirmed, merge) => {
          if (confirmed) {
            this.$store.commit('setProcessingBatch', true)
            this.$axios
              .$post('/api/items/batch/consolidate', {
                libraryItemIds: this.selectedMediaItems.map((i) => i.id),
                merge
              })
              .then((data) => {
                if (data.success) {
                  this.$toast.success(this.$strings.ToastBatchConsolidateSuccess)
                } else {
                  const numFailed = data.results.filter((r) => !r.success).length
                  this.$toast.warning(`${numFailed} items failed to consolidate. They may already exist or have other errors.`)
                }

                if (this.numMediaItemsSelected === 1 && data.success) {
                  this.$router.push(`/item/${this.selectedMediaItems[0].id}`)
                }
                this.cancelSelectionMode()
              })
              .catch((error) => {
                console.error('Batch consolidation failed', error)
                const errorMsg = error.response?.data || this.$strings.ToastBatchConsolidateFailed
                this.$toast.error(errorMsg)
              })
              .finally(() => {
                this.$store.commit('setProcessingBatch', false)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    batchResetMetadata() {
      const payload = {
        message: `Are you sure you want to reset metadata for ${this.numMediaItemsSelected} items? This will remove metadata files and re-scan the items from files.`,
        callback: (confirmed) => {
          if (confirmed) {
            this.$store.commit('setProcessingBatch', true)
            this.$axios
              .$post('/api/items/batch/reset-metadata', {
                libraryItemIds: this.selectedMediaItems.map((i) => i.id)
              })
              .then(() => {
                this.$toast.success('Batch reset metadata successful')
                this.cancelSelectionMode()
              })
              .catch((error) => {
                console.error('Batch reset metadata failed', error)
                const errorMsg = error.response?.data || 'Batch reset metadata failed'
                this.$toast.error(errorMsg)
              })
              .finally(() => {
                this.$store.commit('setProcessingBatch', false)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    batchMerge() {
      const payload = {
        message: this.$strings.MessageConfirmBatchMerge,
        callback: (confirmed) => {
          if (confirmed) {
            const libraryItemIds = this.selectedMediaItems.map((i) => i.id)
            this.$store.commit('setProcessingBatch', true)
            this.$axios
              .$post('/api/items/batch/merge', { libraryItemIds })
              .then((data) => {
                if (data.success) {
                  this.$toast.success(this.$strings.ToastBatchMergeSuccess)
                  if (data.mergedItemId) {
                    this.$router.push(`/item/${data.mergedItemId}`)
                  }
                } else {
                  this.$toast.warning(this.$strings.ToastBatchMergePartiallySuccess)
                }
                this.$store.commit('globals/resetSelectedMediaItems', [])
                this.$eventBus.$emit('bookshelf_clear_selection')
              })
              .catch((error) => {
                console.error('Batch merge failed', error)
                const errorMsg = error.response.data || this.$strings.ToastBatchMergeFailed
                this.$toast.error(errorMsg)
              })
              .finally(() => {
                this.$store.commit('setProcessingBatch', false)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    batchMoveToLibrary() {
      // Clear any single library item that might be lingering
      this.$store.commit('setSelectedLibraryItem', null)
      // Open the move to library modal - it will pick up items from selectedMediaItems
      this.$store.commit('globals/setShowMoveToLibraryModal', true)
    },
    async batchRescan() {
      const payload = {
        message: this.$getString('MessageConfirmReScanLibraryItems', [this.selectedMediaItems.length]),
        callback: (confirmed) => {
          if (confirmed) {
            this.$axios
              .$post(`/api/items/batch/scan`, {
                libraryItemIds: this.selectedMediaItems.map((i) => i.id)
              })
              .then(() => {
                console.log('Batch Re-Scan started')
                this.cancelSelectionMode()
              })
              .catch((error) => {
                console.error('Batch Re-Scan failed', error)
                const errorMsg = error.response.data || 'Failed to batch re-scan'
                this.$toast.error(errorMsg)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    async batchDownload() {
      const libraryItemIds = this.selectedMediaItems.map((i) => i.id)
      console.log('Downloading library items', libraryItemIds)
      this.$downloadFile(`/api/libraries/${this.$store.state.libraries.currentLibraryId}/download?token=${this.$store.getters['user/getToken']}&ids=${libraryItemIds.join(',')}`)
    },
    async playSelectedItems() {
      this.$store.commit('setProcessingBatch', true)

      const libraryItemIds = this.selectedMediaItems.map((i) => i.id)
      const libraryItems = await this.$axios
        .$post(`/api/items/batch/get`, { libraryItemIds })
        .then((res) => res.libraryItems)
        .catch((error) => {
          const errorMsg = error.response.data || 'Failed to get items'
          console.error(errorMsg, error)
          this.$toast.error(errorMsg)
          return []
        })

      if (!libraryItems.length) {
        this.$store.commit('setProcessingBatch', false)
        return
      }

      const queueItems = []
      libraryItems.forEach((item) => {
        let subtitle = ''
        if (item.mediaType === 'book') subtitle = item.media.metadata.authors.map((au) => au.name).join(', ')
        queueItems.push({
          libraryItemId: item.id,
          libraryId: item.libraryId,
          episodeId: null,
          title: item.media.metadata.title,
          subtitle,
          caption: '',
          duration: item.media.duration || null,
          coverPath: item.media.coverPath || null
        })
      })

      this.$eventBus.$emit('play-item', {
        libraryItemId: queueItems[0].libraryItemId,
        queueItems
      })
      this.$store.commit('setProcessingBatch', false)
      this.$store.commit('globals/resetSelectedMediaItems', [])
      this.$eventBus.$emit('bookshelf_clear_selection')
    },
    cancelSelectionMode() {
      if (this.processingBatch) return
      this.$store.commit('globals/resetSelectedMediaItems', [])
      this.$eventBus.$emit('bookshelf_clear_selection')
    },
    toggleBatchRead() {
      this.$store.commit('setProcessingBatch', true)
      const newIsFinished = !this.selectedIsFinished
      const updateProgressPayloads = this.selectedMediaItems.map((item) => {
        return {
          libraryItemId: item.id,
          isFinished: newIsFinished
        }
      })
      console.log('Progress payloads', updateProgressPayloads)
      this.$axios
        .patch(`/api/me/progress/batch/update`, updateProgressPayloads)
        .then(() => {
          this.$toast.success(this.$strings.ToastBatchUpdateSuccess)
          this.$store.commit('setProcessingBatch', false)
          this.$store.commit('globals/resetSelectedMediaItems', [])
          this.$eventBus.$emit('bookshelf_clear_selection')
        })
        .catch((error) => {
          this.$toast.error(this.$strings.ToastBatchUpdateFailed)
          console.error('Failed to batch update read/not read', error)
          this.$store.commit('setProcessingBatch', false)
        })
    },
    batchDeleteClick() {
      const payload = {
        message: this.$getString('MessageConfirmDeleteLibraryItems', [this.numMediaItemsSelected]),
        checkboxLabel: this.$strings.LabelDeleteFromFileSystemCheckbox,
        yesButtonText: this.$strings.ButtonDelete,
        yesButtonColor: 'error',
        checkboxDefaultValue: !Number(localStorage.getItem('softDeleteDefault') || 0),
        callback: (confirmed, hardDelete) => {
          if (confirmed) {
            localStorage.setItem('softDeleteDefault', hardDelete ? 0 : 1)

            this.$store.commit('setProcessingBatch', true)

            this.$axios
              .$post(`/api/items/batch/delete?hard=${hardDelete ? 1 : 0}`, {
                libraryItemIds: this.selectedMediaItems.map((i) => i.id)
              })
              .then(() => {
                this.$toast.success(this.$strings.ToastBatchDeleteSuccess)
                this.$store.commit('globals/resetSelectedMediaItems', [])
                this.$eventBus.$emit('bookshelf_clear_selection')
              })
              .catch((error) => {
                console.error('Batch delete failed', error)
                this.$toast.error(this.$strings.ToastBatchDeleteFailed)
              })
              .finally(() => {
                this.$store.commit('setProcessingBatch', false)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    batchEditClick() {
      this.$router.push('/batch')
    },
    batchAddToCollectionClick() {
      this.$store.commit('globals/setShowBatchCollectionsModal', true)
    },
    setBookshelfTotalEntities(totalEntities) {
      this.totalEntities = totalEntities
    },
    batchAutoMatchClick() {
      this.$store.commit('globals/setShowBatchQuickMatchModal', true)
    },
    handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return
      }

      const ctrlOrMeta = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey

      if (ctrlOrMeta && e.key === 'a') {
        if (this.isBookshelfPage) {
          e.preventDefault()
          this.$eventBus.$emit('bookshelf_select_all')
        }
      } else if (ctrlOrMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (this.numMediaItemsSelected > 0) {
          this.batchConsolidate()
        } else if (this.isItemPage) {
          this.$eventBus.$emit('item_shortcut_consolidate')
        }
      } else if (ctrlOrMeta && !shift && e.key.toLowerCase() === 'm') {
        if (this.numMediaItemsSelected > 1) {
          e.preventDefault()
          this.batchMerge()
        }
      } else if (ctrlOrMeta && shift && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        if (this.numMediaItemsSelected > 0) {
          this.batchMoveToLibrary()
        } else if (this.isItemPage) {
          this.$eventBus.$emit('item_shortcut_move')
        }
      } else if (alt && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        if (this.numMediaItemsSelected > 0) {
          this.batchResetMetadata()
        } else if (this.isItemPage) {
          this.$eventBus.$emit('item_shortcut_reset')
        }
      }
    }
  },
  mounted() {
    this.$eventBus.$on('bookshelf-total-entities', this.setBookshelfTotalEntities)
    window.addEventListener('keydown', this.handleKeyDown)
  },
  beforeDestroy() {
    this.$eventBus.$off('bookshelf-total-entities', this.setBookshelfTotalEntities)
    window.removeEventListener('keydown', this.handleKeyDown)
  }
}
</script>

<style>
#appbar {
  box-shadow: 0px 5px 5px #11111155;
}
</style>
