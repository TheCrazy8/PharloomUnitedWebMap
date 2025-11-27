<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useData } from 'vitepress'

const { site } = useData()

const props = defineProps({
  initialLayer: {
    type: String,
    default: 'region'
  }
})

const activeLayer = ref(props.initialLayer)
const mapContainer = ref(null)
const hoveredRegion = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// Layer definitions for future expansion
const layers = [
  { id: 'region', name: 'Region Layer' },
  { id: 'diplomacy', name: 'Diplomacy Layer', placeholder: true }
]

// Region definitions with approximate coordinates (percentages for responsive design)
// Coordinates are in format: { x: %, y: %, width: %, height: % }
const regions = [
  { id: 'mosslands', name: 'Mosslands', x: 30, y: 72, width: 12, height: 8 },
  { id: 'bone-bottom', name: 'Bone Bottom', x: 32, y: 68, width: 6, height: 4 },
  { id: 'the-marrow', name: 'The Marrow', x: 42, y: 75, width: 10, height: 6 },
  { id: 'deep-docks', name: 'Deep Docks', x: 52, y: 72, width: 10, height: 6 },
  { id: 'hunters-march', name: 'Hunters March', x: 45, y: 68, width: 10, height: 5 },
  { id: 'far-fields', name: 'Far Fields', x: 58, y: 66, width: 8, height: 5 },
  { id: 'eastern-greymoor', name: 'Eastern Greymoor', x: 68, y: 62, width: 10, height: 6 },
  { id: 'western-greymoor', name: 'Western Greymoor', x: 55, y: 62, width: 10, height: 6 },
  { id: 'bellhart', name: 'Bellhart', x: 52, y: 58, width: 6, height: 4 },
  { id: 'shellwood', name: 'Shellwood', x: 75, y: 58, width: 10, height: 6 },
  { id: 'wormways', name: 'Wormways', x: 35, y: 52, width: 8, height: 6 },
  { id: 'steps-of-judgement', name: 'Steps of Judgement', x: 28, y: 56, width: 10, height: 6 },
  { id: 'order-of-karak', name: 'Order of Karak', x: 8, y: 56, width: 12, height: 8 },
  { id: 'choral-chambers', name: 'Choral Chambers', x: 45, y: 48, width: 8, height: 5 },
  { id: 'underworks', name: 'Underworks', x: 42, y: 42, width: 12, height: 8 },
  { id: 'cogwork-core', name: 'Cogwork Core', x: 55, y: 40, width: 8, height: 6 },
  { id: 'high-halls', name: 'High Halls', x: 48, y: 36, width: 10, height: 6 },
  { id: 'whiteward', name: 'Whiteward', x: 52, y: 48, width: 6, height: 4 },
  { id: 'memorium', name: 'Memorium', x: 60, y: 42, width: 6, height: 5 },
  { id: 'whispering-vaults', name: 'Whispering Vaults', x: 68, y: 42, width: 8, height: 6 },
  { id: 'flies-peoples-republic', name: 'Flies People\'s Republic', x: 32, y: 38, width: 8, height: 6 },
  { id: 'the-cradle', name: 'The Cradle', x: 45, y: 32, width: 8, height: 5 },
  { id: 'sinners-road', name: 'Sinners Road', x: 35, y: 32, width: 8, height: 5 },
  { id: 'bilewater', name: 'Bilewater', x: 62, y: 52, width: 8, height: 5 },
  { id: 'exhaust-organ', name: 'Exhaust Organ', x: 20, y: 42, width: 8, height: 5 },
  { id: 'pharloom-labs', name: 'Pharloom Labs', x: 70, y: 52, width: 6, height: 4 },
  { id: 'putrified-ducts', name: 'Putrified Ducts', x: 75, y: 48, width: 8, height: 6 },
  { id: 'fleatopia', name: 'Fleatopia', x: 8, y: 74, width: 10, height: 6 },
  { id: 'mythfalls', name: 'Mythfalls', x: 72, y: 56, width: 6, height: 4 },
  { id: 'verdania', name: 'Verdania', x: 78, y: 50, width: 8, height: 5 },
  { id: 'fields-of-eucor', name: 'Fields of Eucor', x: 82, y: 45, width: 8, height: 5 },
  { id: 'mount-fay', name: 'Mount Fay', x: 18, y: 36, width: 10, height: 6 },
  { id: 'last-oasis', name: 'Last Oasis', x: 15, y: 50, width: 8, height: 5 },
  { id: 'vermilion-depths', name: 'Vermilion Depths', x: 82, y: 62, width: 8, height: 6 },
  { id: 'weavenests', name: 'Weavenests', x: 88, y: 56, width: 6, height: 5 },
  { id: 'wisp-thicket', name: 'Wisp Thicket', x: 85, y: 38, width: 8, height: 6 },
  { id: 'pharlooms-hive', name: 'Pharloom\'s Hive', x: 25, y: 42, width: 6, height: 5 },
  { id: 'the-kingdom-above', name: 'The Kingdom Above', x: 42, y: 5, width: 12, height: 8 },
  { id: 'nameless-town', name: 'Nameless Town', x: 72, y: 38, width: 6, height: 4 },
  { id: 'voltnest', name: 'Voltnest', x: 78, y: 28, width: 8, height: 6 },
  { id: 'frosted-prairie', name: 'Frosted Prairie', x: 22, y: 55, width: 8, height: 5 },
  { id: 'silver-wastes', name: 'Silver Wastes', x: 12, y: 45, width: 8, height: 5 },
  { id: 'fern-forest', name: 'Fern Forest', x: 52, y: 22, width: 10, height: 8 },
  { id: 'the-abyss', name: 'The Abyss', x: 48, y: 85, width: 8, height: 10 }
]

function setLayer(layerId) {
  activeLayer.value = layerId
}

function navigateToRegion(regionId) {
  // Convert region id to the format used in the details elements
  const detailsName = regionId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  // Find and open the corresponding details element
  const allDetails = document.querySelectorAll('details.details')
  
  for (const details of allDetails) {
    const summary = details.querySelector('summary')
    if (summary && summary.textContent.trim() === detailsName) {
      // Close all other details
      allDetails.forEach(d => {
        if (d !== details) {
          d.removeAttribute('open')
        }
      })
      
      // Open this details
      details.setAttribute('open', '')
      
      // Scroll to the details element
      nextTick(() => {
        details.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      break
    }
  }
}

function handleMouseMove(event, region) {
  hoveredRegion.value = region
  const rect = mapContainer.value.getBoundingClientRect()
  tooltipPosition.value = {
    x: event.clientX - rect.left + 10,
    y: event.clientY - rect.top - 30
  }
}

function handleMouseLeave() {
  hoveredRegion.value = null
}
</script>

<template>
  <div class="interactive-map-wrapper">
    <!-- Layer Toggle Controls -->
    <div class="layer-controls">
      <span class="layer-label">Map Layers:</span>
      <button
        v-for="layer in layers"
        :key="layer.id"
        :class="['layer-btn', { active: activeLayer === layer.id, placeholder: layer.placeholder }]"
        @click="setLayer(layer.id)"
        :disabled="layer.placeholder"
        :title="layer.placeholder ? 'Coming Soon' : `Switch to ${layer.name}`"
      >
        {{ layer.name }}
        <span v-if="layer.placeholder" class="coming-soon">(Coming Soon)</span>
      </button>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map-container">
      <!-- Region Layer -->
      <div v-show="activeLayer === 'region'" class="map-layer region-layer">
        <img :src="site.base + 'Pharloom.png'" alt="Pharloom Region Map" class="map-image" />
        
        <!-- SVG Overlay for clickable regions -->
        <svg class="region-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect
            v-for="region in regions"
            :key="region.id"
            :x="region.x"
            :y="region.y"
            :width="region.width"
            :height="region.height"
            class="region-hitbox"
            @click="navigateToRegion(region.id)"
            @mousemove="handleMouseMove($event, region)"
            @mouseleave="handleMouseLeave"
          />
        </svg>
        
        <!-- Tooltip -->
        <div 
          v-if="hoveredRegion" 
          class="region-tooltip"
          :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }"
        >
          {{ hoveredRegion.name }}
        </div>
      </div>

      <!-- Diplomacy Layer (Placeholder) -->
      <div v-show="activeLayer === 'diplomacy'" class="map-layer diplomacy-layer">
        <div class="placeholder-message">
          <p>🗺️ Diplomacy Layer</p>
          <p>Coming Soon!</p>
        </div>
      </div>
    </div>

    <p class="map-hint">💡 Click on a region to view its details below</p>
  </div>
</template>

<style scoped>
.interactive-map-wrapper {
  margin: 1.5rem 0;
}

.layer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.layer-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-right: 0.5rem;
}

.layer-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.layer-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand);
  color: var(--vp-c-brand);
}

.layer-btn.active {
  background: var(--vp-c-brand);
  border-color: var(--vp-c-brand);
  color: white;
}

.layer-btn.placeholder {
  opacity: 0.6;
  cursor: not-allowed;
}

.coming-soon {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-left: 0.25rem;
}

.map-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.map-layer {
  position: relative;
  width: 100%;
}

.map-image {
  display: block;
  width: 100%;
  height: auto;
}

.region-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.region-hitbox {
  fill: transparent;
  stroke: transparent;
  cursor: pointer;
  pointer-events: all;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.region-hitbox:hover {
  fill: rgba(255, 255, 255, 0.15);
  stroke: rgba(255, 255, 255, 0.5);
  stroke-width: 0.2;
}

.region-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.placeholder-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 1.25rem;
  text-align: center;
}

.placeholder-message p {
  margin: 0.5rem 0;
}

.map-hint {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>
