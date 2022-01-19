Deno.test("mock data", () => {
  let data = [
    {
      dateCreated: new Date().toISOString(),
      identifier: "0",
    },
  ];
  for (let i = 1; i < 102; i++) {
    data[i] = {
      identifier: i.toString(),
      dateCreated: new Date(getRandomInt(5000000, 10000000000)).toISOString(),
    };
  }
  const newData: Record<string, Record<string, string>> = {};
  for (const item of data) {
    newData[item.identifier] = item;
  }
  // console.log(JSON.stringify(newData));
});
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
