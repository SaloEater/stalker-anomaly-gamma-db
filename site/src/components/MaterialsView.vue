<template>
    <div class="tile-grid" v-if="isMaterialsCategory">
        <div v-for="item in items" :key="item.id" class="tile-card recipe-card">
            <div class="tile-card-header">
                <span class="tile-card-name">{{ tName(item) }}</span>
            </div>
            <div class="material-sources" v-if="item.sources">
                <div v-for="(src, idx) in item.sources" :key="idx" class="material-source">
                    <span class="recipe-ing-amount">x{{ src.amount }}</span>
                    <span class="material-from">{{ t('app_label_from') }}</span>
                    <template v-if="findItemByName(src.name)">
                        <a href="#" @click.prevent.stop="$emit('navigateToItem', findItemByName(src.name).id)">{{ t(src.name) }}</a>
                    </template>
                    <template v-else>
                        <span>{{ t(src.name) }}</span>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "MaterialsView",
    inject: ["t", "tName", "findItemByName"],
    props: {
        isMaterialsCategory: Boolean,
        items: { type: Array, default: () => [] },
    },
    emits: ["navigateToItem"],
};
</script>
