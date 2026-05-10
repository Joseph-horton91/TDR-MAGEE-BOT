const { generateNextPlayerId } = require("./playerList");

async function test() {
  const nextId = await generateNextPlayerId();
  console.log(`Next Player ID will be: ${nextId}`);
}

test().catch(console.error);
