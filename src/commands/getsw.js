const { delay } = require("@whiskeysockets/baileys");

module.exports = {
  cmd: ["getsw"],
  name: "getsw",
  description: "Mengambil Status whatsapp story",
  async execute(m, { client, store }) {
    if (!store.messages["status@broadcast"].array.length === 0)
      return m.reply("Gaada 1 status pun");
    let contacts = Object.values(store.contacts);
    let [who, value] = m.text.split(/[,|\-+&]/);
    value = value?.replace(/\D+/g, "");

    let sender;
    if (m.mentions.length !== 0) sender = m.mentions[0];
    else if (m.text)
      sender = contacts.find((v) =>
        [v.name, v.verifiedName, v.notify].some(
          (name) => name && name.toLowerCase().includes(who.toLowerCase()),
        ),
      )?.id;

    let stories = store.messages["status@broadcast"].array;
    let story = stories
      .filter(
        (v) =>
          (v.key && v.key.participant === sender) || v.participant === sender,
      )
      .filter((v) => v.message && v.message.protocolMessage?.type !== 0);
    if (story.length === 0) return m.reply("Gaada sw nya");
    if (value) {
      if (story.length < value) return m.reply("Jumlahnya ga sampe segitu");
      await m.reply({ forward: story[value - 1], force: true });
    } else {
      for (let msg of story) {
        await delay(1500);
        await m.reply({ forward: msg, force: true });
      }
    }
  },
};
