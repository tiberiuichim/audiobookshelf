<template>
  <modals-modal v-model="show" name="confirmCoverSize" :width="600" :height="'unset'">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3">
        <p class="text-xl text-white truncate">{{ $strings.MessageCoverSizeConfirmation }}</p>
      </div>
    </template>

    <div ref="container" class="w-full rounded-lg bg-bg box-shadow-md overflow-y-auto overflow-x-hidden" style="max-height: 80vh">
      <div v-if="show" class="w-full h-full py-4 px-6">
        <p class="text-gray-300 mb-6">{{ $strings.MessageCoverSmallerThanCurrent }}</p>

        <div class="flex justify-center gap-12">
          <div class="text-center">
            <p class="text-sm text-gray-400 mb-2 font-semibold">{{ $strings.LabelCurrent }}</p>
            <div class="relative inline-block bg-primary/20 rounded-sm overflow-hidden" style="min-width: 128px; min-height: 192px">
              <img v-if="currentCoverUrl" :src="currentCoverUrl" class="max-w-32 max-h-48 object-contain" />
              <div v-else class="w-32 h-48 flex items-center justify-center text-gray-500">
                <span class="material-symbols text-4xl">image</span>
              </div>
              <div v-if="currentTier" class="absolute bottom-1 left-1 text-center">
                <span class="px-2 py-0.5 text-xs rounded" :class="currentTierColor">{{ currentTier }}</span>
              </div>
            </div>
            <p v-if="currentDimensions" class="text-xs text-gray-500 mt-2">{{ currentDimensions.width }} x {{ currentDimensions.height }}</p>
          </div>

          <div class="text-center">
            <p class="text-sm text-gray-400 mb-2 font-semibold">{{ $strings.LabelMatched }}</p>
            <div class="relative inline-block bg-primary/20 rounded-sm overflow-hidden" style="min-width: 128px; min-height: 192px">
              <img v-if="matchedCoverUrl" :src="matchedCoverUrl" class="max-w-32 max-h-48 object-contain" @load="onMatchedCoverLoad" @error="onMatchedCoverError" />
              <div v-else class="w-32 h-48 flex items-center justify-center text-gray-500">
                <span class="material-symbols text-4xl">image</span>
              </div>
              <div v-if="matchedTier" class="absolute bottom-1 left-1 text-center">
                <span class="px-2 py-0.5 text-xs rounded" :class="matchedTierColor">{{ matchedTier }}</span>
              </div>
            </div>
            <p v-if="matchedDimensions" class="text-xs text-gray-500 mt-2">{{ matchedDimensions.width }} x {{ matchedDimensions.height }}</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-white/5">
          <ui-btn @click="cancel">{{ $strings.ButtonCancel }}</ui-btn>
          <ui-btn color="bg-primary" @click="keepExisting">{{ $strings.ButtonKeepExisting }}</ui-btn>
          <ui-btn color="bg-success" @click="replaceAnyway">{{ $strings.ButtonReplaceAnyway }}</ui-btn>
        </div>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  data() {
    return {matchedCoverLoaded: false,
      matchedCoverError: false
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.globals.showConfirmCoverSizeModal
      },
      set(val) {
        this.$store.commit('globals/setShowConfirmCoverSizeModal', val)
      }
    },
    options() {
      return this.$store.state.globals.confirmCoverSizeOptions || {}
    },
    currentCoverUrl() {
      return this.options.currentCoverUrl || null
    },
    matchedCoverUrl() {
      return this.options.matchedCoverUrl || null
    },
    currentDimensions() {
      return this.options.currentDimensions || null
    },
    matchedDimensions() {
      return this.options.matchedDimensions || null
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio'] || null
    },
    currentTier() {
      if (!this.currentDimensions) return null
      return this.getCoverTier(this.currentDimensions.width, this.currentDimensions.height)
    },
    matchedTier() {
      if (!this.matchedDimensions) return null
      return this.getCoverTier(this.matchedDimensions.width, this.matchedDimensions.height)
    },
    currentTierColor() {
      const tier = this.currentTier
      if (!tier) return 'bg-gray-600'
      if (tier === 'BIG') return 'bg-success'
      if (tier === 'MED') return 'bg-info'
      return 'bg-warning'
    },
    matchedTierColor() {
      const tier = this.matchedTier
      if (!tier) return 'bg-gray-600'
      if (tier === 'BIG') return 'bg-success'
      if (tier === 'MED') return 'bg-info'
      return 'bg-warning'
    }
  },
  methods: {
    getCoverTier(width, height) {
      if (!width || !height) return null
      const maxDim = Math.max(width, height)
      if (maxDim >= 1200) return 'BIG'
      if (maxDim >= 450) return 'MED'
      return 'SML'
    },
    cancel() {
      if (this.options.callback) {
        this.options.callback('cancel')
      }
      this.show = false
    },
    keepExisting() {
      if (this.options.callback) {
        this.options.callback('keep-existing')
      }
      this.show = false
    },
    replaceAnyway() {
      if (this.options.callback) {
        this.options.callback('replace')
      }
      this.show = false
    },
    onMatchedCoverLoad() {
      this.matchedCoverLoaded = true
    },
    onMatchedCoverError() {
      this.matchedCoverError = true
    }
  }
}
</script>