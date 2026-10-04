import { defineConfig, type DefaultTheme } from "vitepress";

const repo = "https://github.com/valyefimov/crew";

type Labels = Record<
  "start" | "guide" | "gettingStarted" | "agents" | "memory" | "files" | "telegram" | "cli" | "config" | "reference" | "api" | "architecture" | "roadmap",
  string
>;

function sidebar(prefix: string, l: Labels): DefaultTheme.SidebarItem[] {
  return [
    {
      text: l.start,
      items: [{ text: l.gettingStarted, link: `${prefix}/guide/getting-started` }],
    },
    {
      text: l.guide,
      items: [
        { text: l.agents, link: `${prefix}/guide/agents` },
        { text: l.memory, link: `${prefix}/guide/memory` },
        { text: l.files, link: `${prefix}/guide/files` },
        { text: l.telegram, link: `${prefix}/guide/telegram` },
        { text: l.cli, link: `${prefix}/guide/cli` },
        { text: l.config, link: `${prefix}/guide/configuration` },
      ],
    },
    {
      text: l.reference,
      items: [
        { text: l.api, link: `${prefix}/guide/api` },
        { text: l.architecture, link: `${prefix}/guide/architecture` },
        { text: l.roadmap, link: `${prefix}/guide/roadmap` },
      ],
    },
  ];
}

const en: Labels = {
  start: "Start here", guide: "Guide", gettingStarted: "Getting started", agents: "Agents", memory: "Memory",
  files: "Files", telegram: "Telegram", cli: "CLI", config: "Configuration", reference: "Reference",
  api: "HTTP & WebSocket API", architecture: "Architecture", roadmap: "Roadmap",
};
const ru: Labels = {
  start: "С чего начать", guide: "Руководство", gettingStarted: "Быстрый старт", agents: "Агенты", memory: "Память",
  files: "Файлы", telegram: "Telegram", cli: "CLI", config: "Настройки", reference: "Справочник",
  api: "HTTP и WebSocket API", architecture: "Архитектура", roadmap: "Дорожная карта",
};
const uk: Labels = {
  start: "З чого почати", guide: "Посібник", gettingStarted: "Швидкий старт", agents: "Агенти", memory: "Пам'ять",
  files: "Файли", telegram: "Telegram", cli: "CLI", config: "Налаштування", reference: "Довідник",
  api: "HTTP і WebSocket API", architecture: "Архітектура", roadmap: "Дорожня карта",
};

export default defineConfig({
  title: "Crew",
  description: "A lightweight local-first workspace for your persistent AI colleagues",
  base: "/crew/",
  cleanUrls: true,
  ignoreDeadLinks: [/^https?:\/\/localhost/],
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: "/crew/logo.svg", type: "image/svg+xml" }],
    ["meta", { property: "og:image", content: "https://valyefimov.github.io/crew/media/cover.png" }],
    ["meta", { name: "theme-color", content: "#8b5cf6" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    socialLinks: [
      { icon: "github", link: repo },
      { icon: "npm", link: "https://www.npmjs.com/package/@vefimov/crew" },
    ],
    search: { provider: "local" },
    editLink: { pattern: `${repo}/edit/main/docs/:path` },
    footer: { message: "MIT License", copyright: "© 2026 Valentyn Yefimov" },
  },
  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Guide", link: "/guide/getting-started" },
          { text: "API", link: "/guide/api" },
          { text: "Roadmap", link: "/guide/roadmap" },
        ],
        sidebar: sidebar("", en),
      },
    },
    ru: {
      label: "Русский",
      lang: "ru",
      description: "Лёгкое local-first пространство для твоих постоянных AI-коллег",
      themeConfig: {
        nav: [
          { text: "Руководство", link: "/ru/guide/getting-started" },
          { text: "API", link: "/ru/guide/api" },
          { text: "Планы", link: "/ru/guide/roadmap" },
        ],
        sidebar: sidebar("/ru", ru),
        outline: { label: "На этой странице" },
        docFooter: { prev: "Назад", next: "Далее" },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: "Редактировать страницу" },
        lastUpdated: { text: "Обновлено" },
        returnToTopLabel: "Наверх",
        sidebarMenuLabel: "Меню",
        darkModeSwitchLabel: "Тема",
        langMenuLabel: "Язык",
      },
    },
    uk: {
      label: "Українська",
      lang: "uk",
      description: "Легкий local-first простір для твоїх постійних AI-колег",
      themeConfig: {
        nav: [
          { text: "Посібник", link: "/uk/guide/getting-started" },
          { text: "API", link: "/uk/guide/api" },
          { text: "Плани", link: "/uk/guide/roadmap" },
        ],
        sidebar: sidebar("/uk", uk),
        outline: { label: "На цій сторінці" },
        docFooter: { prev: "Назад", next: "Далі" },
        editLink: { pattern: `${repo}/edit/main/docs/:path`, text: "Редагувати сторінку" },
        lastUpdated: { text: "Оновлено" },
        returnToTopLabel: "Нагору",
        sidebarMenuLabel: "Меню",
        darkModeSwitchLabel: "Тема",
        langMenuLabel: "Мова",
      },
    },
  },
});
