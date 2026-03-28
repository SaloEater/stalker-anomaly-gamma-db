<template>
<Transition name="fade">
<div class="modal-backdrop" v-if="open" @click.self="$emit('close')" style="z-index: 210;">
    <Transition name="modal" appear>
    <div class="modal build-save-modal" v-if="open">
        <div class="save-import-header">
            <h2 class="build-picker-title" style="margin:0">{{ t('app_build_import_code') || 'Import Code' }}</h2>
            <button class="save-import-close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="build-import-code-banner" :class="{ visible: buildImportError }">
                <span v-if="buildImportError">{{ buildImportError }}</span>
            </div>
            <div class="build-save-form">
                <input type="text" :value="buildImportCode" @input="$emit('update:buildImportCode', $event.target.value)" :placeholder="t('app_build_import_placeholder') || 'Paste build code'" class="build-save-input" :class="{ 'build-save-input-error': buildImportError }" ref="importCodeInput" @keydown.enter="$emit('import')" spellcheck="false">
                <button class="build-toolbar-btn" @click="$emit('import')" :disabled="!buildImportCode.trim()">{{ t('app_build_import') || 'Import' }}</button>
            </div>
        </div>
    </div>
    </Transition>
</div>
</Transition>
</template>

<script>
export default {
  name: "BuildImportCodeModal",
  inject: ["t"],
  props: {
    open: Boolean,
    buildImportCode: String,
    buildImportError: String,
  },
  emits: ["close", "update:buildImportCode", "import"],
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          setTimeout(() => {
            const input = this.$refs.importCodeInput;
            if (input) { input.focus(); }
          }, 50);
        });
      }
    },
  },
};
</script>
