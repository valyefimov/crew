import pc from "picocolors";

export const logo = () =>
  [
    pc.magenta("   ●  ●   ") + pc.bold("crew"),
    pc.cyan("    ●     ") + pc.dim("your AI colleagues, at home"),
  ].join("\n");

export const ok = (msg: string) => console.log(`${pc.green("✔")} ${msg}`);
export const warn = (msg: string) => console.log(`${pc.yellow("!")} ${msg}`);
export const fail = (msg: string) => console.error(`${pc.red("✖")} ${msg}`);
export const dim = pc.dim;
export const bold = pc.bold;
export const cyan = pc.cyan;
export const magenta = pc.magenta;
