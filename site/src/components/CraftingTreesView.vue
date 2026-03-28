<template>
    <div v-if="isCraftingTrees" class="crafting-trees-view">
        <div class="crafting-trees-toolbar">
            <button class="filter-chip" @click="craftingTreeExpandAll ? $emit('collapseAllTrees') : $emit('expandAllTrees')">
                {{ craftingTreeExpandAll ? t('app_label_collapse_all') : t('app_label_expand_all') }}
            </button>
            <span class="item-count">{{ filteredCraftingTrees.length }} {{ t('app_label_recipes') }}</span>
        </div>
        <div class="tile-grid">
            <div v-for="tree in filteredCraftingTrees" :key="tree.id" class="tile-card crafting-tree-card">
                <div class="tile-card-header">
                    <a href="#" @click.prevent.stop="$emit('navigateToItem', tree.id)" class="tile-card-name">{{ t(tree.name) }}</a>
                </div>
                <div class="crafting-tree-body">
                    <div
                        v-for="(row, idx) in flattenTree(tree)"
                        :key="row.path"
                        class="tree-row"
                        :style="{ paddingLeft: (row.depth * 1.2 + 0.3) + 'rem' }"
                    >
                        <span
                            v-if="row.hasChildren"
                            class="tree-toggle"
                            @click.stop="$emit('toggleTreeNode', row.path)"
                        >{{ row.isExpanded ? '\u25BC' : '\u25B6' }}</span>
                        <span v-else class="tree-leaf-dot">&bull;</span>
                        <template v-if="row.itemRef">
                            <a href="#" @click.prevent.stop="$emit('navigateToItem', row.itemRef.id)">{{ t(row.name) }}</a>
                        </template>
                        <template v-else>
                            <span class="tree-raw">{{ t(row.name) }}</span>
                        </template>
                        <span class="recipe-ing-amount">{{ row.amount }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "CraftingTreesView",
    inject: ["t", "findItemByName"],
    props: {
        isCraftingTrees: Boolean,
        filteredCraftingTrees: { type: Array, default: () => [] },
        craftingTreeExpandAll: { type: Boolean, default: false },
        craftingTreeExpanded: { type: Set, default: () => new Set() },
    },
    emits: ["expandAllTrees", "collapseAllTrees", "toggleTreeNode", "navigateToItem"],
    methods: {
        flattenTree(tree) {
            const rows = [];
            const walk = (node, depth, parentPath) => {
                const path = parentPath ? `${parentPath}/${node.name}` : node.name;
                const hasChildren = node.children && node.children.length > 0;
                const isExpanded = this.craftingTreeExpandAll || this.craftingTreeExpanded.has(path);
                rows.push({
                    name: node.name,
                    id: node.id || null,
                    amount: node.amount,
                    depth,
                    hasChildren,
                    isExpanded,
                    path,
                    isRaw: node.isRaw,
                    itemRef: this.findItemByName(node.name),
                });
                if (hasChildren && isExpanded) {
                    for (const child of node.children) {
                        walk(child, depth + 1, path);
                    }
                }
            };
            if (tree.children) {
                for (const child of tree.children) {
                    walk(child, 0, "");
                }
            }
            return rows;
        },
    },
};
</script>
