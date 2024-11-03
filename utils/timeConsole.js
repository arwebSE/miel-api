export default function timeConsole(...args) {
    const d = new Date();
    console.log(`[${d.toLocaleTimeString()}]`, ...args);
}
