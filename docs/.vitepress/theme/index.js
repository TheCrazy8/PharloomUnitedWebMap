import {VPLTheme} from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer.min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue';
import { useRoute } from 'vitepress';
export default {
...VPLTheme,
enhanceApp(ctx) {
VPLTheme.enhanceApp(ctx);
// Register global component (optional)
ctx.app.component('vImageViewer', vImageViewer);
},
setup() {
const route = useRoute();
// Enable the plugin
imageViewer(route);
}
};
