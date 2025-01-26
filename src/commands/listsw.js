const { jidNormalizedUser } = require("@whiskeysockets/baileys");
const { getContentType } = require("../lib/serialize.js");

module.exports = {
  cmd: ["listsw"],
  name: "listsw",
  description: "List Status story",
  async execute(m, { client, store }) {
    if (!store.messages["status@broadcast"].array.length === 0)
      return m.reply("Gaada 1 status pun");
    let stories = store.messages["status@broadcast"].array;
    let story = stories.filter(
      (v) => v.message && v.message.protocolMessage?.type !== 0,
    );
    if (story.length === 0) m.reply("Status gaada");
    const result = {};
    story.forEach((obj) => {
      let participant = obj.key.participant || obj.participant;
      participant = jidNormalizedUser(
        participant === "status_me" ? client.user.id : participant,
      );
      if (!result[participant]) {
        result[participant] = [];
      }
      result[participant].push(obj);
    });
    let type = (mType) =>
      getContentType(mType) === "extendedTextMessage"
        ? "text"
        : getContentType(mType).replace("Message", "");
    let text = "";
    for (let id of Object.keys(result)) {
      if (!id) return;
      text += `*- ${client.getName(id)}*\n`;
      text += `${result[id].map((v, i) => `${i + 1}. ${type(v.message)}`).join("\n")}\n\n`;
    }
    await m.reply(text.trim(), { mentions: Object.keys(result) });
  },
};
