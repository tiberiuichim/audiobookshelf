<template>
  <div class="w-full my-2">
    <div class="w-full bg-primary px-4 md:px-6 py-2 flex items-center cursor-pointer" @click.stop="clickBar">
      <p class="pr-2 md:pr-4">{{ title }}</p>
      <div class="h-5 md:h-7 w-5 md:w-7 rounded-full bg-white/10 flex items-center justify-center">
        <span class="text-sm font-mono">{{ tracks.length }}</span>
      </div>
      <div class="grow" />
      <ui-btn v-if="userIsAdmin" small :loading="validatingAll" class="mr-2 hidden md:block" @click.stop="validateAllTracks">{{ $strings.ButtonValidateAll }}</ui-btn>
      <ui-btn v-if="userIsAdmin" small :color="showFullPath ? 'bg-gray-600' : 'bg-primary'" class="mr-2 hidden md:block" @click.stop="toggleFullPath">{{ $strings.ButtonFullPath }}</ui-btn>
      <nuxt-link v-if="userCanUpdate && !isFile" :to="`/audiobook/${libraryItemId}/edit`" class="mr-2 md:mr-4" @mousedown.prevent>
        <ui-btn small color="bg-primary">{{ $strings.ButtonManageTracks }}</ui-btn>
      </nuxt-link>
      <div class="cursor-pointer h-10 w-10 rounded-full hover:bg-black-400 flex justify-center items-center duration-500" :class="showTracks ? 'transform rotate-180' : ''">
        <span class="material-symbols text-4xl">&#xe313;</span>
      </div>
    </div>
    <transition name="slide">
      <div class="w-full" v-show="showTracks">
        <table class="text-sm tracksTable">
          <tr>
            <th class="w-10">#</th>
            <th class="text-left">{{ $strings.LabelFilename }}</th>
            <th v-if="!showFullPath" class="text-left w-20 hidden lg:table-cell">{{ $strings.LabelCodec }}</th>
            <th v-if="!showFullPath" class="text-left w-20 hidden xl:table-cell">{{ $strings.LabelBitrate }}</th>
            <th class="text-left w-20 hidden md:table-cell">{{ $strings.LabelSize }}</th>
            <th class="text-left w-20 hidden sm:table-cell">{{ $strings.LabelDuration }}</th>
            <th v-if="userIsAdmin" class="text-center w-16" :title="$strings.LabelValidationStatus"><span class="material-symbols text-lg">verified</span></th>
            <th class="text-center w-16"></th>
          </tr>
          <template v-for="track in tracks">
            <tables-audio-tracks-table-row :key="track.index" :track="track" :library-item-id="libraryItemId" :showFullPath="showFullPath" :validation-status="validationStatus[track.audioFile?.ino]" @showMore="showMore" @validate="validateSingleTrack" />
          </template>
        </table>
      </div>
    </transition>

    <modals-audio-file-data-modal v-model="showAudioFileDataModal" :library-item-id="libraryItemId" :audio-file="selectedAudioFile" />
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Audio Tracks'
    },
    tracks: {
      type: Array,
      default: () => []
    },
    libraryItemId: String,
    isFile: Boolean
  },
  data() {
    return {
      showTracks: false,
      showFullPath: false,
      selectedAudioFile: null,
      showAudioFileDataModal: false,
      validationStatus: {},
      validatingAll: false
    }
  },
  computed: {
    userCanDownload() {
      return this.$store.getters['user/getUserCanDownload']
    },
    userCanUpdate() {
      return this.$store.getters['user/getUserCanUpdate']
    },
    userCanDelete() {
      return this.$store.getters['user/getUserCanDelete']
    },
    userIsAdmin() {
      return this.$store.getters['user/getIsAdminOrUp']
    }
  },
  methods: {
    toggleFullPath() {
      this.showFullPath = !this.showFullPath
      localStorage.setItem('showFullPath', this.showFullPath ? 1 : 0)
    },
    clickBar() {
      this.showTracks = !this.showTracks
    },
    showMore(audioFile) {
      this.selectedAudioFile = audioFile
      this.showAudioFileDataModal = true
    },
    validateSingleTrack(audioFile) {
      if (!audioFile?.ino) return
      this.$axios
        .$get(`/api/items/${this.libraryItemId}/validate/${audioFile.ino}`)
        .then((result) => {
          this.$set(this.validationStatus, audioFile.ino, result)
          if (result.valid) {
            this.$toast.success(this.$strings.ToastAudioFileValid)
          } else {
            this.$toast.error(`${this.$strings.ToastAudioFileInvalid}: ${result.error}`)
          }
        })
        .catch((error) => {
          console.error('Failed to validate audio file', error)
          this.$toast.error(this.$strings.ToastFailedToLoadData)
        })
    },
    validateAllTracks() {
      const fileIds = this.tracks.filter(t => t.audioFile?.ino).map(t => t.audioFile.ino)
      if (!fileIds.length) return

      this.validatingAll = true
      this.$axios
        .$post(`/api/items/${this.libraryItemId}/validate`, { fileIds })
        .then((response) => {
          response.results.forEach((result) => {
            this.$set(this.validationStatus, result.ino, result)
          })
          const invalidCount = response.results.filter(r => !r.valid).length
          if (invalidCount > 0) {
            this.$toast.error(`${invalidCount} ${this.tracks.length > 1 ? 'files' : 'file'} invalid`)
          } else {
            this.$toast.success(this.$strings.ToastAudioFilesValidated.replace('{count}', response.results.length))
          }
        })
        .catch((error) => {
          console.error('Failed to validate audio files', error)
          this.$toast.error(this.$strings.ToastFailedToLoadData)
        })
        .finally(() => {
          this.validatingAll = false
        })
    }
  },
  mounted() {
    if (this.userIsAdmin) {
      this.showFullPath = !!Number(localStorage.getItem('showFullPath') || 0)
    }
  }
}
</script>
