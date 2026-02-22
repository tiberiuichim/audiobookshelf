<template>
  <modals-modal v-model="show" name="shortcuts" :width="600">
    <template #outer>
      <div class="absolute top-0 left-0 p-5 w-2/3 overflow-hidden">
        <p class="text-3xl text-white truncate">Keyboard Shortcuts</p>
      </div>
    </template>
    <div class="px-6 py-6 w-full text-sm rounded-lg bg-bg shadow-lg border border-black-300 overflow-y-auto overflow-x-hidden" style="max-height: 80vh">
      <div class="text-sm text-gray-200">
        <div v-for="(section, index) in shortcutSections" :key="index" class="mb-6 last:mb-0">
          <h3 class="text-lg font-semibold text-white mb-3">{{ section.title }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
            <div v-for="shortcut in section.shortcuts" :key="shortcut.keys" class="flex justify-between items-center py-1 border-b border-white/10 last:border-b-0">
              <span>{{ shortcut.action }}</span>
              <div class="flex gap-1">
                <span v-for="(key, i) in shortcut.keys.replace(/Key/g, '').split('-')" :key="i" class="px-2 py-0.5 bg-bg font-mono text-xs rounded-sm border border-gray-600 text-gray-300">
                  {{ key }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end pt-4 border-t border-white/10 mt-4">
        <ui-btn @click="close">Close</ui-btn>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  computed: {
    shortcutSections() {
      if (!this.$hotkeys) return []
      return [
        {
          title: 'Global Navigation',
          shortcuts: [
            { action: 'Home', keys: this.$hotkeys.Navigation.HOME },
            { action: 'Library', keys: this.$hotkeys.Navigation.LIBRARY },
            { action: 'Series', keys: this.$hotkeys.Navigation.SERIES },
            { action: 'Collections', keys: this.$hotkeys.Navigation.COLLECTIONS },
            { action: 'Authors', keys: this.$hotkeys.Navigation.AUTHORS },
            { action: 'Show Shortcuts Helper', keys: this.$hotkeys.Global.SHORTCUTS_HELPER }
          ]
        },
        {
          title: 'Library Actions (Batch Selection)',
          shortcuts: [
            { action: 'Select All Items', keys: this.$hotkeys.Batch.SELECT_ALL },
            { action: 'Consolidate', keys: this.$hotkeys.Batch.CONSOLIDATE },
            { action: 'Merge Items', keys: this.$hotkeys.Batch.MERGE },
            { action: 'Move to Library', keys: this.$hotkeys.Batch.MOVE },
            { action: 'Reset Metadata', keys: this.$hotkeys.Batch.RESET },
            { action: 'Quick Match', keys: this.$hotkeys.Batch.MATCH },
            { action: 'Clear Selection', keys: this.$hotkeys.Batch.CANCEL }
          ]
        },
        {
          title: 'Item View Actions',
          shortcuts: [
            { action: 'Consolidate', keys: this.$hotkeys.Item.CONSOLIDATE },
            { action: 'Move to Library', keys: this.$hotkeys.Item.MOVE },
            { action: 'Reset Metadata', keys: this.$hotkeys.Item.RESET },
            { action: 'Match', keys: this.$hotkeys.Item.MATCH }
          ]
        }
      ]
    },
    show: {
      get() {
        return this.$store.state.globals.showShortcutsModal
      },
      set(val) {
        this.$store.commit('globals/setShowShortcutsModal', val)
      }
    }
  },
  methods: {
    close() {
      this.show = false
    }
  }
}
</script>
