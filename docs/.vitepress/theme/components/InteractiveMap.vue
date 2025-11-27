<script setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useData } from 'vitepress'
import { defaultLayers, defaultMapImage, defaultRegions } from '../data/mapData'

const { site } = useData()

const props = defineProps({
  initialLayer: {
    type: String,
    default: 'region'
  }
})

function cloneRegions(source) {
  return source.map(region => ({
    ...region,
    hitArea: region.hitArea ? { ...region.hitArea } : null
  }))
}

const activeLayer = ref(props.initialLayer)
const mapContainer = ref(null)
const hoveredRegion = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const customMapImage = ref('')
const layers = ref([...defaultLayers])
const regions = ref(cloneRegions(defaultRegions))
const polygonDrafts = ref({})

const displayedMap = computed(() => {
  if (customMapImage.value) {
    return customMapImage.value
  }
  return site.value.base + defaultMapImage
})

function setLayer(layerId) {
  activeLayer.value = layerId
}

function navigateToRegion(regionId) {
  // Find the region by ID to get its exact name
  const region = regions.value.find(r => r.id === regionId)
  if (!region) return
  
  const detailsName = region.name
  
  // Find and open the corresponding details element
  const allDetails = document.querySelectorAll('details.details')
  
  for (const details of allDetails) {
    const summary = details.querySelector('summary')
    if (summary && summary.textContent.trim().toLowerCase() === detailsName.toLowerCase()) {
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

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    return
  }
  const reader = new FileReader()
  reader.onload = e => {
    customMapImage.value = e.target.result
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pharloom-map-image', customMapImage.value)
    }
  }
  reader.readAsDataURL(file)
}

function resetCustomImage() {
  customMapImage.value = ''
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('pharloom-map-image')
  }
}

function resetRegionData() {
  regions.value = cloneRegions(defaultRegions)
  polygonDrafts.value = {}
}

function downloadRegionData() {
  const payload = JSON.stringify(regions.value, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'map-regions.json'
  link.click()
  URL.revokeObjectURL(url)
}

function handleRegionDataUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  file.text().then(text => {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        regions.value = cloneRegions(parsed)
      } else if (parsed?.regions) {
        regions.value = cloneRegions(parsed.regions)
      }
      polygonDrafts.value = {}
    } catch (err) {
      console.error('Unable to load region data', err)
    }
  })
}

function polygonString(region) {
  if (region.hitArea?.type !== 'polygon') {
    return ''
  }
  if (!polygonDrafts.value[region.id]) {
    polygonDrafts.value[region.id] = region.hitArea.points.map(point => point.join(',')).join(' ')
  }
  return polygonDrafts.value[region.id]
}

function handlePolygonInput(regionId, value) {
  polygonDrafts.value[regionId] = value
  const region = regions.value.find(r => r.id === regionId)
  if (!region) return
  const parsed = value
    .trim()
    .split(/\s+/)
    .map(pair => pair.split(',').map(Number))
    .filter(point => point.length === 2 && !Number.isNaN(point[0]) && !Number.isNaN(point[1]))
  if (parsed.length >= 3) {
    region.hitArea = {
      type: 'polygon',
      points: parsed
    }
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const cached = window.localStorage.getItem('pharloom-map-image')
    if (cached) {
      customMapImage.value = cached
    }
  }
})
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

    <div class="map-tools">
      <label class="upload-btn">
        <span>Upload map image</span>
        <input type="file" accept="image/*" @change="handleImageUpload" />
      </label>
      <button v-if="customMapImage" class="reset-btn" @click="resetCustomImage">Use default image</button>
      <span class="upload-hint">Upload stays local. Replace docs/public/Pharloom.png to publish.</span>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map-container">
      <!-- Region Layer -->
      <div v-show="activeLayer === 'region'" class="map-layer region-layer">
        <img :src="displayedMap" alt="Pharloom Region Map" class="map-image" />
        
        <!-- SVG Overlay for clickable regions -->
        <svg class="region-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          <template v-for="region in regions" :key="region.id">
            <polygon
              v-if="region.hitArea?.type === 'polygon'"
              :points="region.hitArea.points.map(point => point.join(',')).join(' ')"
              class="region-hitbox"
              @click="navigateToRegion(region.id)"
              @mousemove="handleMouseMove($event, region)"
              @mouseleave="handleMouseLeave"
            />
            <rect
              v-else
              :x="region.hitArea?.x"
              :y="region.hitArea?.y"
              :width="region.hitArea?.width"
              :height="region.hitArea?.height"
              class="region-hitbox"
              @click="navigateToRegion(region.id)"
              @mousemove="handleMouseMove($event, region)"
              @mouseleave="handleMouseLeave"
            />
          </template>
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

    <details class="map-editor">
      <summary>Map calibration &amp; data tools</summary>
      <div class="editor-actions">
        <button class="reset-btn" @click="downloadRegionData">Download JSON</button>
        <label class="upload-btn compact">
          <span>Import JSON</span>
          <input type="file" accept="application/json" @change="handleRegionDataUpload" />
        </label>
        <button class="ghost-btn" @click="resetRegionData">Reset to defaults</button>
      </div>
      <p class="editor-note">
        Coordinates are stored as percentages of the map image. Use these fields to line up hotspots with any uploaded image,
        then download the JSON and replace <code>docs/.vitepress/theme/data/mapData.js</code>.
      </p>
      <div class="region-editor-grid">
        <div v-for="region in regions" :key="region.id" class="region-card">
          <strong>{{ region.name }}</strong>
          <template v-if="region.hitArea?.type === 'rect'">
            <div class="editor-inputs">
              <label>
                X (%):
                <input type="number" v-model.number="region.hitArea.x" min="0" max="100" step="0.1" />
              </label>
              <label>
                Y (%):
                <input type="number" v-model.number="region.hitArea.y" min="0" max="100" step="0.1" />
              </label>
              <label>
                Width (%):
                <input type="number" v-model.number="region.hitArea.width" min="0" max="100" step="0.1" />
              </label>
              <label>
                Height (%):
                <input type="number" v-model.number="region.hitArea.height" min="0" max="100" step="0.1" />
              </label>
            </div>
          </template>
          <template v-else-if="region.hitArea?.type === 'polygon'">
            <label class="polygon-field">
              Points (x,y pairs):
              <textarea :value="polygonString(region)" @input="handlePolygonInput(region.id, $event.target.value)"></textarea>
            </label>
          </template>
          <template v-else>
            <p class="editor-note">Unsupported hit area type.</p>
          </template>
        </div>
      </div>
    </details>
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

.map-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.upload-btn {
  position: relative;
  overflow: hidden;
  border: 1px dashed var(--vp-c-divider);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  background: var(--vp-c-bg-soft);
}

.upload-btn input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.reset-btn {
  border: none;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-contrast);
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.upload-hint {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
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

.map-editor {
  margin-top: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg);
}

.map-editor summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.ghost-btn {
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}

.editor-note {
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.editor-note code {
  font-size: 0.8rem;
}

.region-editor-grid {
  margin-top: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.region-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.75rem;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 0.5rem;
}

.editor-inputs label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.editor-inputs input,
.polygon-field textarea {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.25rem 0.35rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.polygon-field textarea {
  min-height: 90px;
  font-family: ui-monospace, SFMono-Regular, SFMono, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.8rem;
}

.upload-btn.compact {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
}
</style>
