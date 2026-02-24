function log(level, message, meta = {}) {
    const time = new Date().toISOString();
    console.log(
        JSON.stringify({
            time, level, message, ...meta
        })
    );
}
module.exports = {log}