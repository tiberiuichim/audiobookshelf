<template>
  <div
    class="book-list-row w-full relative"
    :class="isHovering ? 'bg-white/5' : ''"
    @mouseover="onMouseover"
    @mouseleave="onMouseleave"
  >
    <div class="flex items-center px-2 md:px-4 py-1" :style="{ height: rowHeight + 'px' }">
      <div v-if="isSelectionMode" class="w-8 min-w-8 flex items-center justify-center">
        <ui-checkbox :checked="isSelected" @input="toggleSelect" />
      </div>

      <div class="flex items-center min-w-0 flex-1 h-full">
        <div
          class="flex-shrink-0 relative cursor-pointer"
          :style="{ width: coverWidth + 'px', height: coverHeight + 'px' }"
          @click="navigateToItem"
        >
          <covers-book-cover :library-item="libraryItem" :width="coverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" />
          <div v-if="isMissing || isInvalid" class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-sm">
            <span class="material-symbols text-red-400 text-xs md:text-sm">{{ isMissing ? 'warning' : 'error' }}</span>
          </div>
          <div v-if="ebookFormat" class="absolute bottom-0 left-0 bg-black/60 rounded-br-sm px-1">
            <span class="text-white/80 text-[10px] leading-tight">{{ ebookFormat }}</span>
          </div>
        </div>

        <div class="ml-2 md:ml-3 flex-1 min-w-0 flex items-center h-full">
          <div class="min-w-0 flex-1">
            <nuxt-link
              :to="`/item/${libraryItem.id}`"
              class="truncate block hover:underline text-sm md:text-base font-medium"
              :class="{ 'text-gray-400': isMissing || isInvalid }"
            >
              {{ bookTitle }}
            </nuxt-link>
            <div v-if="authorName" class="text-xs text-gray-300 truncate">
              <a href="#" class="hover:underline" @click.prevent="navigateToFirstAuthor">{{ authorName }}</a>
            </div>
            <div class="flex items-center gap-1 text-[11px] text-gray-400 truncate">
              <template v-if="seriesList.length">
                <template v-for="(_series, index) in seriesList">
                  <nuxt-link :key="_series.id" :to="`/library/${libraryItem.libraryId}/series/${_series.id}`" class="hover:underline truncate">{{ _series.text }}</nuxt-link>
                  <span :key="_series.id + '-comma'" v-if="index < seriesList.length - 1">,</span>
                </template>
                <span> · </span>
              </template>
              <template v-if="narratorList">
                <span>{{ narratorList }}</span>
                <span> · </span>
              </template>
              <template v-if="publishedYear">
                <span>{{ publishedYear }}</span>
              </template>
            </div>
          </div>

          <div class="hidden lg:flex items-center ml-4 flex-shrink-0 gap-4">
            <span v-if="durationText" class="text-xs text-gray-400 whitespace-nowrap">{{ durationText }}</span>
            <div v-if="itemProgress && !isPodcast" class="flex items-center gap-2">
              <div class="w-12 h-1 bg-bg3 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="{ width: progressPercent + '%' }" />
              </div>
              <span v-if="progressPercent > 0 && progressPercent < 100" class="text-xs text-gray-400">{{ progressPercent }}%</span>
              <span v-else-if="userIsFinished" class="material-symbols text-xs text-green-400">check_circle</span>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex items-center flex-shrink-0 h-full transition-opacity duration-150"
        :class="isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      >
        <button
          v-if="showPlayBtn"
          class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 mx-1"
          @click.stop="playClick"
        >
          <span class="material-symbols fill text-lg">play_arrow</span>
        </button>

        <ui-tooltip v-if="!isPodcast" :text="userIsFinished ? $strings.MessageMarkAsNotFinished : $strings.MessageMarkAsFinished" direction="top">
          <ui-read-icon-btn :disabled="isProcessingReadUpdate" :is-read="userIsFinished" borderless class="mx-1" @click="toggleFinished" />
        </ui-tooltip>

        <div v-if="userCanUpdate" class="mx-1">
          <ui-icon-btn icon="edit" borderless @click="clickEdit" />
        </div>

        <div v-if="moreMenuItems.length" class="mx-1" ref="moreIcon">
          <ui-icon-btn icon="more_vert" borderless @click.stop="clickShowMore" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import MoreMenu from '@/components/widgets/MoreMenu'

export default {
  props: {
    libraryItem: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    bookCoverAspectRatio: {
      type: Number,
      default: 1.6
    }
  },
  data() {
    return {
      isHovering: false,
      isProcessingReadUpdate: false,
      isMoreMenuOpen: false
    }
  },
  computed: {
    media() {
      return this.libraryItem.media || {}
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    tracks() {
      return this.media.tracks || []
    },
    bookTitle() {
      return this.mediaMetadata.title || this.libraryItem.path || ''
    },
    authorName() {
      return this.mediaMetadata.authorName || ''
    },
    series() {
      return this.mediaMetadata.series || []
    },
    seriesList() {
      return this.series.map((se) => {
        let text = se.name
        if (se.sequence) text += ` #${se.sequence}`
        return { ...se, text }
      })
    },
    isPodcast() {
      return this.libraryItem.mediaType === 'podcast'
    },
    isMissing() {
      return this.libraryItem.isMissing
    },
    isInvalid() {
      return this.libraryItem.isInvalid
    },
    isStreaming() {
      return this.$store.getters['getLibraryItemIdStreaming'] === this.libraryItem.id
    },
    showPlayBtn() {
      return !this.isMissing && !this.isInvalid && !this.isStreaming && this.tracks.length > 0
    },
    itemProgress() {
      return this.$store.getters['user/getUserMediaProgress'](this.libraryItem.id)
    },
    userIsFinished() {
      return this.itemProgress ? !!this.itemProgress.isFinished : false
    },
    progressPercent() {
      if (!this.itemProgress || !this.media.duration) return 0
      const progress = this.itemProgress.progress || 0
      return Math.min(100, Math.round((progress / this.media.duration) * 100))
    },
    durationText() {
      if (this.isPodcast) {
        const numEpisodes = this.media.numEpisodes || this.tracks.length
        return numEpisodes ? `${numEpisodes} episodes` : ''
      }
      return this.media.duration ? this.$elapsedPretty(this.media.duration) : ''
    },
    coverSize() {
      return this.$store.state.globals.isMobile ? 22 : 32
    },
    coverWidth() {
      if (this.bookCoverAspectRatio === 1) return this.coverSize * 1.6
      return this.coverSize
    },
    coverHeight() {
      return this.coverSize * (this.bookCoverAspectRatio === 1 ? 1.6 : this.bookCoverAspectRatio)
    },
    rowHeight() {
      return Math.max(44, this.coverHeight + 12)
    },
    ebookFormat() {
      return this.mediaMetadata.ebookFormat || null
    },
    narratorList() {
      const narrators = this.mediaMetadata.narrators || []
      return narrators.length ? narrators.join(', ') : ''
    },
    publishedYear() {
      return this.mediaMetadata.publishedYear || ''
    },
    userCanUpdate() {
      return this.$store.getters['user/getUserCanUpdate']
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    isSelected() {
      return this.selectedMediaItems.some((i) => i.id === this.libraryItem.id)
    },
    isSelectionMode() {
      return this.$store.getters['globals/getIsBatchSelectingMediaItems']
    },
    selectedMediaItems() {
      return this.$store.state.globals.selectedMediaItems || []
    },
    numTracks() {
      return this.tracks.length
    },
    moreMenuItems() {
      const items = []

      if (this.userCanUpdate) {
        items.push({
          func: 'edit-details',
          text: this.$strings.HeaderDetails
        })
      }

      if (this.userCanUpdate) {
        items.push({
          func: 'edit-files',
          text: this.$strings.HeaderFiles
        })
      }

      if (this.userIsAdminOrUp) {
        items.push({
          func: 'match',
          text: this.$strings.HeaderMatch
        })
      }

      if (!this.isPodcast && this.userCanUpdate) {
        items.push({
          func: 'collections',
          text: this.$strings.LabelAddToCollection
        })
      }

      if (this.numTracks) {
        items.push({
          func: 'playlists',
          text: this.$strings.LabelAddToPlaylist
        })
      }

      if (this.userIsAdminOrUp && this.numTracks) {
        items.push({
          func: 'share',
          text: this.$strings.LabelShare
        })
      }

      if (this.ebookFormat && this.$store.state.libraries.ereaderDevices?.length) {
        items.push({
          text: this.$strings.LabelSendEbookToDevice,
          subitems: this.$store.state.libraries.ereaderDevices.map((d) => ({
            text: d.name,
            func: 'send-device',
            data: d.name
          }))
        })
      }

      if (this.libraryItem.rssFeed) {
        items.push({
          func: 'rss-feed',
          text: this.$strings.LabelOpenRSSFeed
        })
      }

      if (this.userCanDelete) {
        items.push({
          func: 'delete',
          text: this.$strings.ButtonDelete
        })
      }

      return items
    }
  },
  methods: {
    onMouseover() {
      this.isHovering = true
    },
    onMouseleave() {
      this.isHovering = false
    },
    moreMenuAction({ action, data }) {
      switch (action) {
        case 'edit-details':
          this.$store.commit('showEditModalOnTab', { libraryItem: this.libraryItem, tab: 'details' })
          break
        case 'edit-files':
          this.$store.commit('showEditModalOnTab', { libraryItem: this.libraryItem, tab: 'files' })
          break
        case 'match':
          this.$store.commit('showEditModalOnTab', { libraryItem: this.libraryItem, tab: 'match' })
          break
        case 'collections':
          this.$store.commit('setSelectedLibraryItem', this.libraryItem)
          this.$store.commit('globals/setShowCollectionsModal', true)
          break
        case 'playlists':
          this.$store.commit('globals/setSelectedPlaylistItems', [{ libraryItem: this.libraryItem, episode: null }])
          this.$store.commit('globals/setShowPlaylistsModal', true)
          break
        case 'share':
          this.$store.commit('setSelectedLibraryItem', this.libraryItem)
          this.$store.commit('globals/setShareModal', null)
          break
        case 'send-device':
          this.$axios
            .$post(`/api/libraries/${this.libraryItem.libraryId}/send-to-device`, {
              libraryItemId: this.libraryItem.id,
              deviceName: data
            })
            .then(() => this.$toast.success(this.$strings.ToastSendToDeviceSuccess))
            .catch((error) => {
              console.error('Failed to send to device', error)
              this.$toast.error(this.$strings.ToastSendToDeviceFailed)
            })
          break
        case 'rss-feed':
          this.$store.commit('globals/setRSSFeedOpenCloseModal', {
            id: this.libraryItem.id,
            name: this.bookTitle,
            type: 'book',
            feed: this.libraryItem.rssFeed
          })
          break
        case 'delete':
          this.showDeleteConfirm()
          break
      }
    },
    showDeleteConfirm() {
      const payload = {
        message: this.$strings.MessageConfirmDeleteLibraryItem,
        checkboxLabel: this.$strings.LabelDeleteFromFileSystemCheckbox,
        yesButtonText: this.$strings.ButtonDelete,
        yesButtonColor: 'error',
        checkboxDefaultValue: !Number(localStorage.getItem('softDeleteDefault') || 0),
        callback: (confirmed, hardDelete) => {
          if (confirmed) {
            localStorage.setItem('softDeleteDefault', hardDelete ? 0 : 1)
            this.$axios
              .$delete(`/api/items/${this.libraryItem.id}?hard=${hardDelete ? 1 : 0}`)
              .then(() => this.$toast.success(this.$strings.ToastItemDeletedSuccess))
              .catch((error) => {
                console.error('Failed to delete item', error)
                this.$toast.error(this.$strings.ToastItemDeletedFailed)
              })
          }
        },
        type: 'yesNo'
      }
      this.$store.commit('globals/setConfirmPrompt', payload)
    },
    async navigateToFirstAuthor() {
      const name = (this.authorName || '').split(',')[0]?.trim()
      if (!name) return
      try {
        const authors = await this.$axios.$get(`/api/libraries/${this.libraryItem.libraryId}/authors?q=${encodeURIComponent(name)}`)
        const match = authors.authors?.find((a) => a.name.toLowerCase() === name.toLowerCase())
        if (match) {
          this.$router.push(`/library/${this.libraryItem.libraryId}/bookshelf?filter=authors.${this.$encode(match.id)}`)
        }
      } catch (e) {
        console.error('Failed to lookup author', e)
      }
    },
    clickShowMore() {
      this.createMoreMenu()
    },
    createMoreMenu() {
      if (!this.$refs.moreIcon) return

      const ComponentClass = Vue.extend(MoreMenu)
      const _this = this
      const instance = new ComponentClass({
        propsData: {
          items: this.moreMenuItems
        },
        created() {
          this.$on('action', ({ func, data }) => {
            if (func && _this.moreMenuAction) _this.moreMenuAction({ action: func, data })
          })
          this.$on('close', () => {
            _this.isMoreMenuOpen = false
          })
        }
      })
      instance.$mount()

      const wrapperBox = this.$refs.moreIcon.getBoundingClientRect()
      const el = instance.$el
      const elHeight = this.moreMenuItems.length * 28 + 10
      const elWidth = 192

      let elTop = wrapperBox.top + wrapperBox.height
      let elLeft = wrapperBox.left + wrapperBox.width
      if (elTop + elHeight > window.innerHeight - 20) {
        elTop = wrapperBox.top - elHeight
      }
      if (elLeft + elWidth > window.innerWidth - 20) {
        elLeft = wrapperBox.right - elWidth
      }

      el.style.top = elTop + 'px'
      el.style.left = elLeft + 'px'
      this.isMoreMenuOpen = true
      document.body.appendChild(el)
    },
    navigateToItem() {
      if (this.isSelectionMode) return
      this.$router.push(`/item/${this.libraryItem.id}`)
    },
    playClick() {
      const queueItems = [
        {
          libraryItemId: this.libraryItem.id,
          libraryId: this.libraryItem.libraryId,
          episodeId: null,
          title: this.bookTitle,
          subtitle: this.authorName || '',
          caption: '',
          duration: this.media.duration || null,
          coverPath: this.media.coverPath || null
        }
      ]

      this.$eventBus.$emit('play-item', {
        libraryItemId: this.libraryItem.id,
        queueItems
      })
    },
    clickEdit() {
      this.$emit('edit', this.libraryItem, 'details')
    },
    toggleSelect() {
      this.$emit('select', { entity: this.libraryItem, shiftKey: false })
    },
    toggleFinished() {
      const updatePayload = {
        isFinished: !this.userIsFinished
      }
      this.isProcessingReadUpdate = true

      this.$axios
        .$patch(`/api/me/progress/${this.libraryItem.id}`, updatePayload)
        .then(() => {
          this.isProcessingReadUpdate = false
        })
        .catch((error) => {
          console.error('Failed', error)
          this.isProcessingReadUpdate = false
          this.$toast.error(updatePayload.isFinished ? this.$strings.ToastItemMarkedAsFinishedFailed : this.$strings.ToastItemMarkedAsNotFinishedFailed)
        })
    },

  }
}
</script>

<style scoped>
.book-list-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
