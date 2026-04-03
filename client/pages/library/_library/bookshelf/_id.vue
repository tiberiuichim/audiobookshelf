<template>
  <div class="page" :class="streamLibraryItem ? 'streaming' : ''">
    <app-book-shelf-toolbar :page="id || ''" />
    <app-lazy-bookshelf :page="id || ''" />
  </div>
</template>

<script>
export default {
  async asyncData({ params, query, store, redirect }) {
    var libraryId = params.library
    var libraryData = await store.dispatch('libraries/fetch', libraryId)
    if (!libraryData) {
      return redirect('/oops?message=Library not found')
    }

    // Set series sort by
    if (query.filter || query.sort || query.desc) {
      const isSeries = params.id === 'series'
      const isAuthors = params.id === 'authors'
      const isGenres = params.id === 'genres'
      const isTags = params.id === 'tags'
      const settingsUpdate = {}
      
      if (isSeries) {
        settingsUpdate.seriesFilterBy = query.filter || undefined
        settingsUpdate.seriesSortBy = query.sort || undefined
        settingsUpdate.seriesSortDesc = query.desc == '0' ? false : query.desc == '1' ? true : undefined
      } else if (isAuthors) {
        settingsUpdate.authorFilterBy = query.filter || undefined
        settingsUpdate.authorSortBy = query.sort || 'name'
        settingsUpdate.authorSortDesc = query.desc == '1'
      } else if (isGenres) {
        settingsUpdate.genreFilterBy = query.filter || undefined
        settingsUpdate.genreSortBy = query.sort || 'name'
        settingsUpdate.genreSortDesc = query.desc == '1'
      } else if (isTags) {
        settingsUpdate.tagFilterBy = query.filter || undefined
        settingsUpdate.tagSortBy = query.sort || 'name'
        settingsUpdate.tagSortDesc = query.desc == '1'
      } else {
        settingsUpdate.filterBy = query.filter || undefined
        settingsUpdate.orderBy = query.sort || undefined
        settingsUpdate.orderDesc = query.desc == '0' ? false : query.desc == '1' ? true : undefined
      }
      store.dispatch('user/updateUserSettings', settingsUpdate)
    }

    // Redirect podcast libraries
    const library = libraryData.library
    if (library.mediaType === 'podcast' && (params.id === 'collections' || params.id === 'series' || params.id === 'authors' || params.id === 'genres' || params.id === 'tags')) {
      return redirect(`/library/${libraryId}`)
    }

    return {
      id: params.id || '',
      libraryId
    }
  },
  data() {
    return {}
  },
  computed: {
    streamLibraryItem() {
      return this.$store.state.streamLibraryItem
    }
  },
  methods: {}
}
</script>
