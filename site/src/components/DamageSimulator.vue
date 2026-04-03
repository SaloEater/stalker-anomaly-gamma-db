<template>
<div class="damage-sim">
  <div class="damage-sim-topbar">
    <div class="damage-sim-credit">
      <LucideHeart :size="12" />
      <span>Based on veerserif's damage <a href="https://github.com/veerserif/gamma-dashboard" target="_blank" rel="noopener">calculator</a>.</span>
    </div>
    <div class="damage-sim-actions">
      <button class="copy-link-btn" :class="{ copied: _shareFeedback }" @click="copyShareLink()" v-tooltip="_shareFeedback ? t('app_sim_link_copied') : t('app_sim_copy_link')">
        <LucideLink v-show="!_shareFeedback" :size="16" />
        <svg v-show="_shareFeedback" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <button class="copy-link-btn" @click="resetAll()" v-tooltip="t('app_sim_reset')">
        <LucideTrash2 :size="16" />
      </button>
    </div>
  </div>
  <div class="damage-sim-columns">

    <!-- Left: Inputs -->
    <div class="damage-sim-panel">
      <!-- Loadout A & B -->
      <div v-for="(lo, idx) in loadouts" :key="idx" class="damage-sim-loadout-group">
        <div class="damage-sim-loadout-row">
          <div class="damage-sim-loadout-col">
            <div class="damage-sim-section-label">{{ t('app_sim_weapon') }}</div>
            <div class="damage-sim-slot" :class="lo.weapon ? 'filled damage-sim-slot-weapon' : 'empty'" @click="openWeaponPicker(idx)" @mouseenter="lo.weapon && $emit('showBuildHover', lo.weapon, $event)" @mousemove="lo.weapon && $emit('moveBuildHover', $event)" @mouseleave="$emit('hideBuildHover')">
              <span v-if="lo.weapon" class="damage-sim-slot-name">{{ tName(lo.weapon) }}</span>
              <span v-if="lo.weapon" class="damage-sim-slot-meta">{{ lo.weapon.id }}</span>
              <span v-if="!lo.weapon" class="damage-sim-slot-hint">{{ t('app_sim_select_weapon') }}</span>
              <button v-if="lo.weapon" class="damage-sim-slot-remove" @click.stop="clearWeapon(idx)">&times;</button>
            </div>
          </div>
          <div class="damage-sim-loadout-col">
            <div class="damage-sim-section-label">{{ t('app_sim_ammo') }}</div>
            <div class="damage-sim-ammo-row">
              <div class="damage-sim-slot" :class="[!lo.weapon ? 'empty disabled' : selectedAmmoFor(idx) ? 'filled damage-sim-slot-ammo' : 'empty']" @click="lo.weapon && openAmmoPicker(idx)" @mouseenter="selectedAmmoFor(idx) && $emit('showBuildHover', selectedAmmoFor(idx), $event)" @mousemove="selectedAmmoFor(idx) && $emit('moveBuildHover', $event)" @mouseleave="$emit('hideBuildHover')">
                <span v-if="!lo.weapon" class="damage-sim-slot-hint">{{ t('app_sim_select_weapon_first') }}</span>
                <span v-else-if="selectedAmmoFor(idx)" class="damage-sim-slot-name">{{ shortAmmoName(tName(selectedAmmoFor(idx)!)) }}</span>
                <span v-else class="damage-sim-slot-hint">{{ t('app_sim_select_ammo') }}</span>
                <span v-if="selectedAmmoFor(idx)" class="damage-sim-slot-meta">{{ selectedAmmoFor(idx)!.id }}</span>
                <button v-if="selectedAmmoFor(idx)" class="damage-sim-slot-remove" @click.stop="clearAmmo(idx)">&times;</button>
              </div>
              <div class="damage-sim-silencer-toggle" @click="lo.silenced = !lo.silenced; saveToStorage()" v-tooltip="t('app_sim_silencer')">
                <span class="toggle-switch" :class="{ on: lo.silenced }"><span class="toggle-knob"></span></span>
                <span class="damage-sim-silencer-label">{{ t('app_sim_silencer') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="damage-sim-divider"></div>

      <!-- Target -->
      <div class="damage-sim-section-label">{{ t('app_sim_target') }}</div>
      <div class="damage-sim-toggle-group">
        <button :class="{ active: targetType === 'mutant' }" @click="targetType = 'mutant'; saveToStorage()">{{ t('app_sim_target_mutant') }}</button>
        <button :class="{ active: targetType === 'stalker' }" @click="targetType = 'stalker'; saveToStorage()">{{ t('app_sim_target_stalker') }}</button>
      </div>

      <template v-if="targetType === 'mutant'">
        <div class="damage-sim-slot" :class="selectedMutant ? 'filled' : 'empty'" @click="mutantPickerOpen = true">
          <template v-if="selectedMutant">
            <span class="damage-sim-slot-name">{{ mutantDisplayName(selectedMutant.id) }}</span>
            <span class="damage-sim-slot-meta">{{ selectedMutant.id }}</span>
            <button class="damage-sim-slot-remove" @click.stop="selectedMutantId = ''">&times;</button>
          </template>
          <template v-else>
            <span class="damage-sim-slot-hint">{{ t('app_sim_select_target') }}</span>
          </template>
        </div>
        <div class="damage-sim-section-label">{{ t('app_sim_hitzone') }}</div>
        <div class="damage-sim-toggle-group">
          <button v-for="z in mutantHitzones" :key="z" :class="{ active: hitzone === z }" @click="hitzone = z; saveToStorage()">{{ t('app_sim_hitzone_' + z) }}</button>
        </div>
      </template>

      <template v-if="targetType === 'stalker'">
        <div class="damage-sim-slot" :class="selectedNpcProfile ? 'filled' : 'empty'" @click="npcPickerOpen = true">
          <template v-if="selectedNpcProfile">
            <span class="damage-sim-slot-name">{{ npcProfileLabel(selectedNpcProfile) }}</span>
            <span class="damage-sim-slot-meta">Body {{ selectedNpcProfile.body_bonearmor }} / Head {{ selectedNpcProfile.head_bonearmor }}</span>
            <button class="damage-sim-slot-remove" @click.stop="selectedNpcProfileId = ''">&times;</button>
          </template>
          <template v-else>
            <span class="damage-sim-slot-hint">{{ t('app_sim_select_target') }}</span>
          </template>
        </div>
        <div class="damage-sim-section-label">{{ t('app_sim_hitzone') }}</div>
        <div class="damage-sim-toggle-group">
          <button v-for="z in stalkerHitzones" :key="z" :class="{ active: hitzone === z }" @click="hitzone = z; saveToStorage()">{{ t('app_sim_hitzone_' + z) }}</button>
        </div>
        <div class="damage-sim-section-label">{{ t('app_sim_faction') }}</div>
        <div class="damage-sim-toggle-group">
          <button :class="{ active: faction === 'default' }" @click="faction = 'default'; saveToStorage()">{{ t('app_sim_faction_default') }}</button>
          <button v-for="f in factions" :key="f" :class="{ active: faction === f }" @click="faction = f; saveToStorage()">{{ t('app_sim_faction_' + f) }}</button>
        </div>
      </template>

      <div class="damage-sim-divider"></div>

      <div class="damage-sim-section-label">{{ t('app_sim_distance') }}</div>
      <div class="damage-sim-range-row">
        <input type="range" v-model.number="distance" min="0" max="300" step="5" @change="saveToStorage()" />
        <span class="damage-sim-range-value">{{ distance }}m</span>
      </div>

      <div class="damage-sim-section-label">{{ t('app_sim_barrel_condition') }}</div>
      <div class="damage-sim-range-row">
        <input type="range" v-model.number="barrelCondition" min="0" max="100" step="1" @change="saveToStorage()" />
        <span class="damage-sim-range-value">{{ barrelCondition }}%</span>
      </div>

      <div class="damage-sim-section-label">{{ t('app_sim_difficulty') }}</div>
      <div class="damage-sim-toggle-group">
        <button v-for="d in difficulties" :key="d.key" :class="{ active: difficulty === d.key }" @click="difficulty = d.key; saveToStorage()">{{ t(d.label) }}</button>
      </div>

    </div>

    <!-- Right: Results (side by side when comparing) -->
    <div class="damage-sim-panel">
      <div v-if="results[0] || results[1]" class="damage-sim-results-grid" :class="{ 'damage-sim-results-single': !hasComparison }">
        <!-- Column headers -->
        <template v-if="hasComparison">
          <div class="damage-sim-results-col-header damage-sim-color-0">{{ loadoutLabel(0) }}</div>
          <div class="damage-sim-results-col-header damage-sim-color-1">{{ loadoutLabel(1) }}</div>
        </template>

        <!-- Mutant results: one card per loadout -->
        <template v-if="targetType === 'mutant'">
          <template v-for="(res, idx) in results" :key="'mut'+idx">
            <div v-if="res?.mutant" class="damage-sim-stats-box">
              <div class="damage-sim-compact-stats">
                <div class="damage-sim-compact-row damage-sim-compact-row-primary">
                  <span class="damage-sim-compact-label">{{ t('app_sim_result_damage') }}</span>
                  <span class="damage-sim-compact-value">{{ fmt(res.mutant.damage) }} <span v-if="hasComparison && compareDelta(idx, 'damage')" class="damage-sim-compare-tag" :class="compareClass(idx, 'damage')">{{ compareDelta(idx, 'damage') }}</span></span>
                </div>
                <div v-if="res.mutant.critMult > 1" class="damage-sim-compact-row">
                  <span class="damage-sim-compact-label"></span>
                  <span><span class="damage-sim-crit-badge">{{ t('app_sim_result_crit') }} x{{ res.mutant.critMult }}</span></span>
                </div>
                <div class="damage-sim-compact-divider"></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_raw_damage') }}</span><span>{{ fmt(res.mutant.rawDmg) }} <span :class="breakdownArrowClass(idx, mutantBreakdownVal(0, 'rawDmg'), mutantBreakdownVal(1, 'rawDmg'))">{{ breakdownArrow(idx, mutantBreakdownVal(0, 'rawDmg'), mutantBreakdownVal(1, 'rawDmg')) }}</span></span></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_air_res') }}</span><span>&divide; {{ fmt(res.mutant.airDiv) }} <span :class="breakdownArrowClass(idx, mutantBreakdownVal(0, 'airDiv'), mutantBreakdownVal(1, 'airDiv'), false)">{{ breakdownArrow(idx, mutantBreakdownVal(0, 'airDiv'), mutantBreakdownVal(1, 'airDiv'), false) }}</span></span></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_ammo_mult') }}</span><span>&times; {{ res.mutant.ammoMult }} <span :class="breakdownArrowClass(idx, mutantBreakdownVal(0, 'ammoMult'), mutantBreakdownVal(1, 'ammoMult'))">{{ breakdownArrow(idx, mutantBreakdownVal(0, 'ammoMult'), mutantBreakdownVal(1, 'ammoMult')) }}</span></span></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_spec_mult') }}</span><span>&times; {{ res.mutant.specMult }}</span></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_bone_mult') }}</span><span>&times; {{ res.mutant.boneMult }}</span></div>
                <div class="damage-sim-stat-row"><span>{{ t('app_sim_barrel') }}</span><span>&times; {{ fmt(res.mutant.barrel) }}</span></div>
              </div>
            </div>
            <div v-else-if="hasComparison" class="damage-sim-results-cell-empty"></div>
          </template>
        </template>

        <!-- Stalker results: one card per loadout -->
        <template v-if="targetType === 'stalker'">
          <template v-for="(res, idx) in results" :key="'stk'+idx">
            <div v-if="res?.stalker" class="damage-sim-stats-box">
              <div class="damage-sim-compact-stats">
                <div class="damage-sim-compact-row">
                  <span class="damage-sim-compact-label">{{ t('app_sim_result_ap') }}</span>
                  <span class="damage-sim-compact-value-row">
                    <span class="damage-sim-compact-value">{{ fmt(res.stalker.ap) }}</span>
                    <span class="damage-sim-compact-vs">vs</span>
                    <span class="damage-sim-compact-value">{{ fmt(res.stalker.boneArmor) }}</span>
                    <span class="damage-sim-pen-badge" :class="res.stalker.armor.penetrated ? 'pen' : 'nopen'">{{ res.stalker.armor.penetrated ? t('app_sim_result_pen') : t('app_sim_result_no_pen') }}</span>
                  </span>
                </div>
                <div class="damage-sim-compact-row damage-sim-compact-row-primary">
                  <span class="damage-sim-compact-label">{{ t('app_sim_result_damage') }}</span>
                  <span class="damage-sim-compact-value">{{ fmt(res.stalker.armor.damage) }} <span v-if="hasComparison && compareDelta(idx, 'damage')" class="damage-sim-compare-tag" :class="compareClass(idx, 'damage')">{{ compareDelta(idx, 'damage') }}</span></span>
                </div>
                <div v-if="res.stalker.armor.minDamage !== undefined" class="damage-sim-compact-row">
                  <span class="damage-sim-compact-label">{{ t('app_sim_non_pen_range') }}</span>
                  <span class="damage-sim-compact-value-sm">{{ fmt(res.stalker.armor.minDamage) }} &ndash; {{ fmt(res.stalker.armor.maxDamage) }}</span>
                </div>
                <div class="damage-sim-compact-row">
                  <span class="damage-sim-compact-label">{{ t('app_sim_result_stk') }}</span>
                  <span class="damage-sim-compact-value">{{ res.stalker.stk.stk }}<span v-if="res.stalker.stk.minStk !== res.stalker.stk.maxStk" class="damage-sim-stat-range"> ({{ res.stalker.stk.minStk }}&ndash;{{ res.stalker.stk.maxStk }})</span> <span v-if="hasComparison && compareDelta(idx, 'stk')" class="damage-sim-compare-tag" :class="compareClass(idx, 'stk')">{{ compareDelta(idx, 'stk') }}</span></span>
                </div>
                <div v-if="res.stalker.stp > 1" class="damage-sim-compact-row">
                  <span class="damage-sim-compact-label">{{ t('app_sim_result_stp') }}</span>
                  <span class="damage-sim-compact-value">{{ res.stalker.stp }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="hasComparison" class="damage-sim-results-cell-empty"></div>
          </template>

          <!-- Breakdown -->
          <div class="damage-sim-results-row-label">{{ t('app_sim_breakdown') }}</div>
            <template v-for="(res, idx) in results" :key="'brk'+idx">
              <div v-if="res?.stalker?.breakdown" class="damage-sim-stats-box">
                <div class="damage-sim-stats-body">
                  <div class="damage-sim-breakdown-section">{{ t('app_sim_result_damage') }}</div>
                  <div class="damage-sim-stat-rows">
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_hit_power') }}</span><span>{{ fmt(res.stalker.breakdown.hitPower) }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'hitPower'), stalkerBreakdownVal(1, 'hitPower'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'hitPower'), stalkerBreakdownVal(1, 'hitPower')) }}</span></span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_air_res') }}</span><span>&divide; {{ fmt(res.stalker.breakdown.airDiv) }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_k_hit') }}</span><span>&times; {{ res.stalker.breakdown.kHit }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'kHit'), stalkerBreakdownVal(1, 'kHit'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'kHit'), stalkerBreakdownVal(1, 'kHit')) }}</span></span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_bone_mult') }}</span><span>&times; {{ res.stalker.breakdown.boneDmgMult }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_ap_scale') }}</span><span>&times; {{ res.stalker.breakdown.apScale }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_barrel') }}</span><span>&times; {{ fmt(res.stalker.breakdown.barrel) }}</span></div>
                    <div v-if="res.stalker.breakdown.factionDmgRes !== 1" class="damage-sim-stat-row"><span>{{ t('app_sim_faction_dmg') }}</span><span>&times; {{ res.stalker.breakdown.factionDmgRes }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_difficulty') }}</span><span>&times; {{ res.stalker.breakdown.diffMult }}</span></div>
                    <div v-if="res.stalker.breakdown.ammoMult !== 1" class="damage-sim-stat-row"><span>{{ t('app_sim_ammo_mult') }}</span><span>&times; {{ res.stalker.breakdown.ammoMult }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'ammoMult'), stalkerBreakdownVal(1, 'ammoMult'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'ammoMult'), stalkerBreakdownVal(1, 'ammoMult')) }}</span></span></div>
                    <div v-if="res.stalker.breakdown.silencerMult !== 1" class="damage-sim-stat-row"><span>{{ t('app_sim_silencer_mult') }}</span><span>&times; {{ res.stalker.breakdown.silencerMult }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'silencerMult'), stalkerBreakdownVal(1, 'silencerMult'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'silencerMult'), stalkerBreakdownVal(1, 'silencerMult')) }}</span></span></div>
                    <div v-if="res.stalker.breakdown.pellets > 1" class="damage-sim-stat-row"><span>{{ t('app_sim_pellets') }}</span><span>&times; {{ res.stalker.breakdown.pellets }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'pellets'), stalkerBreakdownVal(1, 'pellets'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'pellets'), stalkerBreakdownVal(1, 'pellets')) }}</span></span></div>
                    <div class="damage-sim-stat-row damage-sim-stat-row-total"><span>{{ t('app_sim_raw_damage') }}</span><span>{{ fmt(res.stalker.rawDmg) }} <span :class="breakdownArrowClass(idx, results[0]?.stalker?.rawDmg, results[1]?.stalker?.rawDmg)">{{ breakdownArrow(idx, results[0]?.stalker?.rawDmg, results[1]?.stalker?.rawDmg) }}</span></span></div>
                  </div>
                  <div class="damage-sim-breakdown-section">{{ t('app_sim_result_ap') }}</div>
                  <div class="damage-sim-stat-rows">
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_base_ap') }}</span><span>{{ fmt(res.stalker.breakdown.kAp) }} <span :class="breakdownArrowClass(idx, stalkerBreakdownVal(0, 'kAp'), stalkerBreakdownVal(1, 'kAp'))">{{ breakdownArrow(idx, stalkerBreakdownVal(0, 'kAp'), stalkerBreakdownVal(1, 'kAp')) }}</span></span></div>
                    <div v-if="res.stalker.breakdown.apBoost" class="damage-sim-stat-row"><span>{{ t('app_sim_ap_boost') }}</span><span>+ {{ res.stalker.breakdown.apBoost }}</span></div>
                    <div v-if="res.stalker.breakdown.sniperBoost" class="damage-sim-stat-row"><span>{{ t('app_sim_sniper_boost') }}</span><span>+ {{ res.stalker.breakdown.sniperBoost }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_ap_scale') }}</span><span>&times; {{ res.stalker.breakdown.apScale }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_barrel') }}</span><span>&times; {{ fmt(res.stalker.breakdown.barrel) }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_air_res') }}</span><span>&divide; {{ fmt(res.stalker.breakdown.airDiv) }}</span></div>
                    <div v-if="res.stalker.breakdown.factionApRes !== 1" class="damage-sim-stat-row"><span>{{ t('app_sim_faction_ap') }}</span><span>&times; {{ res.stalker.breakdown.factionApRes }}</span></div>
                    <div class="damage-sim-stat-row"><span>{{ t('app_sim_difficulty') }}</span><span>&times; {{ res.stalker.breakdown.diffMult }}</span></div>
                    <div class="damage-sim-stat-row damage-sim-stat-row-total"><span>{{ t('app_sim_result_ap') }}</span><span>{{ fmt(res.stalker.ap) }} <span :class="breakdownArrowClass(idx, results[0]?.stalker?.ap, results[1]?.stalker?.ap)">{{ breakdownArrow(idx, results[0]?.stalker?.ap, results[1]?.stalker?.ap) }}</span></span></div>
                  </div>
                  <div class="damage-sim-breakdown-section">{{ t('app_sim_armor_result') }}</div>
                  <div class="damage-sim-stat-rows">
                    <div class="damage-sim-stat-row">
                      <span v-if="res.stalker.armor.penetrated">{{ t('app_sim_armor_full_pen') }}</span>
                      <span v-else-if="res.stalker.armor.partialPen">{{ t('app_sim_armor_partial_pen') }}</span>
                      <span v-else>{{ t('app_sim_armor_no_pen') }}</span>
                      <span>{{ fmt(res.stalker.armor.damage) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="hasComparison" class="damage-sim-results-cell-empty"></div>
            </template>
        </template>
      </div>

      <div v-else class="damage-sim-empty-state">
        <LucideCrosshair :size="32" />
        <p>{{ t('app_sim_select_all') }}</p>
      </div>
    </div>

  </div>

  <!-- Picker Modals -->
  <ItemPickerModal :open="weaponPickerSlot >= 0" :title="t('app_sim_weapon')" :placeholder="t('app_sim_search_weapon')" :empty-text="t('app_sim_no_results')" :items="allWeapons" :label-fn="(w: any) => tName(w) || w.id" :filter-fn="weaponFilter" @close="weaponPickerSlot = -1" @select="selectWeapon">
    <template #item="{ item }">
      <span class="build-picker-item-name">{{ tName(item) }}</span>
      <span class="build-picker-item-type build-picker-type-weapon">{{ item.id }}</span>
    </template>
  </ItemPickerModal>

  <ItemPickerModal :open="ammoPickerSlot >= 0" :title="t('app_sim_ammo')" :placeholder="t('app_sim_search_ammo')" :empty-text="t('app_sim_no_results')" :items="activePickerAmmo" :label-fn="(a: any) => tName(a) || a.id" :filter-fn="ammoFilter" @close="ammoPickerSlot = -1" @select="selectAmmo">
    <template #item="{ item }">
      <span class="build-picker-item-name">{{ tName(item) }}</span>
      <span v-if="isAltAmmoForSlot(item)" class="badge-ammo badge-ammo-alt ammo-alt-tag">ALT</span>
      <span class="build-picker-item-type build-picker-type-ammo">{{ item.id }}</span>
    </template>
  </ItemPickerModal>

  <ItemPickerModal :open="mutantPickerOpen" :title="t('app_sim_target_mutant')" :placeholder="t('app_sim_search_mutant')" :empty-text="t('app_sim_no_results')" :items="uniqueMutants" :label-fn="(m: any) => mutantDisplayName(m.id)" @close="mutantPickerOpen = false" @select="selectMutant" />

  <ItemPickerModal :open="npcPickerOpen" :title="t('app_sim_armor_profile')" :placeholder="t('app_sim_search_armor')" :empty-text="t('app_sim_no_results')" :items="uniqueNpcProfiles" :label-fn="(p: any) => npcProfileLabel(p)" @close="npcPickerOpen = false" @select="selectNpcProfile">
    <template #item="{ item }">
      <span class="build-picker-item-name">{{ npcProfileLabel(item) }}</span>
      <span class="build-picker-item-type">Body {{ item.body_bonearmor }} / Head {{ item.head_bonearmor }}</span>
    </template>
  </ItemPickerModal>

</div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { calcMutantDamage, calcStalkerDetailed, stalkerArmorCalc,
         stalkerShotsToKill, stalkerArmorGroup, shotsToPen, resolveHpNoPenPenalty } from '../../js/damage-calc.js';
import ItemPickerModal from './modals/ItemPickerModal.vue';

interface GameItem {
  id: string;
  pda_encyclopedia_name?: string;
  displayName?: string;
  localeName?: string;
  ui_ammo_types?: string;
  st_data_export_ammo_types_alt?: string;
  st_data_export_hit_power?: string;
  st_data_export_k_hit?: string;
  st_data_export_k_ap?: string;
  st_data_export_k_air_resistance?: string;
  st_data_export_projectiles?: string;
  [key: string]: unknown;
}

interface MutantProfile {
  id: string;
  skin_armor: number;
  hit_fraction: number;
  fire_wound_immunity: number;
  hitzone_head: number;
  hitzone_torso: number;
  hitzone_limbs: number;
  hitzone_rear: number;
  [key: string]: unknown;
}

interface NpcArmorProfile {
  id: string;
  visual_item_id?: string;
  hit_fraction: number;
  ap_scale: number;
  body_bonearmor: number;
  head_bonearmor: number;
}

interface GboConstants {
  difficulty: Record<string, number>;
  [key: string]: unknown;
}

interface Loadout {
  weapon: GameItem | null;
  ammoId: string;
  silenced: boolean;
}

interface DifficultyOption {
  key: number;
  label: string;
}

export default defineComponent({
  name: 'DamageSimulator',
  components: { ItemPickerModal },
  props: {
    weaponCategories: { type: Object as PropType<Record<string, GameItem[]>>, default: () => ({}) },
    ammoItems: { type: Array as PropType<GameItem[]>, default: () => [] },
    mutantProfiles: { type: Array as PropType<MutantProfile[]>, default: () => [] },
    npcArmorProfiles: { type: Array as PropType<NpcArmorProfile[]>, default: () => [] },
    gboConstants: { type: Object as PropType<GboConstants>, default: () => ({}) },
    calibersData: { type: Object, default: () => ({}) },
    hideNoDrop: { type: Boolean, default: true },
    hideUnusedAmmo: { type: Boolean, default: true },
    ammoWeaponsCache: { type: Object as PropType<Record<string, any[]>>, default: () => ({}) },
  },
  emits: ['showBuildHover', 'moveBuildHover', 'hideBuildHover'],
  inject: ['t', 'tName', 'shortAmmoName'],
  data() {
    return {
      loadouts: [
        { weapon: null, ammoId: '', silenced: false },
        { weapon: null, ammoId: '', silenced: false },
      ] as Loadout[],
      targetType: 'stalker' as 'mutant' | 'stalker',
      selectedMutantId: '',
      selectedNpcProfileId: '',
      hitzone: 'torso',
      faction: 'default',
      distance: 25,
      barrelCondition: 100,
      difficulty: 3,
      weaponPickerSlot: -1,
      ammoPickerSlot: -1,
      mutantPickerOpen: false,
      npcPickerOpen: false,
      _shareFeedback: false as boolean,
    };
  },
  computed: {
    difficulties(): DifficultyOption[] {
      return [
        { key: 1, label: 'app_sim_difficulty_easy' },
        { key: 2, label: 'app_sim_difficulty_medium' },
        { key: 3, label: 'app_sim_difficulty_hard' },
        { key: 4, label: 'app_sim_difficulty_master' },
      ];
    },

    allWeapons(): GameItem[] {
      const slugs = ['pistols', 'smgs', 'shotguns', 'rifles', 'snipers'];
      const seen = new Set<string>();
      const weapons: GameItem[] = [];
      for (const slug of slugs) {
        const items = this.weaponCategories[slug];
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (!item.ui_ammo_types || seen.has(item.id)) continue;
          if (this.hideNoDrop && item.hasNpcWeaponDrop === false) continue;
          seen.add(item.id);
          weapons.push(item);
        }
      }
      return weapons.sort((a, b) => ((this as any).tName(a) || a.id).localeCompare((this as any).tName(b) || b.id));
    },

    activePickerAmmo(): GameItem[] {
      if (this.ammoPickerSlot < 0) return [];
      return this.compatibleAmmoFor(this.ammoPickerSlot);
    },

    uniqueMutants(): MutantProfile[] {
      const seen = new Map<string, MutantProfile>();
      for (const m of this.mutantProfiles) {
        const type = this.extractMutantType(m.id);
        if (!seen.has(type)) seen.set(type, m);
      }
      return [...seen.values()].sort((a, b) => this.mutantDisplayName(a.id).localeCompare(this.mutantDisplayName(b.id)));
    },

    uniqueNpcProfiles(): NpcArmorProfile[] {
      const seen = new Map<string, NpcArmorProfile>();
      for (const p of this.npcArmorProfiles) {
        const key = `${p.hit_fraction}_${p.ap_scale}_${p.body_bonearmor}_${p.head_bonearmor}`;
        if (!seen.has(key)) seen.set(key, p);
      }
      return [...seen.values()].sort((a, b) => this.npcProfileLabel(a).localeCompare(this.npcProfileLabel(b)));
    },

    selectedMutant(): MutantProfile | null {
      return this.mutantProfiles.find(m => m.id === this.selectedMutantId) || null;
    },

    selectedNpcProfile(): NpcArmorProfile | null {
      return this.npcArmorProfiles.find(p => p.id === this.selectedNpcProfileId) || null;
    },

    mutantHitzones(): string[] { return ['head', 'torso', 'limbs', 'rear']; },
    stalkerHitzones(): string[] { return ['head', 'torso', 'arms', 'legs']; },
    factions(): string[] { return ['greh', 'zombied', 'isg', 'monolith', 'bandit']; },

    results(): (Record<string, any> | null)[] {
      return [this.calcForSlot(0), this.calcForSlot(1)];
    },

    hasComparison(): boolean {
      return this.results[0] != null && this.results[1] != null;
    },
  },
  methods: {
    selectedAmmoFor(slot: number): GameItem | null {
      const id = this.loadouts[slot].ammoId;
      return id ? (this.ammoItems.find(a => a.id === id) || null) : null;
    },

    compatibleAmmoFor(slot: number): GameItem[] {
      const weapon = this.loadouts[slot].weapon;
      if (!weapon) return [];
      const types = (weapon.ui_ammo_types || '').split(';').map(s => s.trim()).filter(Boolean);
      const altTypes = (weapon.st_data_export_ammo_types_alt || '').split(';').map(s => s.trim()).filter(Boolean);
      const allTypes = [...types, ...altTypes];
      return this.ammoItems.filter(a => {
        const name = a.pda_encyclopedia_name || a.displayName || '';
        if (!allTypes.some(t => name === t || name.startsWith(t))) return false;
        if (this.hideUnusedAmmo && this.ammoWeaponsCache) {
          const weapons = this.ammoWeaponsCache[a.id];
          if (!weapons || weapons.length === 0) return false;
          if (this.hideNoDrop && !weapons.some((w: any) => !w.noDrop)) return false;
        }
        return true;
      }).sort((a, b) => ((this as any).tName(a) || a.id).localeCompare((this as any).tName(b) || b.id));
    },

    calcForSlot(slot: number): Record<string, any> | null {
      const gbo = this.gboConstants;
      if (!gbo || !gbo.difficulty) return null;
      const weapon = this.loadouts[slot].weapon;
      const ammo = this.selectedAmmoFor(slot);
      if (!weapon || !ammo) return null;

      if (this.targetType === 'mutant') {
        if (!this.selectedMutant) return null;
        const hitPower = parseFloat(weapon.st_data_export_hit_power || '');
        const kHit = parseFloat(ammo.st_data_export_k_hit || '');
        const kAirRes = parseFloat(ammo.st_data_export_k_air_resistance || '');
        const pellets = parseInt(ammo.st_data_export_projectiles || '1') || 1;
        if (isNaN(hitPower) || isNaN(kHit)) return null;
        return { mutant: calcMutantDamage({ hitPower, kHit, pellets, kAirRes, distance: this.distance, barrelCond: this.barrelCondition, difficulty: this.difficulty, ammoId: ammo.id, mutantId: this.selectedMutant.id, hitzone: this.hitzone, mutantProfile: this.selectedMutant, gbo }) };
      }

      if (this.targetType === 'stalker') {
        if (!this.selectedNpcProfile) return null;
        const hitPower = parseFloat(weapon.st_data_export_hit_power || '');
        const kHit = parseFloat(ammo.st_data_export_k_hit || '');
        const kAp = parseFloat(ammo.st_data_export_k_ap || '');
        const kAirRes = parseFloat(ammo.st_data_export_k_air_resistance || '');
        const pellets = parseInt(ammo.st_data_export_projectiles || '1') || 1;
        if (isNaN(hitPower) || isNaN(kHit) || isNaN(kAp)) return null;
        const npc = this.selectedNpcProfile;
        const commonParams = { hitPower, kHit, kAp, pellets, kAirRes, distance: this.distance, barrelCond: this.barrelCondition, difficulty: this.difficulty, ammoId: ammo.id, weaponId: weapon.id, hitzone: this.hitzone, faction: this.faction, silenced: this.loadouts[slot].silenced, apScale: npc.ap_scale };
        const detailed = calcStalkerDetailed({ ...commonParams, gbo });
        const armorGroup = stalkerArmorGroup(this.hitzone);
        const boneArmor = armorGroup === 'head' ? npc.head_bonearmor : npc.body_bonearmor;
        const hpPenalty = resolveHpNoPenPenalty(ammo.id, gbo);
        const armor = stalkerArmorCalc(detailed.ap, detailed.rawDmg, boneArmor, npc.hit_fraction, hpPenalty);
        const stp = shotsToPen(detailed.ap, boneArmor);
        const stk = stalkerShotsToKill(commonParams, npc, gbo);
        return { stalker: { ap: detailed.ap, rawDmg: detailed.rawDmg, boneArmor, armor, stp, stk, breakdown: detailed.breakdown } };
      }
      return null;
    },

    compareClass(idx: number, stat: string): string {
      if (!this.hasComparison) return '';
      const a = this.results[0];
      const b = this.results[1];
      if (!a || !b) return '';

      let valA: number | undefined;
      let valB: number | undefined;
      const higherIsBetter = stat !== 'stk';

      if (this.targetType === 'mutant') {
        if (stat === 'damage') { valA = a.mutant?.damage; valB = b.mutant?.damage; }
      } else {
        if (stat === 'damage') { valA = a.stalker?.armor?.damage; valB = b.stalker?.armor?.damage; }
        if (stat === 'stk') { valA = a.stalker?.stk?.stk; valB = b.stalker?.stk?.stk; }
      }

      if (valA == null || valB == null || valA === valB) return '';
      const isBetter = higherIsBetter ? (idx === 0 ? valA > valB : valB > valA) : (idx === 0 ? valA < valB : valB < valA);
      return isBetter ? 'damage-sim-better' : 'damage-sim-worse';
    },

    compareDelta(idx: number, stat: string): string {
      if (!this.hasComparison) return '';
      const a = this.results[0];
      const b = this.results[1];
      if (!a || !b) return '';

      let valA: number | undefined;
      let valB: number | undefined;

      if (this.targetType === 'mutant') {
        if (stat === 'damage') { valA = a.mutant?.damage; valB = b.mutant?.damage; }
      } else {
        if (stat === 'damage') { valA = a.stalker?.armor?.damage; valB = b.stalker?.armor?.damage; }
        if (stat === 'stk') { valA = a.stalker?.stk?.stk; valB = b.stalker?.stk?.stk; }
      }

      if (valA == null || valB == null || valA === valB) return '';
      const higherIsBetter = stat !== 'stk';
      const myVal = idx === 0 ? valA : valB;
      const otherVal = idx === 0 ? valB : valA;
      const diff = myVal - otherVal;
      const pct = otherVal !== 0 ? Math.round((diff / Math.abs(otherVal)) * 100) : 0;
      const isBetter = higherIsBetter ? diff > 0 : diff < 0;
      const arrow = isBetter ? '\u25B2' : '\u25BC';
      const sign = diff > 0 ? '+' : '';
      return `${arrow} ${sign}${pct}%`;
    },

    breakdownArrow(idx: number, valA: number | undefined, valB: number | undefined, higherIsBetter = true): string {
      if (!this.hasComparison || valA == null || valB == null || valA === valB) return '';
      const myVal = idx === 0 ? valA : valB;
      const otherVal = idx === 0 ? valB : valA;
      const isBetter = higherIsBetter ? myVal > otherVal : myVal < otherVal;
      return isBetter ? '\u25B2' : '\u25BC';
    },

    breakdownArrowClass(idx: number, valA: number | undefined, valB: number | undefined, higherIsBetter = true): string {
      if (!this.hasComparison || valA == null || valB == null || valA === valB) return '';
      const myVal = idx === 0 ? valA : valB;
      const otherVal = idx === 0 ? valB : valA;
      const isBetter = higherIsBetter ? myVal > otherVal : myVal < otherVal;
      return isBetter ? 'damage-sim-better' : 'damage-sim-worse';
    },

    mutantBreakdownVal(idx: number, key: string): number | undefined {
      return this.results[idx]?.mutant?.[key];
    },

    stalkerBreakdownVal(idx: number, key: string): number | undefined {
      return this.results[idx]?.stalker?.breakdown?.[key];
    },

    resetAll(): void {
      this.loadouts[0] = { weapon: null, ammoId: '', silenced: false };
      this.loadouts[1] = { weapon: null, ammoId: '', silenced: false };
      this.targetType = 'stalker';
      this.hitzone = 'torso';
      this.faction = 'default';
      this.distance = 25;
      this.barrelCondition = 100;
      this.difficulty = 3;
      // Restore defaults
      const sunrise = this.npcArmorProfiles.find(p =>
        p.visual_item_id === 'stalker_outfit' ||
        (p.visual_item_id?.startsWith('stalker_outfit') && !p.visual_item_id?.includes(',helm'))
      );
      this.selectedNpcProfileId = sunrise ? sunrise.id : '';
      const boar = this.mutantProfiles.find(p => p.id === 'boar_normal');
      this.selectedMutantId = boar ? boar.id : '';
      this.saveToStorage();
    },

    pushUrlParams(): void {
      const url = new URL(window.location.href);
      const p = url.searchParams;
      // Clear old sim params
      for (const k of ['w0','a0','s0','w1','a1','s1','tt','tid','hz','f','d','bc','df']) p.delete(k);
      // Set current state
      if (this.loadouts[0].weapon) p.set('w0', this.loadouts[0].weapon.id);
      if (this.loadouts[0].ammoId) p.set('a0', this.loadouts[0].ammoId);
      if (this.loadouts[0].silenced) p.set('s0', '1');
      if (this.loadouts[1].weapon) p.set('w1', this.loadouts[1].weapon.id);
      if (this.loadouts[1].ammoId) p.set('a1', this.loadouts[1].ammoId);
      if (this.loadouts[1].silenced) p.set('s1', '1');
      p.set('tt', this.targetType === 'mutant' ? 'm' : 's');
      const tid = this.targetType === 'mutant' ? this.selectedMutantId : this.selectedNpcProfileId;
      if (tid) p.set('tid', tid);
      if (this.hitzone !== 'torso') p.set('hz', this.hitzone);
      if (this.faction !== 'default') p.set('f', this.faction);
      if (this.distance !== 25) p.set('d', String(this.distance));
      if (this.barrelCondition !== 100) p.set('bc', String(this.barrelCondition));
      if (this.difficulty !== 3) p.set('df', String(this.difficulty));
      window.history.replaceState(null, '', url.toString());
    },

    restoreFromUrl(): boolean {
      const p = new URLSearchParams(window.location.search);
      if (!p.has('w0') && !p.has('tt')) return false;
      // Restore non-weapon state
      const tt = p.get('tt');
      if (tt === 'm') this.targetType = 'mutant';
      else if (tt === 's') this.targetType = 'stalker';
      const tid = p.get('tid');
      if (tid) {
        if (this.targetType === 'mutant') this.selectedMutantId = tid;
        else this.selectedNpcProfileId = tid;
      }
      if (p.has('hz')) this.hitzone = p.get('hz')!;
      if (p.has('f')) this.faction = p.get('f')!;
      if (p.has('d')) this.distance = parseInt(p.get('d')!) || 25;
      if (p.has('bc')) this.barrelCondition = parseInt(p.get('bc')!) || 100;
      if (p.has('df')) this.difficulty = parseInt(p.get('df')!) || 3;
      // Stash weapon/ammo IDs for deferred restore
      this._savedLoadouts = [
        { weaponId: p.get('w0') || '', ammoId: p.get('a0') || '', silenced: p.get('s0') === '1' },
        { weaponId: p.get('w1') || '', ammoId: p.get('a1') || '', silenced: p.get('s1') === '1' },
      ];
      this.restoreWeaponsFromStorage();
      return true;
    },

    async copyShareLink(): Promise<void> {
      this.pushUrlParams();
      try {
        await navigator.clipboard.writeText(window.location.href);
        this._shareFeedback = true;
        setTimeout(() => { this._shareFeedback = false; }, 2000);
      } catch { /* fallback: URL is already in address bar */ }
    },

    saveToStorage(): void {
      try {
        const state = {
          loadouts: this.loadouts.map(lo => ({ weaponId: lo.weapon?.id || '', ammoId: lo.ammoId, silenced: lo.silenced })),
          targetType: this.targetType,
          mutantId: this.selectedMutantId,
          npcProfileId: this.selectedNpcProfileId,
          hitzone: this.hitzone,
          faction: this.faction,
          distance: this.distance,
          barrelCondition: this.barrelCondition,
          difficulty: this.difficulty,
        };
        localStorage.setItem('damageSimState', JSON.stringify(state));
      } catch (e) { /* quota */ }
      this.pushUrlParams();
    },

    restoreFromStorage(): void {
      // URL params take priority (shared link)
      if (this.restoreFromUrl()) return;

      try {
        const raw = localStorage.getItem('damageSimState');
        if (raw) {
          const data = JSON.parse(raw);
          this._savedLoadouts = data.loadouts || null;
          if (data.targetType) this.targetType = data.targetType;
          if (data.hitzone) this.hitzone = data.hitzone;
          if (data.faction) this.faction = data.faction;
          if (data.distance != null) this.distance = data.distance;
          if (data.barrelCondition != null) this.barrelCondition = data.barrelCondition;
          if (data.difficulty != null) this.difficulty = data.difficulty;
          if (data.mutantId) this.selectedMutantId = data.mutantId;
          if (data.npcProfileId) this.selectedNpcProfileId = data.npcProfileId;
          // Try weapon restore now (may succeed if data already loaded)
          this.restoreWeaponsFromStorage();
          return;
        }
      } catch (e) { /* ignore */ }

      // Defaults when no saved state
      this._restored = true;
      const sunrise = this.npcArmorProfiles.find(p =>
        p.visual_item_id === 'stalker_outfit' ||
        (p.visual_item_id?.startsWith('stalker_outfit') && !p.visual_item_id?.includes(',helm'))
      );
      if (sunrise) this.selectedNpcProfileId = sunrise.id;

      const boar = this.mutantProfiles.find(p => p.id === 'boar_normal');
      if (boar) this.selectedMutantId = boar.id;
    },

    restoreWeaponsFromStorage(): void {
      const saved = (this as any)._savedLoadouts;
      if (!saved || this.allWeapons.length === 0) return;
      for (let i = 0; i < 2; i++) {
        const lo = saved[i];
        if (!lo) continue;
        if (lo.weaponId) {
          const weapon = this.allWeapons.find(w => w.id === lo.weaponId);
          if (weapon) this.loadouts[i].weapon = weapon;
        }
        if (lo.ammoId) this.loadouts[i].ammoId = lo.ammoId;
        if (lo.silenced != null) this.loadouts[i].silenced = lo.silenced;
      }
      this._restored = true;
      (this as any)._savedLoadouts = null;
    },

    isAltAmmoForSlot(ammoItem: GameItem): boolean {
      if (this.ammoPickerSlot < 0) return false;
      const weapon = this.loadouts[this.ammoPickerSlot].weapon;
      if (!weapon) return false;
      const altTypes = (weapon.st_data_export_ammo_types_alt || '').split(';').map(s => s.trim()).filter(Boolean);
      if (!altTypes.length) return false;
      const name = ammoItem.pda_encyclopedia_name || ammoItem.displayName || '';
      return altTypes.some(t => name === t || name.startsWith(t));
    },

    loadoutLabel(slot: number): string {
      const lo = this.loadouts[slot];
      if (!lo.weapon) return '';
      const wpn = (this as any).tName(lo.weapon) || lo.weapon.id;
      const ammo = this.selectedAmmoFor(slot);
      if (!ammo) return wpn;
      return wpn + ' + ' + (this as any).shortAmmoName((this as any).tName(ammo));
    },

    openWeaponPicker(slot: number): void { this.weaponPickerSlot = slot; },
    openAmmoPicker(slot: number): void { this.ammoPickerSlot = slot; },

    weaponFilter(w: GameItem, q: string): boolean {
      const name = (w.localeName || (this as any).tName(w) || w.id).toLowerCase();
      return name.includes(q) || w.id.toLowerCase().includes(q);
    },
    ammoFilter(a: GameItem, q: string): boolean {
      const name = (a.localeName || (this as any).tName(a) || a.id).toLowerCase();
      return name.includes(q) || a.id.toLowerCase().includes(q);
    },
    selectWeapon(w: GameItem): void {
      if (this.weaponPickerSlot >= 0) {
        this.loadouts[this.weaponPickerSlot].weapon = w;
        this.loadouts[this.weaponPickerSlot].ammoId = '';
        this.weaponPickerSlot = -1;
        this.saveToStorage();
      }
    },
    clearWeapon(slot: number): void {
      this.loadouts[slot].weapon = null;
      this.loadouts[slot].ammoId = '';
      this.saveToStorage();
    },
    selectAmmo(a: GameItem): void {
      if (this.ammoPickerSlot >= 0) {
        this.loadouts[this.ammoPickerSlot].ammoId = a.id;
        this.ammoPickerSlot = -1;
        this.saveToStorage();
      }
    },
    clearAmmo(slot: number): void {
      this.loadouts[slot].ammoId = '';
      this.saveToStorage();
    },
    selectMutant(m: MutantProfile): void {
      this.selectedMutantId = m.id;
      this.mutantPickerOpen = false;
      this.saveToStorage();
    },
    selectNpcProfile(p: NpcArmorProfile): void {
      this.selectedNpcProfileId = p.id;
      this.npcPickerOpen = false;
      this.saveToStorage();
    },
    fmt(n: number | null | undefined): string {
      if (n == null || isNaN(n)) return '\u2014';
      if (Math.abs(n) < 0.0001) return '0';
      return n < 1 ? n.toFixed(4) : n.toFixed(2);
    },
    extractMutantType(id: string): string {
      const match = id.match(/(?:m_|agru_|arena_)?([\w]+?)(?:_\d+|_normal|_strong|_weak|_e)?$/);
      return match ? match[1] : id;
    },
    mutantDisplayName(id: string): string {
      const type = this.extractMutantType(id);
      return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    },
    npcProfileLabel(p: NpcArmorProfile): string {
      const items = p.visual_item_id || '';
      const parts = items.split(',').map(s => {
        const key = s.trim() + '_name';
        const translated = (this as any).t(key);
        return translated !== key ? translated : s.trim().replace(/_/g, ' ');
      });
      return parts.join(' + ') || p.id.split('\\').pop() || p.id;
    },
  },
  mounted() {
    this.restoreFromStorage();
  },
  watch: {
    allWeapons(weapons: GameItem[]): void {
      if (weapons.length > 0 && !this._restored) {
        this.restoreWeaponsFromStorage();
      }
    },
  },
});
</script>

<style scoped>
.damage-sim {
  padding: 0 1rem 2rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.damage-sim-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.damage-sim-credit {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.6rem;
  color: var(--text-secondary);
}
.damage-sim-actions {
  display: flex;
  gap: 0.4rem;
}
.damage-sim-actions .copy-link-btn {
  border-radius: 4px;
}
.damage-sim-credit a {
  color: var(--accent-dim);
  text-decoration: none;
}
.damage-sim-credit a:hover {
  color: var(--accent);
  text-decoration: underline;
}
.damage-sim-credit svg {
  color: #d07a6e;
}
.damage-sim-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
@media (max-width: 900px) {
  .damage-sim-columns { grid-template-columns: 1fr; }
}

/* Panels */
.damage-sim-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Loadout groups */
.damage-sim-loadout-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.damage-sim-loadout-label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}
.damage-sim-color-0 { color: #5b8abd; }
.damage-sim-color-1 { color: #c89050; }

/* Loadout row: weapon + ammo side by side */
.damage-sim-loadout-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.damage-sim-loadout-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
@media (max-width: 600px) {
  .damage-sim-loadout-row { grid-template-columns: 1fr; }
}

/* Results grid: side by side comparison */
.damage-sim-results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem 0.75rem;
}
.damage-sim-results-single {
  grid-template-columns: 1fr;
}
.damage-sim-results-col-header {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
}
.damage-sim-results-row-label {
  grid-column: 1 / -1;
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent-dim);
  margin-top: 0.5rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid var(--border);
}
.damage-sim-results-cell-empty {
  min-height: 1rem;
}
@media (max-width: 900px) {
  .damage-sim-results-grid { grid-template-columns: 1fr; }
  .damage-sim-results-col-header { display: none; }
}

/* Comparison highlights */
.damage-sim-better { color: #6ec87a !important; }
.damage-sim-worse { color: #d07a6e !important; }

/* Compare tag (inline percentage delta) */
.damage-sim-compare-tag {
  font-family: var(--mono);
  font-size: 0.55rem;
  font-weight: 600;
  margin-left: 0.5rem;
  padding: 0.05rem 0.3rem;
  border-radius: 2px;
}
.damage-sim-compare-tag.damage-sim-better {
  background: rgba(110, 200, 122, 0.1);
}
.damage-sim-compare-tag.damage-sim-worse {
  background: rgba(208, 122, 110, 0.1);
}

/* Section labels */
.damage-sim-section-label {
  font-size: 0.55rem;
  color: var(--accent-dim);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* Ammo row: slot + silencer toggle inline */
.damage-sim-ammo-row {
  display: flex;
  align-items: stretch;
  gap: 0.5rem;
}
.damage-sim-ammo-row .damage-sim-slot {
  flex: 1;
  min-width: 0;
}
.damage-sim-silencer-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  cursor: pointer;
  padding: 0 0.25rem;
  flex-shrink: 0;
}
.damage-sim-silencer-label {
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Slots */
.damage-sim-slot {
  position: relative;
  border-radius: 4px;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  height: 2.8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
}
.damage-sim-slot.filled {
  background: var(--card-raised);
  border: 2px solid var(--border);
}
.damage-sim-slot.filled:hover {
  border-color: var(--accent-dim);
  background: rgba(200, 168, 78, 0.05);
}
.damage-sim-slot.empty {
  border: 2px dashed rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.damage-sim-slot.empty:hover {
  border-color: var(--accent-dim);
  background: rgba(200, 168, 78, 0.05);
}
.damage-sim-slot.disabled {
  opacity: 0.4;
  pointer-events: none;
}
.damage-sim-slot-weapon.filled { border-left: 3px solid #b85c5c; }
.damage-sim-slot-ammo.filled { border-left: 3px solid #8b8b5e; }
.damage-sim-slot-name {
  font-size: 0.7rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 1rem;
}
.damage-sim-slot-meta {
  font-size: 0.6rem;
  color: var(--text-secondary);
  margin-top: 0.05rem;
}
.damage-sim-slot-hint {
  font-size: 0.65rem;
  color: var(--text-secondary);
}
.damage-sim-slot-remove {
  position: absolute;
  top: 0.15rem;
  right: 0.3rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.15rem 0.25rem;
  border-radius: 3px;
  transition: color 0.15s, background 0.15s;
}
.damage-sim-slot-remove:hover {
  color: #f06a5e;
  background: rgba(240, 106, 94, 0.1);
}

/* Toggle groups */
.damage-sim-toggle-group {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.damage-sim-toggle-group button {
  flex: 1;
  padding: 0.3rem 0.4rem;
  border: none;
  background: var(--card);
  color: var(--text-secondary);
  font-size: 0.65rem;
  cursor: pointer;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
}
.damage-sim-toggle-group button + button {
  border-left: 1px solid var(--border);
}
.damage-sim-toggle-group button:hover {
  color: var(--text);
}
.damage-sim-toggle-group button.active {
  color: var(--accent);
  border-color: var(--accent-dim);
  background: rgba(200, 168, 78, 0.08);
}

/* Range rows */
.damage-sim-range-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.damage-sim-range-row input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
  height: 4px;
}
.damage-sim-range-value {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--text);
  min-width: 3rem;
  text-align: right;
}


/* Divider */
.damage-sim-divider {
  height: 1px;
  background: var(--border);
  margin: 0.25rem 0;
}

/* Stats boxes */
.damage-sim-stats-box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.damage-sim-stats-header {
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
}
.damage-sim-stats-body {
  padding: 0.5rem 0.6rem;
}
.damage-sim-big-value {
  font-family: var(--mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}
.damage-sim-stat-range {
  font-family: var(--mono);
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.1rem;
}
.damage-sim-ap-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}
.damage-sim-ap-vs {
  font-size: 0.6rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}

/* Pen badge */
.damage-sim-pen-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  margin-top: 0.35rem;
}
.damage-sim-pen-badge.pen {
  background: rgba(110, 200, 122, 0.12);
  color: #6ec87a;
}
.damage-sim-pen-badge.nopen {
  background: rgba(208, 122, 110, 0.12);
  color: #d07a6e;
}

/* Crit badge */
.damage-sim-crit-badge {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  margin-top: 0.35rem;
  background: rgba(200, 168, 78, 0.12);
  color: var(--accent);
}

/* Stat breakdown rows */
.damage-sim-stat-rows {
  padding: 0.25rem 0.6rem 0.4rem;
}
.damage-sim-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.15rem 0;
  border-bottom: 1px solid rgba(42, 42, 42, 0.5);
  font-size: 0.65rem;
}
.damage-sim-stat-row span:first-child {
  color: var(--text-secondary);
}
.damage-sim-stat-row span:last-child {
  font-family: var(--mono);
  text-align: right;
  color: var(--text);
}
.damage-sim-stat-row-total {
  border-top: 1px solid var(--border);
  margin-top: 0.15rem;
  padding-top: 0.25rem;
  font-weight: 600;
}
.damage-sim-stat-row-total span:first-child {
  color: var(--text);
}
.damage-sim-breakdown-section {
  font-size: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent-dim);
  margin-top: 0.4rem;
  margin-bottom: 0.15rem;
}
.damage-sim-breakdown-section:first-child {
  margin-top: 0;
}

/* Compact stats (single card per loadout) */
.damage-sim-compact-stats {
  padding: 0.4rem 0.6rem;
}
.damage-sim-compact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 0;
  gap: 0.5rem;
  min-width: 0;
}
.damage-sim-compact-row + .damage-sim-compact-row {
  border-top: 1px solid rgba(42, 42, 42, 0.5);
}
.damage-sim-compact-row-primary {
  padding: 0.3rem 0;
}
.damage-sim-compact-label {
  font-size: 0.55rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.damage-sim-compact-value {
  font-family: var(--mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}
.damage-sim-compact-row-primary .damage-sim-compact-value {
  font-size: 1rem;
}
.damage-sim-compact-value-sm {
  font-family: var(--mono);
  font-size: 0.65rem;
  color: var(--text-secondary);
}
.damage-sim-compact-value-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}
.damage-sim-compact-vs {
  font-size: 0.5rem;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.damage-sim-compact-divider {
  height: 1px;
  background: var(--border);
  margin: 0.25rem 0;
}
.damage-sim-compact-row .damage-sim-pen-badge {
  margin-top: 0;
  font-size: 0.5rem;
  padding: 0.05rem 0.3rem;
}
.damage-sim-compact-row .damage-sim-crit-badge {
  margin-top: 0;
}

/* Empty state */
.damage-sim-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  opacity: 0.5;
  grid-column: 1 / -1;
}
.damage-sim-empty-state p {
  font-size: 0.75rem;
  margin: 0;
}
</style>
