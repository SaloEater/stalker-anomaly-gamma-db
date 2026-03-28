<template>
    <div v-if="isOutfitExchange && outfitExchange" class="exchange-view">
        <div class="exchange-faction-chips">
            <button class="exchange-chip" :class="{ active: !exchangeFactionFilter }" @click="$emit('update:exchangeFactionFilter', null)">{{ t('app_label_all') }}</button>
            <button v-for="f in exchangeFactions" :key="f" class="exchange-chip" :class="{ active: exchangeFactionFilter === f }" @click="$emit('update:exchangeFactionFilter', exchangeFactionFilter === f ? null : f)">
                <img v-if="factionIcon(f)" :src="'img/' + factionIcon(f)" :alt="f" class="exchange-chip-icon">
                <span>{{ t(f) }}</span>
            </button>
        </div>
        <div class="tile-grid">
            <div v-for="ex in filteredExchanges" :key="ex.name + ex.sourceFaction" class="tile-card exchange-card">
                <div class="tile-card-header">
                    <a v-if="exchangeItemId(ex.name)" href="#" @click.prevent.stop="$emit('navigateToItem', exchangeItemId(ex.name))" class="tile-card-name">{{ t(ex.name) }}</a>
                    <span v-else class="tile-card-name">{{ t(ex.name) }}</span>
                    <span v-if="ex.sourceFaction" class="exchange-source-badge">{{ t(ex.sourceFaction) }}</span>
                </div>
                <div class="exchange-results">
                    <template v-for="f in exchangeVisibleFactions" :key="f">
                        <div v-if="ex.results[f]" class="exchange-result-row">
                            <span class="exchange-result-faction">
                                <img v-if="factionIcon(f)" :src="'img/' + factionIcon(f)" :alt="f" class="exchange-result-icon">
                                <span>{{ t(f) }}</span>
                            </span>
                            <span class="exchange-result-name">
                                <a v-if="exchangeItemId(ex.results[f])" href="#" @click.prevent.stop="$emit('navigateToItem', exchangeItemId(ex.results[f]))">{{ t(ex.results[f]) }}</a>
                                <span v-else>{{ t(ex.results[f]) }}</span>
                            </span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "OutfitExchangeView",
    inject: ["t", "factionIcon", "exchangeItemId"],
    props: {
        isOutfitExchange: Boolean,
        outfitExchange: [Object, null],
        exchangeFactionFilter: { type: [String, null], default: null },
        exchangeFactions: { type: Array, default: () => [] },
        exchangeVisibleFactions: { type: Array, default: () => [] },
        filteredExchanges: { type: Array, default: () => [] },
    },
    emits: ["update:exchangeFactionFilter", "navigateToItem"],
};
</script>
