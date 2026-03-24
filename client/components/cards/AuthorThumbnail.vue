<template>
  <div class="author-thumbnail-wrapper" :style="{ width: width + 'px' }">
    <nuxt-link :to="`/author/${author?.id}`">
      <div class="relative overflow-hidden rounded-md" :style="{ height: width + 'px' }" @mouseover="isHovering = true" @mouseleave="isHovering = false">
        <covers-author-image :author="author" rounded="md" />

        <ui-tooltip v-if="isUnmatched && !searching" :text="userCanUpdate ? 'Quick Match' : 'Unmatched'" direction="top" class="absolute left-1 top-1 z-10">
          <button
            class="rounded-full bg-warning flex items-center justify-center border border-black/20 shadow-sm transition-transform duration-200"
            :style="{ width: badgeSize + 'px', height: badgeSize + 'px' }"
            :class="userCanUpdate ? 'cursor-pointer hover:scale-110' : 'cursor-default'"
            @click.prevent.stop="userCanUpdate ? quickMatchAuthor() : null"
          >
            <span class="material-symbols text-black" :style="{ fontSize: badgeSize * 0.7 + 'px' }">sync_problem</span>
          </button>
        </ui-tooltip>

        <div v-show="!searching" class="absolute bottom-0 left-0 w-full bg-black/60 px-1 py-0.5">
          <p class="text-center font-semibold text-white truncate" :style="{ fontSize: fontSize + 'px' }">{{ author?.name || 'Unknown' }}</p>
          <p class="text-center text-gray-300" :style="{ fontSize: fontSize * 0.85 + 'px' }">{{ author?.numBooks || 0 }} {{ $strings.LabelBooks }}</p>
        </div>

        <div v-show="isHovering && userCanUpdate && !isUnmatched && !searching" class="absolute top-0 right-0 p-1 cursor-pointer hover:scale-125 transition-transform duration-150" @click.prevent.stop="quickMatchAuthor">
          <ui-tooltip :text="$strings.ButtonQuickMatch" direction="bottom">
            <span class="material-symbols text-white/75 hover:text-white" :style="{ fontSize: fontSize + 'px' }">search</span>
          </ui-tooltip>
        </div>

        <div v-show="searching" class="absolute inset-0 bg-black/50 flex items-center justify-center">
          <widgets-loading-spinner size="" />
        </div>
      </div>
    </nuxt-link>
  </div>
</template>

<script>
export default {
  props: {
    author: {
      type: Object,
      default: () => ({})
    },
    width: {
      type: Number,
      default: 70
    }
  },
  data() {
    return {
      searching: false,
      isHovering: false
    }
  },
  computed: {
    fontSize() {
      return Math.max(10, Math.min(13, this.width * 0.12))
    },
    badgeSize() {
      return Math.max(16, this.width * 0.18)
    },
    isUnmatched() {
      if (!this.author) return false
      return !this.author.asin && !this.author.description && !this.author.imagePath
    },
    userCanUpdate() {
      return this.$store.getters['user/getUserCanUpdate']
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    libraryProvider() {
      return this.$store.getters['libraries/getLibraryProvider'](this.currentLibraryId) || 'google'
    }
  },
  methods: {
    async quickMatchAuthor() {
      if (!this.author?.id) return

      this.searching = true
      const payload = {}
      if (this.author.asin) {
        payload.asin = this.author.asin
      } else {
        payload.q = this.author.name
      }

      payload.region = 'us'
      if (this.libraryProvider.startsWith('audible.')) {
        payload.region = this.libraryProvider.split('.').pop() || 'us'
      }

      try {
        const response = await this.$axios.$post(`/api/authors/${this.author.id}/match`, payload)
        if (!response) {
          this.$toast.error(this.$getString('ToastAuthorNotFound', [this.author.name]))
        } else if (response.updated) {
          this.$emit('author-updated', response.author)
          if (response.author.imagePath) {
            this.$toast.success(this.$strings.ToastAuthorUpdateSuccess)
          } else {
            this.$toast.success(this.$strings.ToastAuthorUpdateSuccessNoImageFound)
          }
        } else {
          this.$toast.info(this.$strings.ToastNoUpdatesNecessary)
        }
      } catch (error) {
        console.error('Failed to match author', error)
        this.$toast.error(this.$getString('ToastAuthorNotFound', [this.author.name || 'Unknown']))
      } finally {
        this.searching = false
      }
    }
  }
}
</script>

<style scoped>
.author-thumbnail-wrapper {
  position: relative;
}
</style>