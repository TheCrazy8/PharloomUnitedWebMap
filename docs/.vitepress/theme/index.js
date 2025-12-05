import {VPLTheme} from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer.min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue';
import { useRoute } from 'vitepress';
import InteractiveMap from './components/InteractiveMap.vue';

export default {
...VPLTheme,
enhanceApp(ctx) {
VPLTheme.enhanceApp(ctx);
// Register global component (optional)
ctx.app.component('vImageViewer', vImageViewer);
// Register InteractiveMap component
ctx.app.component('InteractiveMap', InteractiveMap);
},
setup() {
const route = useRoute();
// Enable the plugin
imageViewer(route);
}
};
