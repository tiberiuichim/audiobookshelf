<template>
  <modals-modal ref="modal" v-model="show" name="split-book" :width="600" :height="'unset'" :processing="processing">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">{{ $strings.HeaderSplitBook || 'Split Book' }}</p>
      </div>
    </template>
    <div class="px-6 py-4 w-full h-full text-sm bg-bg rounded-lg shadow-lg border border-black-300">
      <p class="text-sm text-gray-300 mb-4">{{ $strings.MessageSplitBookDescription || 'Assign each file to a new book number to split them into separate library items.' }}</p>
      
      <div class="flex justify-end mb-2">
        <ui-btn small @click="autoAssignSequence">{{ $strings.ButtonAutoAssignSequence || 'Assign 1 to N' }}</ui-btn>
      </div>

      <div class="max-h-96 overflow-y-auto">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="text-left py-2 px-2">{{ $strings.LabelFilename || 'Filename' }}</th>
              <th class="text-center w-32 px-2 border-l border-primary">{{ $strings.LabelBookGroup || 'Book Number' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in filesWithAssignment" :key="file.ino" class="border-t border-primary">
              <td class="py-2 px-2 truncate" :title="file.metadata.filename">{{ file.metadata.filename }}</td>
              <td class="text-center px-2 border-l border-primary">
                <input type="number" min="1" v-model.number="file.bookNumber" class="w-16 bg-primary text-center px-1 py-1 rounded outline-none w-full" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-end">
        <ui-btn @click="show = false" class="mr-2">{{ $strings.ButtonCancel }}</ui-btn>
        <ui-btn color="success" :loading="processing" @click="submit">{{ $strings.ButtonSubmit }}</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    libraryItem: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      processing: false,
      filesWithAssignment: []
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
    show: {
      handler(newVal) {
        if (newVal) {
          this.init()
        }
      }
    }
  },
  methods: {
    init() {
      const audioAndEbooks = (this.libraryItem.libraryFiles || []).filter(f => f.fileType === 'audio' || f.fileType === 'ebook')
      this.filesWithAssignment = audioAndEbooks.map(file => {
        return {
          ...file,
          bookNumber: 1
        }
      })
    },
    autoAssignSequence() {
      this.filesWithAssignment.forEach((file, ind) => {
        file.bookNumber = ind + 1
      })
    },
    async submit() {
      this.processing = true
      
      const assignments = this.filesWithAssignment.map(f => ({
        ino: f.ino,
        bookNumber: f.bookNumber
      })).filter(a => a.bookNumber > 1) // Only send ones being detached/split

      if (!assignments.length) {
        this.$toast.warning('No files assigned to new books.')
        this.processing = false
        return
      }

      try {
        await this.$axios.$post(`/api/items/${this.libraryItem.id}/split`, {
          assignments
        })
        this.$toast.success('Successfully split files into new books')
        this.show = false
      } catch (error) {
        console.error('Failed to split book', error)
        this.$toast.error('Failed to split book: ' + (error.response?.data || error.message))
      } finally {
        this.processing = false
      }
    }
  }
}
</script>
