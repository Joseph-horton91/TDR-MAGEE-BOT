const { appendApprovedPlayerToPlayerList } = require("./playerList");

const fakeUser = {
  id: "999999999999999999",
  username: "MageeTest",
};

const fakeData = {
  playerName: "Magee Test Player",
  dartCounterUsername: "MageeDC",
  threeDartAverage: "55.55",
  country: "Australia",
  location: "QLD",
};

async function test() {
  const result = await appendApprovedPlayerToPlayerList(
    fakeUser,
    fakeData
  );

  console.log(result);
}

test().catch(console.error);