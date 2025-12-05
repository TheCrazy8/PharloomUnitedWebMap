import { SearchPlugin } from "vitepress-plugin-search";
import { defineConfig } from "vitepress";
export default defineConfig({
  vite: { plugins: [SearchPlugin(options)] }
});
export default {
    title: "Pharloom United Web Map",
    description: "A map of the Pharloom United roleplay world.",
    base: "/PharloomUnitedWebMap/",
    themeConfig: {
        siteTitle: "Pharloom United Web Map",
        footer: {
            message: "Released under the CC BY-NC-ND 4.0 License.",
            copyright: "Copyright © 2025-present TheCrazy8",
        },
        nav: [
        ],
        sidebar: [
        ],
        socialLinks: [
            { icon: 'discord', link: 'https://discord.gg/qjyaSwRRk' },
        ],

        lastUpdated: {
              text: 'Updated at',
              formatOptions: {
                    dateStyle: 'full',
                    timeStyle: 'medium'
              }
        },
        search: {
              provider: 'local'
        },
    },
    head: [
        ['link', { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }]
    ],
};
