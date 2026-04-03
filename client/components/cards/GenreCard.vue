<template>
  <div class="pb-3e" :style="{ minWidth: cardWidth + 'px', maxWidth: cardWidth + 'px' }">
    <nuxt-link :to="`/library/${currentLibraryId}/genre/${encodedGenreName}`">
      <div cy-id="card" @mouseover="mouseover" @mouseleave="mouseleave">
        <div cy-id="imageArea" :style="{ height: cardHeight + 'px' }" class="bg-primary box-shadow-book rounded-md relative overflow-hidden">
          <!-- Genre icon and color -->
          <div class="w-full h-full flex items-center justify-center" :style="{ backgroundColor: genreColor }">
            <span class="material-symbols text-white" :style="{ fontSize: iconSize + 'px' }">{{ genreIcon }}</span>
          </div>

          <!-- Genre name & num books overlay -->
          <div cy-id="textInline" class="absolute bottom-0 left-0 w-full py-1e bg-black/60 px-2e">
            <p class="text-center font-semibold truncate" :style="{ fontSize: 0.75 + 'em' }">{{ genreName }}</p>
            <p class="text-center text-gray-200" :style="{ fontSize: 0.65 + 'em' }">{{ numBooks }} {{ $strings.LabelBooks }}</p>
          </div>

          <!-- View icon btn -->
          <div cy-id="view" v-show="isHovering" class="absolute top-0 left-0 p-2e cursor-pointer hover:text-white text-gray-200 transform hover:scale-125 duration-150">
            <ui-tooltip :text="$strings.ButtonViewBooks" direction="bottom">
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
    genreMount: {
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
      genre: null
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
    _genre() {
      return this.genre || {}
    },
    genreName() {
      return this._genre?.name || ''
    },
    encodedGenreName() {
      return encodeURIComponent(Buffer.from(this.genreName).toString('base64'))
    },
    numBooks() {
      return this._genre?.numBooks || 0
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
    genreColor() {
      return this.getGenreColor(this.genreName)
    },
    genreIcon() {
      return this.getGenreIcon(this.genreName)
    }
  },
  methods: {
    mouseover() {
      this.isHovering = true
    },
    mouseleave() {
      this.isHovering = false
    },
    getGenreColor(genreName) {
      const colors = {
        'Science Fiction': '#3498db',
        'Fantasy': '#9b59b6',
        'Mystery': '#2c3e50',
        'Romance': '#e74c3c',
        'Thriller': '#e67e22',
        'Horror': '#8e44ad',
        'Historical': '#d35400',
        'Non-Fiction': '#16a085',
        'Biography': '#27ae60',
        'Adventure': '#f39c12',
        'Classic': '#8b4513',
        'Comedy': '#f1c40f',
        'Drama': '#c0392b',
        'Young Adult': '#e91e63',
        'Children': '#00bcd4'
      }
      if (colors[genreName]) return colors[genreName]

      const hash = this.hashCode(genreName || '')
      const hue = Math.abs(hash) % 360
      return `hsl(${hue}, 60%, 50%)`
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
    getGenreIcon(genreName) {
      const icons = {
        'Science Fiction': 'rocket_launch',
        'Fantasy': 'auto_fix_high',
        'Mystery': 'magnify',
        'Romance': 'favorite',
        'Thriller': 'bolt',
        'Horror': 'dangerous',
        'Historical': 'history_edu',
        'Non-Fiction': 'school',
        'Biography': 'person',
        'Adventure': 'explore',
        'Classic': 'menu_book',
        'Comedy': 'sentiment_very_satisfied',
        'Drama': 'theater_comedy',
        'Young Adult': 'groups',
        'Children': 'child_care'
      }
      return icons[genreName] || 'book'
    },
    setEntity(genre) {
      this.genre = genre
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
    if (this.genreMount) this.setEntity(this.genreMount)
  }
}
</script>