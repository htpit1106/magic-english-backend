function tokenize(text) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    )
  ];
}

module.exports = { tokenize };
