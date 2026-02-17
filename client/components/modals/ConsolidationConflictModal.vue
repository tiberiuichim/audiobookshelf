<template>
  <modals-modal v-model="show" name="consolidation-conflict" :width="500" :processing="processing">
    <div class="px-6 py-6 font-sans bg-bg shadow-lg border border-black-300 rounded-lg">
      <div class="flex items-center mb-4">
        <span class="material-symbols text-yellow-500 text-3xl mr-3 font-bold">warning</span>
        <h2 class="text-xl font-semibold text-white">Consolidation Conflict</h2>
      </div>

      <div class="text-gray-200 mb-6 text-sm">
        <p class="mb-2">The destination folder already exists:</p>
        <div class="bg-black/30 p-3 rounded-md font-mono text-xs break-all border border-white/10 mb-4 text-gray-300">
          {{ folderPath }}
        </div>
        <div v-if="existingLibraryItemId" class="flex items-center text-xs text-yellow-400/80 mb-4 bg-yellow-400/5 p-2 rounded-sm border border-yellow-400/10">
          <span class="material-symbols text-sm mr-2">info</span>
          Another library item is already at this location.
        </div>
        <p class="text-base text-white/90">How would you like to resolve this?</p>
      </div>

      <div class="space-y-3 mb-8">
        <div class="bg-white/5 rounded-lg border border-white/5 p-1">
          <label class="flex items-start p-3 cursor-pointer group hover:bg-white/5 rounded-md transition-colors duration-200" :class="{ 'bg-white/5 border-white/10': resolution === 'merge' }">
            <input v-model="resolution" type="radio" value="merge" class="mt-1 mr-4 accent-yellow-500" />
            <div class="flex-1">
              <span class="text-white font-medium block mb-0.5 group-hover:text-yellow-400 transition-colors">Merge Contents</span>
              <p class="text-xs text-gray-400 leading-relaxed">Move all files from this book into the existing folder. Files with identical names will be automatically renamed with a timestamp.</p>
            </div>
          </label>

          <label class="flex items-start p-3 cursor-pointer group hover:bg-white/5 rounded-md transition-colors duration-200" :class="{ 'bg-white/5 border-white/10': resolution === 'rename' }">
            <input v-model="resolution" type="radio" value="rename" class="mt-1 mr-4 accent-yellow-500" />
            <div class="flex-1">
              <span class="text-white font-medium block mb-0.5 group-hover:text-yellow-400 transition-colors">Rename Destination</span>
              <p class="text-xs text-gray-400 leading-relaxed mb-3">Save this book to a different folder name instead.</p>
              <div v-if="resolution === 'rename'" class="mt-2 pl-1">
                <ui-text-input v-model="newName" class="w-full" placeholder="Enter new folder name" @keyup.enter="submit" />
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-4 border-t border-white/10">
        <ui-btn @click="show = false">Cancel</ui-btn>
        <ui-btn color="success" class="px-6" :loading="processing" @click="submit">Confirm Resolution</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    item: {
      type: Object,
      default: () => ({})
    },
    folderPath: String,
    folderName: String,
    existingLibraryItemId: String,
    processing: Boolean
  },
  data() {
    return {
      resolution: 'merge',
      newName: ''
    }
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  watch: {
    folderName(val) {
      if (val) this.newName = val
    },
    show(val) {
      if (val) {
        this.resolution = 'merge'
        this.newName = this.folderName || ''
      }
    }
  },
  methods: {
    submit() {
      if (this.resolution === 'rename' && !this.newName.trim()) {
        this.$toast.error('New folder name is required')
        return
      }

      const payload = {
        merge: this.resolution === 'merge',
        newName: this.resolution === 'rename' ? this.newName.trim() : null
      }
      this.$emit('confirm', payload)
    }
  }
}
</script>
