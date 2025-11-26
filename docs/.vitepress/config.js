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
