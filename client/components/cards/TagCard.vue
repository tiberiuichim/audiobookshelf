<template>
  <div class="pb-3e" :style="{ minWidth: cardWidth + 'px', maxWidth: cardWidth + 'px' }">
    <nuxt-link :to="`/library/${currentLibraryId}/tag/${encodedTagName}`">
      <div cy-id="card" @mouseover="mouseover" @mouseleave="mouseleave">
        <div cy-id="imageArea" :style="{ height: cardHeight + 'px' }" class="bg-primary box-shadow-book rounded-md relative overflow-hidden">
          <!-- Tag icon and color -->
          <div class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: tagColor }">
            <span class="material-symbols text-white" :style="{ fontSize: iconSize + 'px' }">label</span>
          </div>

          <!-- Tag name & num items overlay -->
          <div cy-id="textInline" class="absolute bottom-0 left-0 w-full py-1e bg-black/60 px-2e">
            <p class="text-center font-semibold truncate" :style="{ fontSize: 0.75 + 'em' }">{{ tagName }}</p>
            <p class="text-center text-gray-200" :style="{ fontSize: 0.65 + 'em' }">{{ numItems }} {{ $strings.LabelItems }}</p>
          </div>

          <!-- View icon btn -->
          <div cy-id="view" v-show="isHovering" class="absolute top-0 left-0 p-2e cursor-pointer hover:text-white text-gray-200 transform hover:scale-125 duration-150">
            <ui-tooltip :text="$strings.ButtonViewItems" direction="bottom">
              <span class="material-symbols" :style="{ fontSize: 1.125 + 'em' }">visibility</span>
            </ui-tooltip>
          </div>
        </div>
      </div>
    </nuxt-link>
  </div>
</template>

<script>
export default {
  props: {
    tagMount: {
      type: Object,
      default: () => {}
    },
    width: Number,
    height: {
      type: Number,
      default: 192
    }
  },
  data() {
    return {
      isHovering: false,
      tag: null
    }
  },
  computed: {
    cardWidth() {
      return this.width || this.cardHeight * 0.8
    },
    cardHeight() {
      return this.height * this.sizeMultiplier
    },
    iconSize() {
      return this.cardHeight * 0.5
    },
    _tag() {
      return this.tag || {}
    },
    tagName() {
      return this._tag?.name || ''
    },
    encodedTagName() {
      return encodeURIComponent(Buffer.from(this.tagName).toString('base64'))
    },
    numItems() {
      return this._tag?.numItems || 0
    },
    store() {
      return this.$store || this.$nuxt.$store
    },
    currentLibraryId() {
      return this.store.state.libraries.currentLibraryId
    },
    sizeMultiplier() {
      return this.store.getters['user/getSizeMultiplier']
    },
    tagColor() {
      const hash = this.hashCode(this.tagName || '')
      const hue = Math.abs(hash) % 360
      return `hsl(${hue}, 50%, 55%)`
    }
  },
  methods: {
    mouseover() {
      this.isHovering = true
    },
    mouseleave() {
      this.isHovering = false
    },
    hashCode(str) {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return hash
    },
    setEntity(tag) {
      this.tag = tag
    },
    destroy() {
      this.$destroy()

      if (this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el)
      } else if (this.$el && this.$el.remove) {
        this.$el.remove()
      }
    },
    setSelectionMode(val) {}
  },
  mounted() {
    if (this.tagMount) this.setEntity(this.tagMount)
  }
}
</script>