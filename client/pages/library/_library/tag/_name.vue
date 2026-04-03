<template>
  <div id="page-wrapper" class="bg-bg page overflow-y-auto" :class="streamLibraryItem ? 'streaming' : ''">
    <div class="flex items-center py-4 px-4">
      <div class="grow">
        <nuxt-link :to="`/library/${currentLibraryId}/bookshelf/tags`" class="hover:underline text-white/60 flex items-center">
          <span class="material-symbols text-xl mr-2">arrow_back</span>
          <span>{{ $strings.LabelTags }}</span>
        </nuxt-link>
        <h1 class="text-2xl mt-2">{{ tagName }}</h1>
      </div>
    </div>

    <div class="py-4 px-4">
      <app-lazy-bookshelf page="items" />
    </div>
  </div>
</template>

<script>
export default {
  async asyncData({ store, params, redirect }) {
    const currentLibraryId = store.state.libraries.currentLibraryId
    if (!currentLibraryId) {
      return redirect('/library/notfound')
    }

    const encodedTagName = params.name
    const tagName = Buffer.from(decodeURIComponent(encodedTagName), 'base64').toString()

    if (!tagName) {
      return redirect(`/library/${currentLibraryId}/bookshelf/tags`)
    }

    return {
      tagName,
      encodedTagName
    }
  },
  data() {
    return {
      tagName: '',
      encodedTagName: ''
    }
  },
  computed: {
    streamLibraryItem() {
      return this.$store.state.streamLibraryItem
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    }
  },
  methods: {
    init() {
      const filterValue = `tags.${this.encodedTagName}`
      this.$store.dispatch('user/updateUserSettings', { filterBy: filterValue })
    }
  },
  mounted() {
    this.init()
  },
  beforeDestroy() {
    this.$store.dispatch('user/updateUserSettings', { filterBy: 'all' })
  }
}
</script>