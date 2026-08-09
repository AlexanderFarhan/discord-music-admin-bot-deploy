import { EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';

export const COLORS = Object.freeze({
  primary: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  danger: 0xed4245,
});

export async function replyPrivate(interaction, content) {
  const payload = typeof content === 'string' ? { content } : content;
  const finalPayload = { ...payload, flags: MessageFlags.Ephemeral };

  if (interaction.deferred || interaction.replied) {
    delete finalPayload.flags;
    return interaction.followUp({ ...finalPayload, flags: MessageFlags.Ephemeral });
  }
  return interaction.reply(finalPayload);
}

export function baseEmbed(title, color = COLORS.primary) {
  return new EmbedBuilder().setColor(color).setTitle(title).setTimestamp();
}

export function requireMemberPermission(interaction, permission, label) {
  if (interaction.memberPermissions?.has(permission)) return true;
  void replyPrivate(interaction, `Kamu memerlukan izin **${label}** untuk tindakan ini.`);
  return false;
}

export function requireBotPermission(interaction, permission, label) {
  const botMember = interaction.guild?.members.me;
  const permissions = interaction.channel?.permissionsFor(botMember);
  if (permissions?.has(permission)) return true;
  void replyPrivate(interaction, `Bot memerlukan izin **${label}** di kanal ini.`);
  return false;
}

export function sameVoiceChannel(interaction) {
  const memberChannel = interaction.member?.voice?.channel;
  if (!memberChannel) {
    void replyPrivate(interaction, 'Masuk ke voice channel terlebih dahulu.');
    return null;
  }

  const botChannelId = interaction.guild?.members.me?.voice?.channelId;
  if (botChannelId && botChannelId !== memberChannel.id) {
    void replyPrivate(interaction, 'Kamu harus berada di voice channel yang sama dengan bot.');
    return null;
  }

  return memberChannel;
}

export function auditReason(interaction, reason) {
  const text = reason?.trim() || 'Tidak ada alasan';
  return `${text.slice(0, 430)} | Oleh: ${interaction.user.tag} (${interaction.user.id})`;
}

export async function sendModerationLog(interaction, config, data) {
  if (!config.modLogChannelId) return;

  const channel = await interaction.guild.channels
    .fetch(config.modLogChannelId)
    .catch(() => null);
  if (!channel?.isTextBased()) return;

  const embed = baseEmbed(`Moderasi: ${data.action}`, data.color ?? COLORS.warning)
    .addFields(
      { name: 'Moderator', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
      { name: 'Target', value: data.target || `#${interaction.channel?.name ?? 'kanal'}`, inline: true },
      { name: 'Alasan', value: data.reason || 'Tidak ada alasan' },
    );

  await channel.send({ embeds: [embed] }).catch(() => null);
}

export { PermissionFlagsBits };

