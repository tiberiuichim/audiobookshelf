<template>
  <div>
    <app-settings-content :header-text="$strings.HeaderLibraries">
      <template #header-items>
        <ui-tooltip :text="$strings.LabelClickForMoreInfo" class="inline-flex ml-2">
          <a href="https://www.audiobookshelf.org/guides/library_creation" target="_blank" class="inline-flex">
            <span class="material-symbols text-xl w-5 text-gray-200">help_outline</span>
          </a>
        </ui-tooltip>

        <div class="grow" />

        <ui-btn color="bg-primary" small @click="setShowLibraryModal()">{{ $strings.ButtonAddLibrary }}</ui-btn>
      </template>
      <tables-library-libraries-table @showLibraryModal="setShowLibraryModal" class="pt-2" />
    </app-settings-content>
    <modals-libraries-edit-modal v-model="showLibraryModal" :library="selectedLibrary" />
  </div>
</template>

<script>
export default {
  asyncData({ store, redirect }) {
    if (!store.getters['user/getIsAdminOrUp']) {
      redirect('/')
    }
  },
  data() {
    return {
      showLibraryModal: false,
      selectedLibrary: null
    }
  },
  computed: {},
  watch: {
    '$route.query.edit': {
      handler(val) {
        if (val) {
          const library = this.$store.state.libraries.libraries.find((lib) => lib.id === val)
          if (library) {
            this.setShowLibraryModal(library)
          }
        }
      }
    }
  },
  methods: {
    setShowLibraryModal(selectedLibrary) {
      this.selectedLibrary = selectedLibrary
      this.showLibraryModal = true
    }
  },
  mounted() {
    const editLibraryId = this.$route.query.edit
    if (editLibraryId) {
      const library = this.$store.state.libraries.libraries.find((lib) => lib.id === editLibraryId)
      if (library) {
        this.setShowLibraryModal(library)
      }
    }
  }
}
</script>
